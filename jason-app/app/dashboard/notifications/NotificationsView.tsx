'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell, CheckCircle, Warning, Info, House, Receipt, Bank, BookOpen,
  ChatCircleDots, Check, ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
import type { AppNotification, NotificationCategory } from '@/lib/notifications/types'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/actions'

interface Props {
  initialNotifications: AppNotification[]
}

const CATEGORY_META: Record<NotificationCategory, { label: string; icon: React.ReactNode; color: string }> = {
  sejour:    { label: 'Séjour',        icon: <House size={14} weight="fill" />,           color: 'var(--accent-text)' },
  fiscal:    { label: 'Fiscal',        icon: <Receipt size={14} weight="fill" />,         color: '#FFD56B' },
  sync:      { label: 'Synchro',       icon: <Bank size={14} weight="fill" />,            color: '#60A5FA' },
  guide:     { label: 'Guide',         icon: <BookOpen size={14} weight="fill" />,        color: '#A78BFA' },
  chez_nous: { label: 'Chez Nous',     icon: <ChatCircleDots size={14} weight="fill" />,  color: '#F472B6' },
  system:    { label: 'Système',       icon: <Bell size={14} weight="fill" />,            color: 'var(--text-3)' },
}

const SEVERITY_META: Record<string, { icon: React.ReactNode; color: string }> = {
  info:    { icon: <Info size={14} weight="fill" />,        color: 'var(--text-3)' },
  warning: { icon: <Warning size={14} weight="fill" />,     color: '#FFD56B' },
  error:   { icon: <Warning size={14} weight="fill" />,     color: '#f87171' },
  success: { icon: <CheckCircle size={14} weight="fill" />, color: 'var(--success-1)' },
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  const h = Math.floor(min / 60)
  const j = Math.floor(h / 24)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  if (h < 24) return `il y a ${h} h`
  if (j === 1) return 'hier'
  if (j < 7) return `il y a ${j} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Filter = 'all' | 'unread' | NotificationCategory

export default function NotificationsView({ initialNotifications }: Props) {
  const [items, setItems] = useState(initialNotifications)
  const [filter, setFilter] = useState<Filter>('unread')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'unread') return items.filter(n => !n.read_at)
    return items.filter(n => n.category === filter)
  }, [items, filter])

  const unreadCount = items.filter(n => !n.read_at).length

  function handleMarkOne(id: string) {
    // Optimiste
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    startTransition(async () => {
      const res = await markNotificationRead(id)
      if (!res.ok) {
        // Rollback
        setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: null } : n))
      }
    })
  }

  function handleMarkAll() {
    if (unreadCount === 0) return
    const now = new Date().toISOString()
    const snapshot = items
    setItems(prev => prev.map(n => n.read_at ? n : { ...n, read_at: now }))
    startTransition(async () => {
      const res = await markAllNotificationsRead()
      if (!res.ok) setItems(snapshot)
    })
  }

  const filterBtns: Array<{ key: Filter; label: string; count?: number }> = [
    { key: 'unread', label: 'Non lues', count: unreadCount },
    { key: 'all',    label: 'Toutes',   count: items.length },
    { key: 'sejour', label: 'Séjour' },
    { key: 'fiscal', label: 'Fiscal' },
    { key: 'sync',   label: 'Synchro' },
  ]

  return (
    <div style={s.page}>
      <header style={s.hero}>
        <span style={s.heroBadge}>
          <Bell size={13} weight="fill" /> Mes alertes
        </span>
        <h1 style={s.heroTitle}>
          Tes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>notifications</em>
        </h1>
        <p style={s.heroDesc}>
          Arrivées imminentes, plafonds fiscaux, paiements à relancer, synchros à vérifier. Tout ce qui demande ton attention.
        </p>
      </header>

      <div style={s.toolbar}>
        <div style={s.filters} role="tablist" aria-label="Filtres notifications">
          {filterBtns.map(f => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              style={{ ...s.filterBtn, ...(filter === f.key ? s.filterBtnActive : {}) }}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span style={s.filterCount}>{f.count}</span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={pending} style={s.markAllBtn} aria-label="Marquer toutes les notifications comme lues">
            <Check size={13} weight="bold" /> Tout marquer lu
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon} aria-hidden="true">
            <Bell size={32} weight="duotone" color="var(--text-3)" />
          </div>
          <p style={s.emptyTitle}>
            {filter === 'unread' ? 'Tu es à jour 🎉' : 'Aucune notification'}
          </p>
          <p style={s.emptyBody}>
            {filter === 'unread'
              ? 'Tu as lu toutes tes alertes. On te préviendra dès qu\'il se passe quelque chose.'
              : 'Aucune notification dans cette catégorie pour l\'instant.'}
          </p>
        </div>
      ) : (
        <ul style={s.list}>
          {filtered.map(n => {
            const cat = CATEGORY_META[n.category]
            const sev = SEVERITY_META[n.severity] ?? SEVERITY_META.info
            const isUnread = !n.read_at
            return (
              <li key={n.id} style={{ ...s.item, ...(isUnread ? s.itemUnread : {}) }}>
                <div style={{ ...s.itemIcon, color: sev.color, background: sev.color + '14', borderColor: sev.color + '33' }} aria-hidden="true">
                  {sev.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.itemHead}>
                    <span style={{ ...s.itemBadge, color: cat.color, borderColor: cat.color + '33' }}>
                      {cat.icon} {cat.label}
                    </span>
                    <span style={s.itemDate}>{fmtRelative(n.created_at)}</span>
                  </div>
                  <p style={s.itemTitle}>{n.title}</p>
                  {n.body && <p style={s.itemBody}>{n.body}</p>}
                  <div style={s.itemActions}>
                    {n.cta_href && (
                      <Link href={n.cta_href} style={s.itemCta} onClick={() => isUnread && handleMarkOne(n.id)}>
                        {n.cta_label ?? 'Voir'} <ArrowRight size={11} weight="bold" />
                      </Link>
                    )}
                    {isUnread && (
                      <button
                        onClick={() => handleMarkOne(n.id)}
                        disabled={pending}
                        style={s.itemMarkRead}
                        aria-label="Marquer cette notification comme lue"
                      >
                        <Check size={11} weight="bold" /> Marquer lue
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 'clamp(18px, 2.5vw, 24px)' },
  hero: { marginBottom: '4px' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: 'var(--accent-text)', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '12px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 8px',
  },
  heroDesc: { fontSize: '14px', lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '600px', margin: 0 },

  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '12px' },
  filters: {
    display: 'flex', gap: '6px',
    padding: '5px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px',
    flexWrap: 'wrap' as const,
  },
  filterBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  filterBtnActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    fontWeight: 600,
  },
  filterCount: {
    fontSize: '10.5px', fontWeight: 700,
    padding: '1px 7px', borderRadius: '999px',
    background: 'rgba(255,213,107,0.12)', color: 'var(--accent-text)',
  },
  markAllBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontSize: '12.5px', fontWeight: 600, fontFamily: 'inherit',
    border: 'none',
  },

  empty: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', textAlign: 'center' as const,
    padding: 'clamp(40px, 6vw, 80px) 20px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '20px',
    background: 'var(--bg-2)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: '14px',
  },
  emptyTitle: { fontSize: '17px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' },
  emptyBody: { fontSize: '13px', color: 'var(--text-2)', maxWidth: '320px', lineHeight: 1.6, margin: 0 },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px', listStyle: 'none', padding: 0, margin: 0 },
  item: {
    display: 'flex', gap: '14px',
    padding: '14px 16px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    transition: 'background .15s, border-color .15s',
  },
  itemUnread: {
    background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255,213,107,0.05) 100%)',
    borderColor: 'rgba(255,213,107,0.22)',
  },
  itemIcon: {
    width: '36px', height: '36px', borderRadius: '11px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, border: '1px solid',
  },
  itemHead: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '4px', flexWrap: 'wrap' as const,
  },
  itemBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.3px',
    padding: '2px 7px', borderRadius: '999px',
    border: '1px solid', textTransform: 'uppercase' as const,
  },
  itemDate: { fontSize: '11px', color: 'var(--text-3)' },
  itemTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px', lineHeight: 1.4 },
  itemBody: { fontSize: '12.5px', color: 'var(--text-2)', margin: '0 0 8px', lineHeight: 1.55 },
  itemActions: {
    display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const, marginTop: '6px',
  },
  itemCta: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 12px', borderRadius: '8px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    fontSize: '12px', fontWeight: 600,
    textDecoration: 'none', fontFamily: 'inherit',
  },
  itemMarkRead: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
    background: 'transparent', color: 'var(--text-3)',
    border: '1px solid var(--border)',
    fontSize: '11.5px', fontWeight: 500, fontFamily: 'inherit',
  },
}
