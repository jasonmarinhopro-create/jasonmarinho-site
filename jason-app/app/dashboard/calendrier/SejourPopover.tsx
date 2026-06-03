'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  /** Vrai si un événement calendrier 'menage' existe déjà pour cette date+logement */
  menageDone: boolean
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

const MOBILE_BREAKPOINT = 640
const POPOVER_WIDTH = 340
const MARGIN = 8
const ANCHOR_GAP = 6

/** Renvoie la position adaptée au viewport (desktop) ou un bottom sheet (mobile). */
function computePosition(anchorRect: DOMRect | null, popoverHeight: number, isMobile: boolean): React.CSSProperties {
  if (isMobile) {
    // Bottom sheet : toute la largeur, ancré en bas, marge sécurité bord.
    return {
      position: 'fixed',
      left: MARGIN,
      right: MARGIN,
      bottom: MARGIN,
      width: 'auto',
      maxWidth: 'none',
      maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
      overflowY: 'auto',
      zIndex: 100,
    }
  }

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768

  // Si pas d'ancre (clic sur l'event sans cible), on centre.
  if (!anchorRect) {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: POPOVER_WIDTH,
      maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
      zIndex: 100,
    }
  }

  // Horizontal : aligne sur l'ancre, mais clamp dans le viewport.
  let left = anchorRect.left
  if (left + POPOVER_WIDTH + MARGIN > viewportW) {
    left = Math.max(MARGIN, viewportW - POPOVER_WIDTH - MARGIN)
  }
  if (left < MARGIN) left = MARGIN

  // Vertical : par défaut SOUS l'ancre. Si pas la place, AU-DESSUS.
  // popoverHeight peut être 0 au 1er rendu (avant mesure) — on retient
  // une valeur safe par défaut pour éviter le flash en bas de viewport.
  const estimatedHeight = popoverHeight || 280
  const spaceBelow = viewportH - anchorRect.bottom - MARGIN
  const spaceAbove = anchorRect.top - MARGIN

  let top: number
  let maxHeight: number
  if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
    // Place en dessous
    top = anchorRect.bottom + ANCHOR_GAP
    maxHeight = Math.max(180, viewportH - top - MARGIN)
  } else {
    // Place au-dessus
    top = Math.max(MARGIN, anchorRect.top - estimatedHeight - ANCHOR_GAP)
    maxHeight = Math.max(180, anchorRect.top - MARGIN - ANCHOR_GAP)
  }

  return {
    position: 'fixed',
    top,
    left,
    width: POPOVER_WIDTH,
    maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
    maxHeight,
    overflowY: 'auto',
    zIndex: 100,
  }
}

export default function SejourPopover({ sejour, menageSlot, menageDone, anchorRect, onClose, onMarkMenageDone }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [popoverHeight, setPopoverHeight] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [pending, setPending] = useState(false)

  // Détecte mobile (côté client uniquement)
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Mesure la hauteur réelle après render pour ajuster le positionnement.
  // useLayoutEffect = synchrone avant peinture, évite le flash.
  useLayoutEffect(() => {
    if (ref.current) {
      setPopoverHeight(ref.current.offsetHeight)
    }
  }, [sejour.id, menageSlot])

  // ESC pour fermer
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  // Lock body scroll en mobile (UX bottom sheet)
  useEffect(() => {
    if (!isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isMobile])

  const positionStyle = computePosition(anchorRect, popoverHeight, isMobile)

  return (
    <>
      {/* Overlay : transparent en desktop (clic = close), assombri en mobile (bottom sheet) */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99,
          background: isMobile ? 'rgba(0,0,0,0.45)' : 'transparent',
          backdropFilter: isMobile ? 'blur(2px)' : undefined,
        }}
      />
      <div
        ref={ref}
        style={{ ...s.wrap, ...positionStyle }}
        role="dialog"
        aria-label="Détails du séjour"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Fermer" style={s.closeBtn}>
          <X size={14} weight="bold" />
        </button>

        {/* Drag handle visible uniquement sur bottom sheet mobile */}
        {isMobile && <div style={s.dragHandle} aria-hidden />}

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
          <div style={menageDone ? s.menageBlockDone : s.menageBlock}>
            <div style={s.menageHead}>
              <Broom size={13} weight="duotone" />
              <span>{menageDone ? 'Ménage fait' : 'Ménage prévu'}</span>
              {!menageDone && menageSlot.sameDay && (
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
            {menageDone ? (
              <div style={s.menageDoneTag}>
                <CheckCircle size={12} weight="fill" /> Marqué comme fait
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (pending) return
                  setPending(true)
                  try { await onMarkMenageDone() }
                  finally { setPending(false) }
                }}
                disabled={pending}
                style={{ ...s.btnMenageDone, opacity: pending ? 0.6 : 1, cursor: pending ? 'wait' : 'pointer' }}
              >
                <CheckCircle size={12} weight="fill" />
                {pending ? 'Enregistrement…' : 'Marquer ménage fait'}
              </button>
            )}
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
    background: 'var(--floating-surface)',
    border: '1px solid var(--floating-border)',
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
  dragHandle: {
    width: '36px',
    height: '4px',
    borderRadius: '999px',
    background: 'var(--border-2)',
    margin: '-6px auto 6px',
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
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '10px',
  },
  menageBlockDone: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px 12px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    opacity: 0.85,
  },
  menageHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    color: 'var(--accent-text)',
  },
  menageDoneTag: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    marginTop: '2px',
    padding: '8px 10px',
    background: 'var(--surface-2)',
    border: '1px dashed var(--border-2)',
    color: 'var(--text-2)',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '7px',
    minHeight: 36,
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
    padding: '8px 10px',
    background: 'var(--accent-text)',
    border: '1px solid var(--accent-text)',
    color: 'var(--bg)',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '7px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    // iOS Safari : taille suffisante pour éviter zoom + tap target accessible
    minHeight: 36,
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
    padding: '9px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '8px',
    textDecoration: 'none',
    cursor: 'pointer',
    minHeight: 36,
  },
}
