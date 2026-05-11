'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, Sparkle, ArrowUp, Wrench, Star, ArrowRight, ChatCircleDots } from '@phosphor-icons/react/dist/ssr'
import { CHANGELOG, ChangelogTag } from '@/lib/constants/changelog'

const VISIBLE_COUNT = 3

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  readIds: Set<string>
  onMarkAllRead: () => void
  /** Compteur de notifications Chez Nous non lues (récupéré dans Header). */
  chezNousUnread?: number
}

type Tab = 'nouveautes' | 'cheznous'

const TAG_CONFIG: Record<ChangelogTag, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  nouveau:      { label: 'Nouveau',       color: '#63D683', bg: 'rgba(99,214,131,0.12)',  icon: <Sparkle size={11} weight="fill" /> },
  amélioration: { label: 'Amélioration',  color: '#FFD56B', bg: 'rgba(255,213,107,0.13)', icon: <ArrowUp  size={11} weight="bold" /> },
  correction:   { label: 'Correction',    color: '#93C5FD', bg: 'rgba(147,197,253,0.13)', icon: <Wrench   size={11} weight="fill" /> },
  important:    { label: 'Important',     color: '#F472B6', bg: 'rgba(244,114,182,0.13)', icon: <Star     size={11} weight="fill" /> },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationPanel({ open, onClose, readIds, onMarkAllRead, chezNousUnread = 0 }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>('nouveautes')

  // Auto-switch sur l'onglet Chez Nous à l'ouverture s'il y a des notifs là-bas
  // et aucune nouveauté produit non lue : l'utilisateur va probablement vers le plus pressant.
  useEffect(() => {
    if (!open) return
    const productUnread = CHANGELOG.filter(e => !readIds.has(e.id)).length
    if (chezNousUnread > 0 && productUnread === 0) {
      setTab('cheznous')
    } else {
      setTab('nouveautes')
    }
  }, [open, chezNousUnread, readIds])

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const unreadCount = CHANGELOG.filter(e => !readIds.has(e.id)).length
  const visibleEntries = CHANGELOG.slice(0, VISIBLE_COUNT)

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Nouveautés de la plateforme"
      style={{
        position: 'fixed',
        top: 'calc(var(--header-h, 60px) + 8px)',
        right: 0,
        width: 'min(380px, 100vw)',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-2)',
        borderRight: 'none',
        borderRadius: '16px 0 0 16px',
        boxShadow: '-8px 16px 48px rgba(0,0,0,0.3)',
        zIndex: 160,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'notifPop 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes notifPop {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.title}>Notifications</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {tab === 'nouveautes' && unreadCount > 0 && (
            <button onClick={onMarkAllRead} style={s.markAllBtn} title="Tout marquer comme lu">
              Tout lu
            </button>
          )}
          <button onClick={onClose} style={s.closeBtn} aria-label="Fermer">
            <X size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={s.tabs}>
        <button
          onClick={() => setTab('nouveautes')}
          style={{ ...s.tab, ...(tab === 'nouveautes' ? s.tabActive : {}) }}
        >
          <Sparkle size={12} weight={tab === 'nouveautes' ? 'fill' : 'regular'} />
          Nouveautés
          {unreadCount > 0 && (
            <span style={s.tabBadge}>{unreadCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('cheznous')}
          style={{ ...s.tab, ...(tab === 'cheznous' ? s.tabActive : {}) }}
        >
          <ChatCircleDots size={12} weight={tab === 'cheznous' ? 'fill' : 'regular'} />
          Chez Nous
          {chezNousUnread > 0 && (
            <span style={s.tabBadge}>{chezNousUnread > 9 ? '9+' : chezNousUnread}</span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div style={s.divider} />

      {/* Contenu — Nouveautés produit */}
      {tab === 'nouveautes' && (
        <div style={s.list}>
          {visibleEntries.map((entry, i) => {
            const isRead = readIds.has(entry.id)
            const tagCfg = TAG_CONFIG[entry.tag]
            const isLast = i === visibleEntries.length - 1
            return (
              <div
                key={entry.id}
                style={{
                  ...s.entry,
                  ...(isLast ? {} : { borderBottom: '1px solid var(--border)' }),
                  opacity: isRead ? 0.5 : 1,
                }}
              >
                <div style={s.dotWrap}>
                  <div style={{
                    ...s.dot,
                    background: isRead ? 'transparent' : tagCfg.color,
                    border: isRead ? '1.5px solid var(--border)' : 'none',
                    boxShadow: isRead ? 'none' : `0 0 5px ${tagCfg.color}80`,
                  }} />
                </div>
                <div style={s.entryBody}>
                  <div style={s.entryMeta}>
                    <span style={{ ...s.tag, color: tagCfg.color, background: tagCfg.bg }}>
                      {tagCfg.icon}
                      {tagCfg.label}
                    </span>
                    <span style={s.date}>{formatDate(entry.date)}</span>
                  </div>
                  <div style={s.entryTitle}>{entry.title}</div>
                  <div style={s.entryDesc}>{entry.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contenu — Forum Chez Nous */}
      {tab === 'cheznous' && (
        <div style={s.list}>
          {chezNousUnread > 0 ? (
            <div style={s.cnNotice}>
              <div style={s.cnIcon}>
                <ChatCircleDots size={22} weight="fill" color="var(--accent-text)" />
              </div>
              <div style={s.cnText}>
                <div style={s.cnTitle}>
                  {chezNousUnread} notification{chezNousUnread > 1 ? 's' : ''} non lue{chezNousUnread > 1 ? 's' : ''}
                </div>
                <div style={s.cnDesc}>
                  Quelqu&apos;un t&apos;a répondu, mentionné ou réagi à ton activité dans le forum Chez Nous.
                </div>
              </div>
            </div>
          ) : (
            <div style={s.cnEmpty}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>Tu es à jour</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                Aucune nouvelle notification du forum.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={s.divider} />

      {/* Footer, lien adapté à l'onglet */}
      <div style={s.footer}>
        {tab === 'nouveautes' ? (
          <Link
            href="/dashboard/nouveautes"
            onClick={onClose}
            style={s.learnMoreBtn}
          >
            En savoir plus
            <ArrowRight size={13} weight="bold" />
          </Link>
        ) : (
          <Link
            href="/dashboard/chez-nous/notifications"
            onClick={onClose}
            style={s.learnMoreBtn}
          >
            Voir mes notifications Chez Nous
            <ArrowRight size={13} weight="bold" />
          </Link>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px 12px',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px', fontWeight: 400,
    color: 'var(--text)', letterSpacing: '-0.3px',
  },
  unreadPill: {
    fontSize: '10px', fontWeight: 700,
    padding: '2px 8px', borderRadius: '100px',
    background: 'rgba(99,214,131,0.15)', color: '#63D683',
    letterSpacing: '0.2px',
  },
  tabs: {
    display: 'flex', gap: '4px',
    padding: '0 12px 10px',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 12px', borderRadius: '8px',
    background: 'transparent', border: '1px solid transparent',
    color: 'var(--text-3)', fontSize: '12.5px',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.12s',
  },
  tabActive: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontWeight: 600,
  },
  tabBadge: {
    fontSize: '10px', fontWeight: 700,
    padding: '1px 6px', borderRadius: '999px',
    background: '#ef4444', color: '#fff',
    minWidth: '16px', textAlign: 'center' as const,
    lineHeight: 1.4,
  },

  cnNotice: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '18px 16px',
  },
  cnIcon: {
    width: '40px', height: '40px',
    background: 'var(--accent-bg-2)',
    border: '1px solid var(--accent-border)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cnText: { flex: 1, minWidth: 0 },
  cnTitle: {
    fontSize: '13px', fontWeight: 600,
    color: 'var(--text)', marginBottom: '4px',
  },
  cnDesc: {
    fontSize: '12px', color: 'var(--text-3)',
    lineHeight: 1.5,
  },
  cnEmpty: {
    textAlign: 'center' as const,
    padding: '32px 16px',
  },
  markAllBtn: {
    background: 'none', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '4px 9px',
    fontSize: '11px', fontWeight: 500, color: 'var(--text-3)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },
  closeBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '7px', width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0,
  },
  divider: { height: '1px', background: 'var(--border)', flexShrink: 0 },

  list: { display: 'flex', flexDirection: 'column' },
  entry: {
    display: 'flex', alignItems: 'flex-start', gap: '0',
    padding: '14px 16px',
  },
  dotWrap: {
    paddingTop: '4px', marginRight: '12px', flexShrink: 0,
  },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%',
    transition: 'background 0.2s',
  },
  entryBody: { flex: 1, minWidth: 0 },
  entryMeta: {
    display: 'flex', alignItems: 'center', gap: '7px',
    marginBottom: '5px', flexWrap: 'wrap' as const,
  },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: 600,
    padding: '2px 7px', borderRadius: '100px',
    letterSpacing: '0.2px',
  },
  date: { fontSize: '11px', color: 'var(--text-muted)' },
  entryTitle: {
    fontSize: '13px', fontWeight: 600,
    color: 'var(--text)', marginBottom: '3px', lineHeight: '1.35',
  },
  entryDesc: {
    fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } as React.CSSProperties,

  footer: {
    padding: '10px 16px',
    display: 'flex', justifyContent: 'center',
  },
  learnMoreBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 20px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.22)',
    color: 'var(--accent-text)',
    fontSize: '13px', fontWeight: 600,
    textDecoration: 'none',
    width: '100%', justifyContent: 'center' as const,
    transition: 'background 0.15s',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
}
