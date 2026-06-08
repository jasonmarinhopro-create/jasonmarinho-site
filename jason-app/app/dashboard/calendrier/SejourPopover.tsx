'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  X, User, House, CalendarBlank, Sparkle, ArrowSquareOut,
  Broom, CheckCircle, Phone, MapPin, PencilSimple, Trash, FloppyDisk,
} from '@phosphor-icons/react/dist/ssr'
import type { SejourEvent, MenageSlot } from './page'

export type MenageInfo = {
  /** Créneau ménage dérivé (date + heures + logement…) */
  slot: MenageSlot
  /** Vrai si un événement calendrier 'menage' [FAIT] existe en base */
  done: boolean
}

export type SejourEditForm = {
  date_arrivee: string
  date_depart: string
  logement: string
  montant: number | null
}

type Props = {
  sejour: SejourEvent
  /** Ménage AVANT l'arrivée : prépare le logement pour le voyageur de
   *  ce séjour. Null si c'est le 1er séjour (rien avant). */
  menageBefore: MenageInfo | null
  /** Ménage APRÈS le départ : prépare pour le voyageur suivant (ou
   *  clôt la saison). Null seulement si le logement n'a aucune fiche. */
  menageAfter: MenageInfo | null
  /** Liste des noms de logements pour le select d'édition. */
  logementNames: string[]
  /** Anchor element to position popover near (button/event clicked). */
  anchorRect: DOMRect | null
  onClose: () => void
  /** Bascule l'état d'un créneau ménage (date + done). */
  onToggleMenage: (slot: MenageSlot, done: boolean) => void | Promise<void>
  /** Modifie le séjour (dates / logement / montant). */
  onUpdateSejour: (form: SejourEditForm) => Promise<{ ok: boolean; error?: string }>
  /** Supprime le séjour après confirmation. */
  onDeleteSejour: () => Promise<{ ok: boolean; error?: string }>
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

/** Bloc d'un créneau ménage avec case à cocher (toggle on/off). */
function MenageSection({
  label, info, isPending, onToggle,
}: {
  label: string
  info: MenageInfo
  isPending: boolean
  onToggle: () => void | Promise<void>
}) {
  const { slot, done } = info
  return (
    <div style={done ? s.menageBlockDone : s.menageBlock}>
      <div style={s.menageHead}>
        <Broom size={13} weight="duotone" />
        <span>{label}</span>
        {!done && slot.sameDay && <span style={s.urgentBadge}>Turnover serré</span>}
        {done && <span style={s.doneTag}><CheckCircle size={11} weight="fill" /> Fait</span>}
      </div>
      <div style={s.menageRow}>
        <CalendarBlank size={11} weight="duotone" />
        <span>{fmtDateFR(slot.date)} · {slot.startTime}–{slot.endTime}</span>
      </div>
      {slot.adresse && (
        <div style={s.menageRow}>
          <MapPin size={11} weight="duotone" />
          <span style={{ flex: 1 }}>{slot.adresse}</span>
        </div>
      )}
      {slot.contactNom && (
        <div style={s.menageRow}>
          <Phone size={11} weight="duotone" />
          <span>{slot.contactNom}{slot.contactTel ? ` · ${slot.contactTel}` : ''}</span>
        </div>
      )}
      {slot.notes && (
        <div style={{ ...s.menageRow, fontStyle: 'italic', opacity: 0.85 }}>
          <Sparkle size={11} weight="duotone" />
          <span>{slot.notes}</span>
        </div>
      )}
      {/* Checkbox style toggle — clic = bascule. */}
      <button
        onClick={onToggle}
        disabled={isPending}
        aria-pressed={done}
        style={{ ...s.toggleBtn, ...(done ? s.toggleBtnDone : {}), opacity: isPending ? 0.6 : 1, cursor: isPending ? 'wait' : 'pointer' }}
      >
        <span style={{ ...s.checkbox, ...(done ? s.checkboxDone : {}) }} aria-hidden>
          {done && <CheckCircle size={11} weight="fill" />}
        </span>
        <span>
          {isPending ? 'Enregistrement…' : (done ? 'Ménage fait — cliquer pour annuler' : 'Marquer comme fait')}
        </span>
      </button>
    </div>
  )
}

/** Formulaire d'édition du séjour (dates, logement, montant). Rendu dans
 *  le popover quand l'hôte clique sur "Modifier". */
function SejourEditPanel({
  initial, logementNames, isPending, error,
  onSave, onCancel,
}: {
  initial: SejourEditForm
  logementNames: string[]
  isPending: boolean
  error: string | null
  onSave: (form: SejourEditForm) => void | Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<SejourEditForm>(initial)

  // Validation côté client : départ ≥ arrivée (le serveur revérifie).
  const datesInvalid = form.date_depart < form.date_arrivee

  return (
    <div style={editStyles.wrap}>
      <div style={editStyles.row}>
        <label style={editStyles.field}>
          <span style={editStyles.label}>Arrivée</span>
          <input
            type="date"
            value={form.date_arrivee}
            onChange={e => setForm(f => ({ ...f, date_arrivee: e.target.value }))}
            style={editStyles.input}
          />
        </label>
        <label style={editStyles.field}>
          <span style={editStyles.label}>Départ</span>
          <input
            type="date"
            value={form.date_depart}
            onChange={e => setForm(f => ({ ...f, date_depart: e.target.value }))}
            style={editStyles.input}
          />
        </label>
      </div>
      <label style={editStyles.field}>
        <span style={editStyles.label}>Logement</span>
        {logementNames.length > 0 ? (
          <select
            value={form.logement}
            onChange={e => setForm(f => ({ ...f, logement: e.target.value }))}
            style={editStyles.input}
          >
            {!logementNames.includes(form.logement) && form.logement && (
              <option value={form.logement}>{form.logement}</option>
            )}
            {logementNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <input
            type="text"
            value={form.logement}
            onChange={e => setForm(f => ({ ...f, logement: e.target.value }))}
            style={editStyles.input}
            placeholder="Nom du logement"
          />
        )}
      </label>
      <label style={editStyles.field}>
        <span style={editStyles.label}>Montant total (€)</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={form.montant ?? ''}
          onChange={e => setForm(f => ({ ...f, montant: e.target.value === '' ? null : Number(e.target.value) }))}
          style={editStyles.input}
          placeholder="—"
        />
      </label>
      {(error || datesInvalid) && (
        <div style={editStyles.error}>
          {datesInvalid ? "La date de départ doit être après l'arrivée." : error}
        </div>
      )}
      <div style={editStyles.actions}>
        <button onClick={onCancel} disabled={isPending} style={editStyles.btnGhost}>Annuler</button>
        <button
          onClick={() => onSave(form)}
          disabled={isPending || datesInvalid}
          style={editStyles.btnPrimary}
        >
          <FloppyDisk size={12} weight="bold" />
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

const editStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px 14px',
    background: 'rgba(244,114,182,0.07)',
    border: '1px solid rgba(244,114,182,0.22)',
    borderRadius: '10px',
  },
  row: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '4px', flex: '1 1 120px', minWidth: 110 },
  label: {
    fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.3px',
    textTransform: 'uppercase' as const, color: 'var(--text-muted)',
  },
  input: {
    padding: '7px 9px',
    fontSize: '16px', // iOS no-zoom
    color: 'var(--text)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    fontFamily: 'inherit',
    width: '100%',
  },
  error: {
    fontSize: '12px',
    color: 'var(--warning)',
    background: 'var(--warning-bg)',
    border: '1px solid var(--warning-border)',
    padding: '6px 10px',
    borderRadius: '6px',
  },
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' },
  btnGhost: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12.5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'var(--accent-text)',
    border: '1px solid var(--accent-text)',
    color: 'var(--bg)',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
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

export default function SejourPopover({
  sejour, menageBefore, menageAfter, logementNames,
  anchorRect, onClose, onToggleMenage, onUpdateSejour, onDeleteSejour,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [popoverHeight, setPopoverHeight] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  // Pending par slot ID (avant/après peuvent être togglés indépendamment)
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)
  // Édition du séjour (dates, logement, montant) + suppression
  const [editMode, setEditMode] = useState(false)
  const [editPending, setEditPending] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

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
  }, [sejour.id, menageBefore, menageAfter])

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

        {/* Ménage AVANT l'arrivée : prépare ce séjour. Null si 1er séjour. */}
        {menageBefore ? (
          <MenageSection
            label="Avant l'arrivée"
            info={menageBefore}
            isPending={pendingSlotId === menageBefore.slot.id}
            onToggle={async () => {
              if (pendingSlotId) return
              setPendingSlotId(menageBefore.slot.id)
              try { await onToggleMenage(menageBefore.slot, !menageBefore.done) }
              finally { setPendingSlotId(null) }
            }}
          />
        ) : (
          <div style={s.firstStayNote}>
            <Sparkle size={12} weight="duotone" />
            <span>Premier séjour sur cette période — pense à vérifier la propreté avant l'arrivée.</span>
          </div>
        )}

        {/* Ménage APRÈS le départ : prépare pour le voyageur suivant. */}
        {menageAfter && (
          <MenageSection
            label="Après le départ"
            info={menageAfter}
            isPending={pendingSlotId === menageAfter.slot.id}
            onToggle={async () => {
              if (pendingSlotId) return
              setPendingSlotId(menageAfter.slot.id)
              try { await onToggleMenage(menageAfter.slot, !menageAfter.done) }
              finally { setPendingSlotId(null) }
            }}
          />
        )}

        {/* ── Édition inline du séjour (dates, logement, montant) ───────── */}
        {editMode && (
          <SejourEditPanel
            initial={{
              date_arrivee: sejour.date_arrivee,
              date_depart: sejour.date_depart,
              logement: sejour.logement_label,
              montant: sejour.montant,
            }}
            logementNames={logementNames}
            isPending={editPending}
            error={editError}
            onSave={async (form) => {
              setEditError(null)
              setEditPending(true)
              try {
                const r = await onUpdateSejour(form)
                if (r.ok) setEditMode(false)
                else setEditError(r.error ?? 'Erreur enregistrement')
              } finally {
                setEditPending(false)
              }
            }}
            onCancel={() => { setEditMode(false); setEditError(null) }}
          />
        )}

        {/* Actions */}
        <div style={s.actions}>
          {sejour.voyageur_id && !editMode && (
            <Link href={`/dashboard/voyageurs/${sejour.voyageur_id}`} style={s.btnGhost} onClick={onClose}>
              <User size={12} weight="bold" /> Fiche voyageur
              <ArrowSquareOut size={10} weight="bold" />
            </Link>
          )}
          {!editMode && (
            <button onClick={() => setEditMode(true)} style={s.btnGhost} aria-label="Modifier ce séjour">
              <PencilSimple size={12} weight="bold" /> Modifier
            </button>
          )}
          {!editMode && (
            <button
              onClick={async () => {
                if (!confirm('Supprimer ce séjour ? Cette action est définitive.')) return
                setEditError(null)
                setEditPending(true)
                try {
                  const r = await onDeleteSejour()
                  if (r.ok) onClose()
                  else setEditError(r.error ?? 'Erreur suppression')
                } finally {
                  setEditPending(false)
                }
              }}
              disabled={editPending}
              style={s.btnDanger}
              aria-label="Supprimer ce séjour"
            >
              <Trash size={12} weight="bold" /> Supprimer
            </button>
          )}
          {editError && !editMode && <div style={s.errorInline}>{editError}</div>}
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
  doneTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: 'auto',
    fontSize: '9.5px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '999px',
    background: 'var(--success-bg)',
    color: 'var(--success-1)',
    border: '1px solid var(--success-border)',
    letterSpacing: '0.3px',
    textTransform: 'none',
  },
  firstStayNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '7px',
    padding: '9px 11px',
    fontSize: '11.5px',
    color: 'var(--text-2)',
    background: 'var(--surface-2)',
    border: '1px dashed var(--border-2)',
    borderRadius: '10px',
    lineHeight: 1.45,
  },
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '2px',
    padding: '8px 10px',
    background: 'var(--accent-text)',
    border: '1px solid var(--accent-text)',
    color: 'var(--bg)',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '7px',
    fontFamily: 'inherit',
    minHeight: 36,
    textAlign: 'left',
  },
  toggleBtnDone: {
    background: 'var(--surface-2)',
    borderColor: 'var(--border)',
    borderStyle: 'dashed',
    color: 'var(--text-2)',
    fontWeight: 500,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    background: 'transparent',
    border: '1.5px solid var(--bg)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    background: 'var(--success-1)',
    borderColor: 'var(--success-1)',
    color: '#fff',
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
    fontFamily: 'inherit',
    minHeight: 36,
  },
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '9px 12px',
    background: 'transparent',
    border: '1px solid var(--warning-border)',
    color: 'var(--warning)',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    minHeight: 36,
  },
  errorInline: {
    flexBasis: '100%',
    fontSize: '12px',
    color: 'var(--warning)',
    marginTop: '4px',
  },
}
