'use client'

import { useEffect, useRef } from 'react'
import { X, Sparkle, ArrowUp, Wrench, Star } from '@phosphor-icons/react'
import { CHANGELOG, ChangelogTag } from '@/lib/constants/changelog'

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
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
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

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 150,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nouveautés de la plateforme"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(400px, 94vw)',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border-2)',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.4)',
          zIndex: 160,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0,0.15,1)',
          overflowY: 'hidden',
        }}
      >
        {/* Header */}
        <div style={styles.panelHeader}>
          <div style={styles.panelTitleRow}>
            <div style={styles.panelTitleGroup}>
              <span style={styles.panelTitle}>Nouveautés</span>
              {unreadCount > 0 && (
                <span style={styles.unreadPill}>{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
              )}
            </div>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Fermer">
              <X size={18} weight="bold" />
            </button>
          </div>
          <p style={styles.panelSubtitle}>
            Suis les améliorations et nouveautés de la plateforme en temps réel.
          </p>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} style={styles.markAllBtn}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* List */}
        <div style={styles.list}>
          {CHANGELOG.map((entry, i) => {
            const isRead = readIds.has(entry.id)
            const tag = TAG_CONFIG[entry.tag]
            return (
              <div
                key={entry.id}
                style={{
                  ...styles.entry,
                  ...(i < CHANGELOG.length - 1 ? styles.entryBorder : {}),
                  opacity: isRead ? 0.55 : 1,
                }}
              >
                {/* Unread dot */}
                <div style={styles.dotCol}>
                  <div style={{
                    ...styles.dot,
                    background: isRead ? 'transparent' : tag.color,
                    border: isRead ? '1.5px solid var(--border)' : 'none',
                    boxShadow: isRead ? 'none' : `0 0 6px ${tag.color}80`,
                  }} />
                  {i < CHANGELOG.length - 1 && <div style={styles.dotLine} />}
                </div>

                {/* Content */}
                <div style={styles.entryContent}>
                  <div style={styles.entryMeta}>
                    <span style={{ ...styles.tag, color: tag.color, background: tag.bg }}>
                      {tag.icon}
                      {tag.label}
                    </span>
                    <span style={styles.date}>{formatDate(entry.date)}</span>
                  </div>
                  <div style={styles.entryTitle}>{entry.title}</div>
                  <div style={styles.entryDesc}>{entry.description}</div>
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div style={styles.footer}>
            <span style={styles.footerText}>Tu es à jour ✦</span>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panelHeader: {
    padding: '24px 24px 20px',
    flexShrink: 0,
  },
  panelTitleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '8px',
  },
  panelTitleGroup: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  panelTitle: {
    fontFamily: 'Fraunces, serif',
    fontSize: '20px',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.4px',
  },
  unreadPill: {
    fontSize: '11px', fontWeight: 600,
    padding: '2px 9px', borderRadius: '100px',
    background: 'rgba(99,214,131,0.15)',
    color: '#63D683',
    letterSpacing: '0.2px',
  },
  closeBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)',
    flexShrink: 0,
  },
  panelSubtitle: {
    fontSize: '13px', color: 'var(--text-3)',
    lineHeight: '1.5', marginBottom: '14px',
  },
  markAllBtn: {
    background: 'none', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '6px 14px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-3)', cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  divider: {
    height: '1px', background: 'var(--border)', flexShrink: 0,
  },
  list: {
    flex: 1, overflowY: 'auto',
    padding: '8px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border) transparent',
  } as React.CSSProperties,
  entry: {
    display: 'flex', gap: '0',
    padding: '0 24px',
  },
  entryBorder: {
    // border handled by dot line
  },
  dotCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginRight: '14px',
    paddingTop: '18px',
    flexShrink: 0,
  },
  dot: {
    width: '9px', height: '9px', borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  dotLine: {
    width: '1px',
    flex: 1,
    minHeight: '20px',
    background: 'var(--border)',
    marginTop: '6px',
  },
  entryContent: {
    paddingTop: '14px', paddingBottom: '20px',
    flex: 1, minWidth: 0,
  },
  entryMeta: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '7px', flexWrap: 'wrap' as const,
  },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 600,
    padding: '2px 8px', borderRadius: '100px',
    letterSpacing: '0.2px',
  },
  date: {
    fontSize: '11px', color: 'var(--text-muted)',
  },
  entryTitle: {
    fontSize: '14px', fontWeight: 600,
    color: 'var(--text)', marginBottom: '5px',
    lineHeight: '1.4',
  },
  entryDesc: {
    fontSize: '13px', color: 'var(--text-3)',
    lineHeight: '1.6',
  },
  footer: {
    padding: '20px 24px 32px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px', color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
}
