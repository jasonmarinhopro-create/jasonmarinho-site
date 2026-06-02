'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  X, User, House, CalendarBlank, Sparkle, ArrowSquareOut,
  Broom, CheckCircle, Phone, MapPin,
} from '@phosphor-icons/react/dist/ssr'
import type { SejourEvent, MenageSlot } from './page'

type Props = {
  sejour: SejourEvent
  /** Créneau ménage rattaché à ce séjour (date_depart match). Peut être null. */
  menageSlot: MenageSlot | null
  /** Anchor element to position popover near (button/event clicked). */
  anchorRect: DOMRect | null
  onClose: () => void
  /** Marque le ménage comme fait — crée un calendar_event 'menage' à la date du checkout. */
  onMarkMenageDone: () => void | Promise<void>
}

function fmtDateFR(date: string): string {
  try {
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch { return date }
}

function fmtDateShort(date: string): string {
  try {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch { return date }
}

export default function SejourPopover({ sejour, menageSlot, anchorRect, onClose, onMarkMenageDone }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    // Délai pour ne pas capturer le click qui a ouvert le popover
    setTimeout(() => document.addEventListener('mousedown', onClickOutside), 0)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  // Positionnement : tenter de placer sous l'anchor, sinon centré viewport.
  const style: React.CSSProperties = (() => {
    if (!anchorRect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    const popoverWidth = 340
    const margin = 8
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024
    let left = anchorRect.left
    // Si dépasse à droite, on aligne à droite
    if (left + popoverWidth + margin > viewportW) {
      left = Math.max(margin, viewportW - popoverWidth - margin)
    }
    return {
      position: 'fixed',
      top: anchorRect.bottom + 6,
      left,
      width: popoverWidth,
      maxWidth: 'calc(100vw - 16px)',
      zIndex: 100,
    }
  })()

  return (
    <>
      {/* Overlay invisible juste pour stopper la propagation */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'transparent' }} />
      <div ref={ref} style={{ ...s.wrap, ...style }} role="dialog" aria-label="Détails du séjour">
        <button onClick={onClose} aria-label="Fermer" style={s.closeBtn}>
          <X size={14} weight="bold" />
        </button>

        {/* En-tête */}
        <div style={s.header}>
          <div style={s.headerIcon}>
            <User size={16} weight="duotone" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.title}>{sejour.voyageur_label}</div>
            <div style={s.subtitle}>
              <House size={11} weight="duotone" /> {sejour.logement_label}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div style={s.dateBlock}>
          <CalendarBlank size={13} weight="duotone" style={{ color: 'var(--text-muted)' }} />
          <span>
            <strong>{fmtDateShort(sejour.date_arrivee)}</strong> → <strong>{fmtDateShort(sejour.date_depart)}</strong>
          </span>
        </div>

        {/* Bloc ménage : créneau auto + actions */}
        {menageSlot && (
          <div style={s.menageBlock}>
            <div style={s.menageHead}>
              <Broom size={13} weight="duotone" style={{ color: '#fb923c' }} />
              <span>Ménage prévu</span>
              {menageSlot.sameDay && (
                <span style={s.urgentBadge}>Turnover serré</span>
              )}
            </div>
            <div style={s.menageRow}>
              <CalendarBlank size={11} weight="duotone" />
              <span>{fmtDateFR(menageSlot.date)} · {menageSlot.startTime}–{menageSlot.endTime}</span>
            </div>
            {menageSlot.adresse && (
              <div style={s.menageRow}>
                <MapPin size={11} weight="duotone" />
                <span style={{ flex: 1 }}>{menageSlot.adresse}</span>
              </div>
            )}
            {menageSlot.contactNom && (
              <div style={s.menageRow}>
                <Phone size={11} weight="duotone" />
                <span>{menageSlot.contactNom}{menageSlot.contactTel ? ` · ${menageSlot.contactTel}` : ''}</span>
              </div>
            )}
            {menageSlot.notes && (
              <div style={{ ...s.menageRow, fontStyle: 'italic', opacity: 0.85 }}>
                <Sparkle size={11} weight="duotone" />
                <span>{menageSlot.notes}</span>
              </div>
            )}
            <button onClick={onMarkMenageDone} style={s.btnMenageDone}>
              <CheckCircle size={12} weight="fill" /> Marquer ménage fait
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={s.actions}>
          {sejour.voyageur_id && (
            <Link href={`/dashboard/voyageurs/${sejour.voyageur_id}`} style={s.btnGhost} onClick={onClose}>
              <User size={12} weight="bold" /> Fiche voyageur
              <ArrowSquareOut size={10} weight="bold" />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 20px 40px -8px rgba(0,0,0,0.4), 0 8px 16px -4px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: 22,
    height: 22,
    borderRadius: 6,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingRight: '24px',
  },
  headerIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(244,114,182,0.13)',
    color: '#F472B6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  dateBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '12px',
    color: 'var(--text-2)',
    padding: '8px 10px',
    background: 'var(--bg)',
    borderRadius: '8px',
  },
  menageBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px 12px',
    background: 'rgba(251,146,60,0.08)',
    border: '1px solid rgba(251,146,60,0.22)',
    borderRadius: '10px',
  },
  menageHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    color: '#fb923c',
  },
  urgentBadge: {
    marginLeft: 'auto',
    fontSize: '9.5px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '999px',
    background: 'rgba(239,68,68,0.13)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.28)',
    letterSpacing: '0.3px',
  },
  menageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    color: 'var(--text-2)',
    lineHeight: 1.4,
  },
  btnMenageDone: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    marginTop: '2px',
    padding: '6px 10px',
    background: '#fb923c',
    border: '1px solid #fb923c',
    color: '#1a0c00',
    fontSize: '11.5px',
    fontWeight: 600,
    borderRadius: '7px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 11px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '8px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
}
