'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  X, Broom, FileText, ChatTeardropDots, Calendar as CalendarIcon,
  Copy, Check, ArrowSquareOut, Printer, MapPin, PencilSimple, Plus, Trash, FloppyDisk,
} from '@phosphor-icons/react/dist/ssr'
import type { MenageSlot } from './page'
import { upsertMenageEvent, deleteMenageEvent } from './actions'
import { CalendarInput, TimePickerInput } from '@/components/ui/CalendarInput'

type Props = {
  slots: MenageSlot[]
  /** Set des slot.id qui ont déjà un calendar_event [FAIT] associé. */
  doneIds: Set<string>
  /** Liste des noms de logements pour le select Ajouter. */
  logementNames: string[]
  /** Map nom-de-logement → id, pour générer un raccourci "Modifier
   *  les valeurs par défaut" (heure, forfait, notes) sur la fiche. */
  logementIdByName?: Record<string, string>
  appUrl: string
  icalToken: string | null
  hostName: string | null
  onClose: () => void
  /** Callback pour rafraîchir la liste après création/édition/suppression. */
  onSlotsChanged?: () => void
}

type Period = 'week' | 'next-week' | 'month' | 'next-month' | 'custom'

const PERIOD_LABELS: Record<Period, string> = {
  'week':       'Cette semaine',
  'next-week':  'Semaine prochaine',
  'month':      'Ce mois-ci',
  'next-month': 'Mois prochain',
  'custom':     'Période perso',
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // lundi = 0
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtRangeLabel(from: string, to: string): string {
  try {
    const f = new Date(from)
    const t = new Date(to)
    return `du ${f.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
  } catch { return `du ${from} au ${to}` }
}

function getPeriodRange(period: Period, customFrom?: string, customTo?: string): { from: string; to: string; label: string } {
  const now = new Date()
  switch (period) {
    case 'week': {
      const ws = startOfWeek(now)
      const we = addDays(ws, 6)
      return { from: toISODate(ws), to: toISODate(we), label: fmtRangeLabel(toISODate(ws), toISODate(we)) }
    }
    case 'next-week': {
      const ws = addDays(startOfWeek(now), 7)
      const we = addDays(ws, 6)
      return { from: toISODate(ws), to: toISODate(we), label: fmtRangeLabel(toISODate(ws), toISODate(we)) }
    }
    case 'month': {
      const ms = new Date(now.getFullYear(), now.getMonth(), 1)
      const me = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { from: toISODate(ms), to: toISODate(me), label: ms.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }
    }
    case 'next-month': {
      const ms = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const me = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      return { from: toISODate(ms), to: toISODate(me), label: ms.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }
    }
    case 'custom': {
      // Fallback : période vide ou inversée → on borne sur 1 an aujourd'hui
      const from = customFrom && /^\d{4}-\d{2}-\d{2}$/.test(customFrom) ? customFrom : toISODate(now)
      const to = customTo && /^\d{4}-\d{2}-\d{2}$/.test(customTo) ? customTo : toISODate(addDays(now, 60))
      const ordered = from <= to ? { from, to } : { from: to, to: from }
      return { ...ordered, label: fmtRangeLabel(ordered.from, ordered.to) }
    }
  }
}

function fmtDateLong(date: string): string {
  try {
    return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch { return date }
}

function EditPanel({
  initial, logementNames, logementIdByName, isPending, error,
  onSave, onCancel, canDelete, onDelete,
}: {
  initial: EditForm
  logementNames: string[]
  logementIdByName?: Record<string, string>
  isPending: boolean
  error: string | null
  onSave: (form: EditForm) => void
  onCancel: () => void
  canDelete: boolean
  onDelete: () => void
}) {
  const [form, setForm] = useState<EditForm>(initial)
  // Raccourci "Modifier les valeurs par défaut" : pointe vers la fiche
  // du logement sélectionné pour éditer durée/heure/notes/forfait par défaut.
  // Évite de devoir saisir la même chose à chaque ménage.
  const selectedLogementId = logementIdByName?.[form.logementName] ?? null
  return (
    <div style={editStyles.wrap}>
      <div style={editStyles.row}>
        <div style={editStyles.field}>
          <span style={editStyles.label}>Date</span>
          {/* CalendarInput vert brand au lieu de l'input date natif gris */}
          <CalendarInput
            value={form.date}
            onChange={v => setForm(f => ({ ...f, date: v }))}
          />
        </div>
        <label style={editStyles.field}>
          <span style={editStyles.label}>Logement</span>
          {logementNames.length > 0 ? (
            <select
              value={form.logementName}
              onChange={e => setForm(f => ({ ...f, logementName: e.target.value }))}
              style={editStyles.input}
            >
              {!logementNames.includes(form.logementName) && (
                <option value={form.logementName}>{form.logementName || '—'}</option>
              )}
              {logementNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <input
              type="text"
              value={form.logementName}
              onChange={e => setForm(f => ({ ...f, logementName: e.target.value }))}
              style={editStyles.input}
              placeholder="Nom du logement"
            />
          )}
        </label>
      </div>
      <div style={editStyles.row}>
        <div style={editStyles.field}>
          <span style={editStyles.label}>Début</span>
          <TimePickerInput
            value={form.startTime}
            onChange={v => setForm(f => ({ ...f, startTime: v }))}
          />
        </div>
        <div style={editStyles.field}>
          <span style={editStyles.label}>Fin</span>
          <TimePickerInput
            value={form.endTime}
            onChange={v => setForm(f => ({ ...f, endTime: v }))}
          />
        </div>
        <label style={editStyles.field}>
          <span style={editStyles.label}>Forfait (€)</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={form.prix ?? ''}
            onChange={e => setForm(f => ({ ...f, prix: e.target.value === '' ? null : Number(e.target.value) }))}
            style={editStyles.input}
            placeholder="—"
          />
        </label>
      </div>
      <label style={{ ...editStyles.field, flexDirection: 'column' as const }}>
        <span style={editStyles.label}>Notes (ex: lit bébé, code wifi…)</span>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          style={{ ...editStyles.input, minHeight: 48, resize: 'vertical' as const }}
          placeholder="Instructions pour la femme de ménage"
        />
      </label>
      {selectedLogementId && (
        <a
          href={`/dashboard/logements/${selectedLogementId}`}
          style={editStyles.defaultLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          ⚙ Modifier les valeurs par défaut de ce logement (heure, forfait, notes) ↗
        </a>
      )}
      {error && <div style={editStyles.error}>{error}</div>}
      <div style={editStyles.actions}>
        <button onClick={onCancel} disabled={isPending} style={editStyles.btnGhost}>Annuler</button>
        {canDelete && (
          <button onClick={onDelete} disabled={isPending} style={editStyles.btnDanger}>
            <Trash size={12} weight="bold" /> Supprimer
          </button>
        )}
        <button onClick={() => onSave(form)} disabled={isPending} style={editStyles.btnPrimary}>
          <FloppyDisk size={12} weight="bold" /> {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

const editStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px 14px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '10px',
  },
  row: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '4px', flex: '1 1 130px', minWidth: 120 },
  label: { fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' as const, color: 'var(--text-muted)' },
  input: {
    padding: '7px 9px',
    fontSize: '16px', // évite zoom auto iOS
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
  actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' as const, marginTop: '2px' },
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
  btnDanger: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'transparent',
    border: '1px solid var(--warning-border)',
    color: 'var(--warning)',
    padding: '7px 10px',
    borderRadius: '6px',
    fontSize: '12.5px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  defaultLink: {
    fontSize: '11.5px',
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px dashed var(--accent-border)',
    borderRadius: '6px',
    padding: '7px 10px',
    textDecoration: 'none',
    display: 'block',
  },
}

type EditForm = {
  date: string
  logementName: string
  startTime: string
  endTime: string
  notes: string
  prix: number | null
}

function buildWhatsAppMessage(slots: MenageSlot[], label: string): string {
  if (slots.length === 0) return `Bonjour 👋\n\nPas de ménage prévu ${label} pour le moment. Je te tiens au courant.\n\nBelle journée !`
  const lines: string[] = [`Bonjour 👋`, ``, `Voici le planning ménage ${label} :`, ``]
  for (const s of slots) {
    const date = fmtDateLong(s.date)
    const urgent = s.sameDay ? ' ⚡ (turnover serré)' : ''
    lines.push(`📍 *${date}* · ${s.startTime}–${s.endTime}${urgent}`)
    lines.push(`   ${s.logementName}${s.adresse ? `\n   ${s.adresse}` : ''}`)
    if (s.notes) lines.push(`   📝 ${s.notes}`)
    lines.push('')
  }
  lines.push(`Merci 🙏`)
  return lines.join('\n')
}

/** Échappe une chaîne pour insertion safe dans du HTML (XSS-safe). */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Génère le HTML d'un planning ménage imprimable A4, charte brand
 * (forest green #004C3F + jaune accent #FFD56B). Ouvert dans une nouvelle
 * fenêtre pour utiliser le dialogue d'impression natif du browser —
 * fiable cross-browser, pas de print CSS visibility tricks fragiles.
 */
function buildPrintHtml(slots: MenageSlot[], doneIds: Set<string>, periodLabel: string, hostName: string | null): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const slotsBy: Record<string, MenageSlot[]> = {}
  for (const s of slots) {
    const key = new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!slotsBy[key]) slotsBy[key] = []
    slotsBy[key].push(s)
  }
  const groups = Object.entries(slotsBy)

  const doneCount = slots.filter(s => doneIds.has(s.id)).length
  const bodyContent = slots.length === 0
    ? `<div class="empty">Aucun créneau ménage prévu sur cette période.</div>`
    : groups.map(([dateLabel, daySlots]) => `
        <section class="day">
          <h3 class="day-title">${esc(dateLabel)}</h3>
          ${daySlots.map(slot => {
            const done = doneIds.has(slot.id)
            return `
            <article class="slot ${slot.sameDay ? 'urgent' : ''} ${done ? 'done' : ''}">
              <div class="slot-check" aria-hidden>${done ? '✓' : ''}</div>
              <div class="slot-time">${esc(slot.startTime)} – ${esc(slot.endTime)}</div>
              <div class="slot-body">
                <div class="slot-logement">${esc(slot.logementName)}${slot.sameDay && !done ? ' <span class="badge-urgent">Turnover serré</span>' : ''}${done ? ' <span class="badge-done">Fait</span>' : ''}</div>
                ${slot.adresse ? `<div class="slot-meta">📍 ${esc(slot.adresse)}</div>` : ''}
                ${slot.contactNom ? `<div class="slot-meta">👤 ${esc(slot.contactNom)}${slot.contactTel ? ` · ${esc(slot.contactTel)}` : ''}</div>` : ''}
                ${slot.notes ? `<div class="slot-notes">${esc(slot.notes)}</div>` : ''}
                ${slot.fraisMenage != null && slot.fraisMenage > 0 ? `<div class="slot-meta slot-forfait">Forfait : ${slot.fraisMenage} €</div>` : ''}
              </div>
            </article>
          `}).join('')}
        </section>
      `).join('')

  const subtitle = hostName
    ? `Préparé par ${esc(hostName)} · ${esc(today)}`
    : `Généré le ${esc(today)}`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Planning ménage — ${esc(periodLabel)}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 14mm 18mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    line-height: 1.5;
  }
  /* ── Hero header forest green ────────────────────────────────────── */
  .hero {
    background: linear-gradient(135deg, #004C3F 0%, #005A4A 100%);
    color: #FFFFFF;
    padding: 22px 26px 20px;
    border-radius: 12px;
    margin-bottom: 18px;
    position: relative;
    overflow: hidden;
  }
  .hero::after {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,213,107,0.10);
    pointer-events: none;
  }
  .hero-tag {
    display: inline-block;
    background: rgba(255,213,107,0.18);
    color: #FFD56B;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .hero-title {
    font-family: Georgia, serif;
    font-size: 26px;
    font-weight: 400;
    margin: 0 0 6px;
    letter-spacing: -0.3px;
  }
  .hero-period {
    font-size: 13px;
    color: rgba(255,255,255,0.82);
    margin: 0;
  }
  .hero-meta {
    font-size: 11px;
    color: rgba(255,255,255,0.62);
    margin-top: 8px;
  }
  .hero-count {
    position: absolute;
    bottom: 18px;
    right: 26px;
    background: #FFD56B;
    color: #003329;
    padding: 5px 14px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.3px;
  }
  /* ── Liste des créneaux par jour ─────────────────────────────────── */
  .day { margin-bottom: 16px; page-break-inside: avoid; }
  .day-title {
    font-family: Georgia, serif;
    font-size: 14px;
    color: #004C3F;
    margin: 0 0 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid #D5E6DA;
    text-transform: capitalize;
  }
  .slot {
    display: flex;
    gap: 14px;
    padding: 11px 14px;
    margin-bottom: 7px;
    background: #F6FCF8;
    border: 1px solid #D5E6DA;
    border-left: 4px solid #004C3F;
    border-radius: 8px;
    page-break-inside: avoid;
    align-items: flex-start;
  }
  .slot.urgent {
    border-left-color: #b35e00;
    background: #FFF9EE;
  }
  .slot.done {
    background: #ECF5EF;
    border-left-color: #34D399;
    opacity: 0.78;
  }
  .slot.done .slot-logement { text-decoration: line-through; text-decoration-thickness: 1px; }
  .slot-check {
    flex: 0 0 18px;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1.5px solid #D5E6DA;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: transparent;
    margin-top: 1px;
  }
  .slot.done .slot-check {
    background: #34D399;
    border-color: #34D399;
    color: #ffffff;
    font-weight: 700;
  }
  .badge-done {
    display: inline-block;
    margin-left: 6px;
    background: #34D399;
    color: #ffffff;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    vertical-align: 1px;
  }
  .slot-time {
    flex: 0 0 84px;
    font-family: 'SF Mono', Menlo, monospace;
    font-size: 12.5px;
    font-weight: 700;
    color: #004C3F;
    padding-top: 1px;
  }
  .slot.urgent .slot-time { color: #b35e00; }
  .slot-body { flex: 1; min-width: 0; }
  .slot-logement {
    font-size: 13.5px;
    font-weight: 600;
    color: #0B1D0F;
    margin-bottom: 3px;
  }
  .slot-meta {
    font-size: 11.5px;
    color: rgba(11,29,15,0.68);
    margin-top: 2px;
  }
  .slot-forfait {
    color: #004C3F;
    font-weight: 600;
  }
  .slot-notes {
    font-size: 11.5px;
    color: rgba(11,29,15,0.82);
    margin-top: 5px;
    padding: 6px 8px;
    background: rgba(255,213,107,0.18);
    border-radius: 4px;
    border-left: 2px solid #FFD56B;
    font-style: italic;
  }
  .badge-urgent {
    display: inline-block;
    margin-left: 6px;
    background: #b35e00;
    color: #fff;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    vertical-align: 1px;
  }
  .empty {
    padding: 36px 24px;
    text-align: center;
    color: #6b7280;
    font-style: italic;
    font-size: 13px;
    border: 1px dashed #D5E6DA;
    border-radius: 8px;
  }
  /* ── Footer ──────────────────────────────────────────────────────── */
  .footer {
    margin-top: 22px;
    padding-top: 10px;
    border-top: 1px solid #D5E6DA;
    font-size: 9.5px;
    color: #6b7280;
    display: flex;
    justify-content: space-between;
  }
  .footer-brand strong { color: #004C3F; }
  /* ── Print button (only on screen, hidden in print) ──────────────── */
  .toolbar {
    position: fixed;
    top: 12px; right: 12px;
    background: #fff;
    border: 1px solid #D5E6DA;
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    display: flex;
    gap: 8px;
    align-items: center;
    z-index: 10;
  }
  .toolbar button {
    background: #004C3F;
    color: #fff;
    border: 0;
    padding: 8px 14px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
  }
  .toolbar button:hover { background: #003329; }
  .toolbar .btn-close {
    background: #ffffff;
    color: #004C3F;
    border: 1px solid #D5E6DA;
  }
  .toolbar .btn-close:hover { background: #ECF5EF; }
  @media print {
    .toolbar { display: none; }
    body { padding: 0; }
  }
  body { padding: 18mm 14mm; max-width: 794px; margin: 0 auto; }
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Imprimer / PDF</button>
    <button class="btn-close" onclick="window.close()" title="Fermer cette fenêtre">Fermer ↩</button>
  </div>

  <div class="hero">
    <div class="hero-tag">🧹 Planning ménage</div>
    <h1 class="hero-title">Préparation des logements</h1>
    <p class="hero-period">${esc(periodLabel)}</p>
    <p class="hero-meta">${subtitle}${doneCount > 0 ? ` · ${doneCount} déjà fait${doneCount > 1 ? 's' : ''}` : ''}</p>
    <div class="hero-count">${slots.length} créneau${slots.length > 1 ? 'x' : ''}</div>
  </div>

  ${bodyContent}

  <div class="footer">
    <span class="footer-brand">Édité depuis <strong>app.jasonmarinho.com</strong></span>
    <span>${esc(today)}</span>
  </div>
</body>
</html>`
}

export default function MenageExportModal({ slots: allSlots, doneIds, logementNames, logementIdByName, appUrl, icalToken, hostName, onClose, onSlotsChanged }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const [copied, setCopied] = useState(false)

  // État pour la période personnalisée — par défaut aujourd'hui → +60 jours
  // (utile en début de saison avant qu'il y ait des résas auto-dérivées).
  const today = toISODate(new Date())
  const todayPlus60 = toISODate(addDays(new Date(), 60))
  const [customFrom, setCustomFrom] = useState(today)
  const [customTo, setCustomTo] = useState(todayPlus60)

  const { from, to, label } = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  )

  const slots = useMemo(() => {
    return allSlots.filter(s => s.date >= from && s.date <= to)
  }, [allSlots, from, to])

  const whatsAppMsg = useMemo(() => buildWhatsAppMessage(slots, label), [slots, label])
  const cleanerIcalUrl = icalToken
    ? `${appUrl}/api/calendar/menage-feed?token=${icalToken}`
    : null

  // ── Édition / ajout d'un ménage ───────────────────────────────────────
  // editingSlotId === '__new__' = formulaire d'ajout, sinon = id du slot édité
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editError, setEditError] = useState<string | null>(null)

  function openEdit(slot: MenageSlot) {
    setEditingSlotId(slot.id)
    setEditError(null)
  }
  function openAdd() {
    setEditingSlotId('__new__')
    setEditError(null)
  }
  function cancelEdit() {
    setEditingSlotId(null)
    setEditError(null)
  }

  async function saveEdit(form: EditForm) {
    setEditError(null)
    // Sécurité : validation minimale (le serveur valide aussi)
    if (!form.date || !form.logementName.trim()) {
      setEditError('Date et logement requis')
      return
    }
    if (form.startTime >= form.endTime) {
      setEditError('L\'heure de fin doit être après l\'heure de début')
      return
    }
    const eventId = editingSlotId === '__new__' ? null : (() => {
      const slot = slots.find(s => s.id === editingSlotId)
      return slot?.manualEventId ?? null
    })()
    const done = editingSlotId && editingSlotId !== '__new__'
      ? doneIds.has(editingSlotId)
      : false
    startTransition(async () => {
      const r = await upsertMenageEvent({
        eventId,
        date: form.date,
        logementName: form.logementName,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes || null,
        prix: form.prix || null,
        preserveDone: done,
      })
      if (r.ok) {
        setEditingSlotId(null)
        onSlotsChanged?.()
      } else {
        setEditError(r.error)
      }
    })
  }

  async function handleDelete(slot: MenageSlot) {
    if (!slot.manualEventId) return
    if (!confirm('Supprimer ce ménage du planning ?')) return
    startTransition(async () => {
      const r = await deleteMenageEvent(slot.manualEventId!)
      if (r.ok) {
        setEditingSlotId(null)
        onSlotsChanged?.()
      } else {
        setEditError(r.error ?? 'Erreur de suppression')
      }
    })
  }

  async function handleCopyWA() {
    try {
      await navigator.clipboard.writeText(whatsAppMsg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  function handlePrint() {
    // Stratégie : iframe cachée pour rester sur la page (mobile-friendly).
    // L'iframe contient le HTML A4 brand-aligned. Au load, on déclenche
    // print() sur la fenêtre de l'iframe et on retire l'iframe quand le
    // dialog se referme. Pas de pop-up, pas de risque que le browser
    // garde l'utilisateur coincé sur l'onglet imprimé.
    const html = buildPrintHtml(slots, doneIds, label, hostName)

    // Supprime une iframe précédente si l'utilisateur clique plusieurs fois
    const previous = document.getElementById('menage-print-iframe')
    if (previous) previous.remove()

    const iframe = document.createElement('iframe')
    iframe.id = 'menage-print-iframe'
    iframe.style.cssText = 'position:fixed;right:-9999px;bottom:-9999px;width:0;height:0;border:0;'
    iframe.srcdoc = html
    document.body.appendChild(iframe)

    iframe.onload = () => {
      try {
        const w = iframe.contentWindow
        if (!w) return
        w.focus()
        w.print()
        // L'event afterprint se déclenche après que l'utilisateur ait
        // imprimé OU annulé. On nettoie l'iframe.
        const cleanup = () => { iframe.remove() }
        w.addEventListener('afterprint', cleanup)
        // Filet : si le browser ne tire pas afterprint (mobile parfois),
        // nettoyage forcé après 30s.
        setTimeout(() => { if (document.getElementById('menage-print-iframe')) iframe.remove() }, 30_000)
      } catch (e) {
        // Cross-origin ou contexte étrange — fallback window.open
        iframe.remove()
        const w = window.open('', '_blank')
        if (w) {
          w.document.open()
          w.document.write(html)
          w.document.close()
        }
      }
    }
  }

  return (
    <>
      <div onClick={onClose} style={s.backdrop} />
      <div style={s.modal} role="dialog" aria-label="Planning ménage">
        <header style={s.head}>
          <div style={s.headTitle}>
            <Broom size={18} weight="duotone" style={{ color: 'var(--accent-text)' }} />
            <h2 style={s.title}>Planning ménage</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={s.closeBtn}>
            <X size={16} weight="bold" />
          </button>
        </header>

        {/* Sélecteur de période */}
        <div style={s.periodRow}>
          {(['week', 'next-week', 'month', 'next-month', 'custom'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ ...s.periodBtn, ...(period === p ? s.periodBtnActive : {}) }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Champs date pour période personnalisée — utile en pré-saison
            quand il n'y a pas encore de résas auto-dérivées en juin/juillet
            mais qu'on veut planifier août. */}
        {period === 'custom' && (
          <div style={s.customRow}>
            <label style={s.customLabel}>
              <span>Du</span>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={s.dateInput}
              />
            </label>
            <label style={s.customLabel}>
              <span>Au</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={s.dateInput}
              />
            </label>
          </div>
        )}

        {/* Liste des créneaux (visible à l'écran + à l'impression) */}
        <div style={s.body}>
          <div style={s.printHead}>
            <h3 style={s.printTitle}>Planning ménage — {label}</h3>
            <p style={s.printSub}>{slots.length} créneau{slots.length > 1 ? 'x' : ''} · généré le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          {slots.length === 0 && editingSlotId !== '__new__' && (
            <p style={s.empty}>Aucun créneau ménage prévu sur cette période.</p>
          )}
          {(slots.length > 0 || editingSlotId === '__new__') && (
            <ol style={s.list}>
              {slots.map(slot => {
                const done = doneIds.has(slot.id)
                const editing = editingSlotId === slot.id
                if (editing) {
                  return (
                    <li key={slot.id} style={s.itemEditing}>
                      <EditPanel
                        initial={{
                          date: slot.date,
                          logementName: slot.logementName,
                          startTime: slot.startTime,
                          endTime: slot.endTime,
                          notes: slot.notes ?? '',
                          prix: slot.fraisMenage ?? null,
                        }}
                        logementNames={logementNames}
                        logementIdByName={logementIdByName}
                        isPending={isPending}
                        error={editError}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        canDelete={!!slot.manualEventId}
                        onDelete={() => handleDelete(slot)}
                      />
                    </li>
                  )
                }
                return (
                <li key={slot.id} style={{ ...s.item, ...(done ? s.itemDone : {}) }}>
                  <div style={s.itemDate}>
                    <CalendarIcon size={14} weight="duotone" />
                    <strong style={done ? s.itemTextDone : undefined}>{fmtDateLong(slot.date)}</strong>
                    <span style={s.itemHours}>{slot.startTime}–{slot.endTime}</span>
                    {done && <span style={s.doneBadge}><Check size={10} weight="bold" /> Fait</span>}
                    {!done && slot.sameDay && <span style={s.urgentBadge}>Turnover serré</span>}
                    {slot.isManual && <span style={s.manualBadge}>Saisi</span>}
                    <button
                      onClick={() => openEdit(slot)}
                      style={s.editIconBtn}
                      title="Modifier ce ménage"
                      aria-label="Modifier"
                    >
                      <PencilSimple size={12} weight="bold" />
                    </button>
                  </div>
                  <div style={{ ...s.itemLogement, ...(done ? s.itemTextDone : {}) }}>{slot.logementName}</div>
                  {slot.adresse && (
                    <div style={s.itemMeta}>
                      <MapPin size={11} weight="duotone" /> {slot.adresse}
                    </div>
                  )}
                  {slot.notes && (
                    <div style={{ ...s.itemMeta, fontStyle: 'italic' }}>
                      📝 {slot.notes}
                    </div>
                  )}
                  {slot.fraisMenage != null && slot.fraisMenage > 0 && (
                    <div style={s.itemMeta}>💶 Forfait : {slot.fraisMenage} €</div>
                  )}
                </li>
                )
              })}
              {/* Formulaire d'ajout d'un nouveau ménage (en bas de liste) */}
              {editingSlotId === '__new__' && (
                <li style={s.itemEditing}>
                  <EditPanel
                    initial={{
                      date: from,
                      logementName: logementNames[0] ?? '',
                      startTime: '11:00',
                      endTime: '14:00',
                      notes: '',
                      prix: null,
                    }}
                    logementNames={logementNames}
                    logementIdByName={logementIdByName}
                    isPending={isPending}
                    error={editError}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    canDelete={false}
                    onDelete={() => {}}
                  />
                </li>
              )}
            </ol>
          )}

          {/* Bouton + Ajouter un ménage : visible seulement quand le form
              d'ajout n'est pas déjà ouvert. */}
          {editingSlotId !== '__new__' && (
            <button onClick={openAdd} style={s.addBtn}>
              <Plus size={13} weight="bold" /> Ajouter un ménage
            </button>
          )}
        </div>

        {/* Actions d'export */}
        <footer style={s.footer}>
          <button onClick={handlePrint} style={s.btnGhost}>
            <Printer size={13} weight="bold" /> Imprimer / PDF
          </button>
          <button onClick={handleCopyWA} style={s.btnPrimary}>
            {copied ? (
              <><Check size={13} weight="bold" /> Copié</>
            ) : (
              <><ChatTeardropDots size={13} weight="bold" /> Copier pour WhatsApp</>
            )}
          </button>
          {cleanerIcalUrl && (
            <a href={cleanerIcalUrl} target="_blank" rel="noopener noreferrer" style={s.btnSecondary}>
              <CalendarIcon size={13} weight="bold" /> Lien iCal pour la femme de ménage
              <ArrowSquareOut size={11} weight="bold" />
            </a>
          )}
        </footer>

        <p style={s.footerNote}>
          💡 Le lien iCal permet à la femme de ménage de s'abonner depuis son téléphone : son agenda se met à jour automatiquement à chaque nouvelle réservation.
        </p>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    zIndex: 200,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    position: 'fixed',
    // Hauteur AUTO qui s'adapte au contenu, plafonnée par maxHeight pour
    // éviter de déborder du viewport. Ancré sous le header dashboard (72px)
    // au lieu d'être centré : évite le vide énorme quand 0-1 créneau.
    top: 72,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(640px, calc(100vw - 24px))',
    maxHeight: 'calc(100vh - 96px)',
    background: 'var(--floating-surface)',
    border: '1px solid var(--floating-border)',
    borderRadius: '16px',
    zIndex: 201,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 30px 60px -10px rgba(0,0,0,0.5)',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  headTitle: { display: 'flex', alignItems: 'center', gap: '10px' },
  title: {
    margin: 0,
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px',
    fontWeight: 500,
    color: 'var(--text)',
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: 8,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  periodRow: {
    display: 'flex', gap: '6px', flexWrap: 'wrap',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)',
  },
  periodBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    borderRadius: '999px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .15s',
  },
  periodBtnActive: {
    background: 'var(--accent-bg-2)',
    borderColor: 'var(--accent-border-2)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  customRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    padding: '0 20px 12px',
    borderBottom: '1px solid var(--border)',
  },
  customLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-2)',
    flex: '1 1 140px',
    minWidth: 140,
  },
  dateInput: {
    flex: 1,
    padding: '6px 10px',
    // ≥16px : évite le zoom auto sur iOS Safari quand on focus le champ
    fontSize: '16px',
    color: 'var(--text)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '7px',
    fontFamily: 'inherit',
  },
  body: {
    padding: '20px',
    flex: 1,
    overflowY: 'auto',
  },
  printHead: {
    marginBottom: '14px',
    paddingBottom: '10px',
    borderBottom: '1px dashed var(--border)',
  },
  printTitle: {
    margin: 0,
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px',
    color: 'var(--text)',
    fontWeight: 500,
  },
  printSub: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  empty: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    margin: 0,
    padding: '24px 0',
    textAlign: 'center',
  },
  list: {
    margin: 0, padding: 0,
    listStyle: 'none',
    display: 'flex', flexDirection: 'column',
    gap: '10px',
  },
  item: {
    padding: '12px 14px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  itemDate: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '13px',
    color: 'var(--text)',
    flexWrap: 'wrap',
    marginBottom: '4px',
  },
  itemHours: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontFamily: 'ui-monospace, monospace',
  },
  urgentBadge: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '999px',
    background: 'rgba(239,68,68,0.13)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.28)',
    letterSpacing: '0.3px',
  },
  doneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '999px',
    background: 'var(--success-bg)',
    color: 'var(--success-1)',
    border: '1px solid var(--success-border)',
    letterSpacing: '0.3px',
  },
  itemDone: {
    opacity: 0.6,
  },
  itemTextDone: {
    textDecoration: 'line-through',
    textDecorationThickness: '1px',
  },
  itemEditing: {
    listStyle: 'none',
    padding: 0,
  },
  editIconBtn: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  manualBadge: {
    fontSize: '9.5px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '999px',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    letterSpacing: '0.3px',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '12px',
    padding: '9px 14px',
    background: 'var(--accent-bg)',
    border: '1px dashed var(--accent-border-2)',
    color: 'var(--accent-text)',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: 'fit-content',
  },
  itemLogement: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '3px',
  },
  itemMeta: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  footer: {
    display: 'flex', gap: '8px', flexWrap: 'wrap',
    padding: '14px 20px',
    borderTop: '1px solid var(--border)',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px',
    background: 'var(--accent-text)',
    border: '1px solid var(--accent-text)',
    color: 'var(--bg)',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: 'inherit',
  },
  footerNote: {
    margin: 0,
    padding: '0 20px 18px',
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
}
