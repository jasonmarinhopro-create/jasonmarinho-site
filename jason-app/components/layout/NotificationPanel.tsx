'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, Sparkle, ArrowUp, Wrench, Star, ArrowRight } from '@phosphor-icons/react'
import { CHANGELOG, ChangelogTag } from '@/lib/constants/changelog'

const VISIBLE_COUNT = 3

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  readIds: Set<string>
  onMarkAllRead: () => void
}

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

export default function NotificationPanel({ open, onClose, readIds, onMarkAllRead }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

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
        top: 'calc(var(--header-h, 60px) + 10px)',
        right: '16px',
        width: 'min(360px, calc(100vw - 32px))',
        background: 'var(--bg-2)',
        border: '1px solid var(--border-2)',
        borderRadius: '16px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px var(--surface)',
        zIndex: 160,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'notifPop 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes notifPop {
          from { opacity: 0; transform: scale(0.95) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.title}>Nouveautés</span>
          {unreadCount > 0 && (
            <span style={s.unreadPill}>{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} style={s.markAllBtn} title="Tout marquer comme lu">
              Tout lu
            </button>
          )}
          <button onClick={onClose} style={s.closeBtn} aria-label="Fermer">
            <X size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={s.divider} />

      {/* Entries */}
      <div style={s.list}>
        {visibleEntries.map((entry, i) => {
          const isRead = readIds.has(entry.id)
          const tag = TAG_CONFIG[entry.tag]
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
              {/* Unread dot */}
              <div style={s.dotWrap}>
                <div style={{
                  ...s.dot,
                  background: isRead ? 'transparent' : tag.color,
                  border: isRead ? '1.5px solid var(--border)' : 'none',
                  boxShadow: isRead ? 'none' : `0 0 5px ${tag.color}80`,
                }} />
              </div>

              {/* Content */}
              <div style={s.entryBody}>
                <div style={s.entryMeta}>
                  <span style={{ ...s.tag, color: tag.color, background: tag.bg }}>
                    {tag.icon}
                    {tag.label}
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

      {/* Divider */}
      <div style={s.divider} />

      {/* Footer — "En savoir plus" */}
      <div style={s.footer}>
        <Link
          href="/dashboard/nouveautes"
          onClick={onClose}
          style={s.learnMoreBtn}
        >
          En savoir plus
          <ArrowRight size={13} weight="bold" />
        </Link>
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
