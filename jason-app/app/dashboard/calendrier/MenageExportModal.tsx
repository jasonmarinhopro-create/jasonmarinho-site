'use client'

import { useMemo, useState } from 'react'
import {
  X, Broom, FileText, ChatTeardropDots, Calendar as CalendarIcon,
  Copy, Check, ArrowSquareOut, Printer, MapPin,
} from '@phosphor-icons/react/dist/ssr'
import type { MenageSlot } from './page'

type Props = {
  slots: MenageSlot[]
  appUrl: string
  icalToken: string | null
  hostName: string | null
  onClose: () => void
}

type Period = 'week' | 'next-week' | 'month' | 'next-month'

const PERIOD_LABELS: Record<Period, string> = {
  'week':       'Cette semaine',
  'next-week':  'Semaine prochaine',
  'month':      'Ce mois-ci',
  'next-month': 'Mois prochain',
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

function getPeriodRange(period: Period): { from: string; to: string; label: string } {
  const now = new Date()
  switch (period) {
    case 'week': {
      const ws = startOfWeek(now)
      const we = addDays(ws, 6)
      return { from: toISODate(ws), to: toISODate(we), label: `du ${ws.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${we.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` }
    }
    case 'next-week': {
      const ws = addDays(startOfWeek(now), 7)
      const we = addDays(ws, 6)
      return { from: toISODate(ws), to: toISODate(we), label: `du ${ws.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${we.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` }
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
  }
}

function fmtDateLong(date: string): string {
  try {
    return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch { return date }
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
function buildPrintHtml(slots: MenageSlot[], periodLabel: string, hostName: string | null): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const slotsBy: Record<string, MenageSlot[]> = {}
  for (const s of slots) {
    const key = new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!slotsBy[key]) slotsBy[key] = []
    slotsBy[key].push(s)
  }
  const groups = Object.entries(slotsBy)

  const bodyContent = slots.length === 0
    ? `<div class="empty">Aucun créneau ménage prévu sur cette période.</div>`
    : groups.map(([dateLabel, daySlots]) => `
        <section class="day">
          <h3 class="day-title">${esc(dateLabel)}</h3>
          ${daySlots.map(slot => `
            <article class="slot ${slot.sameDay ? 'urgent' : ''}">
              <div class="slot-time">${esc(slot.startTime)} – ${esc(slot.endTime)}</div>
              <div class="slot-body">
                <div class="slot-logement">${esc(slot.logementName)}${slot.sameDay ? ' <span class="badge-urgent">Turnover serré</span>' : ''}</div>
                ${slot.adresse ? `<div class="slot-meta">📍 ${esc(slot.adresse)}</div>` : ''}
                ${slot.contactNom ? `<div class="slot-meta">👤 ${esc(slot.contactNom)}${slot.contactTel ? ` · ${esc(slot.contactTel)}` : ''}</div>` : ''}
                ${slot.notes ? `<div class="slot-notes">${esc(slot.notes)}</div>` : ''}
                ${slot.fraisMenage != null && slot.fraisMenage > 0 ? `<div class="slot-meta slot-forfait">Forfait : ${slot.fraisMenage} €</div>` : ''}
              </div>
            </article>
          `).join('')}
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
  }
  .slot.urgent {
    border-left-color: #b35e00;
    background: #FFF9EE;
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
  </div>

  <div class="hero">
    <div class="hero-tag">🧹 Planning ménage</div>
    <h1 class="hero-title">Préparation des logements</h1>
    <p class="hero-period">${esc(periodLabel)}</p>
    <p class="hero-meta">${subtitle}</p>
    <div class="hero-count">${slots.length} créneau${slots.length > 1 ? 'x' : ''}</div>
  </div>

  ${bodyContent}

  <div class="footer">
    <span class="footer-brand">Édité depuis <strong>app.jasonmarinho.com</strong></span>
    <span>${esc(today)}</span>
  </div>

  <script>
    // Auto-ouverture du dialog d'impression après chargement
    window.addEventListener('load', () => setTimeout(() => window.print(), 250));
  </script>
</body>
</html>`
}

export default function MenageExportModal({ slots: allSlots, appUrl, icalToken, hostName, onClose }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const [copied, setCopied] = useState(false)

  const { from, to, label } = useMemo(() => getPeriodRange(period), [period])

  const slots = useMemo(() => {
    return allSlots.filter(s => s.date >= from && s.date <= to)
  }, [allSlots, from, to])

  const whatsAppMsg = useMemo(() => buildWhatsAppMessage(slots, label), [slots, label])
  const cleanerIcalUrl = icalToken
    ? `${appUrl}/api/calendar/menage-feed?token=${icalToken}`
    : null

  async function handleCopyWA() {
    try {
      await navigator.clipboard.writeText(whatsAppMsg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  function handlePrint() {
    // Ouvre une fenêtre dédiée avec un HTML A4 brand-aligned. Plus fiable
    // que le print CSS in-place (qui ratait certains contenus selon les
    // browsers et donnait des pages blanches).
    const html = buildPrintHtml(slots, label, hostName)
    const w = window.open('', '_blank', 'width=820,height=900')
    if (!w) {
      alert('Le navigateur a bloqué la nouvelle fenêtre. Autorise les pop-ups pour cette page.')
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
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
          {(['week', 'next-week', 'month', 'next-month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ ...s.periodBtn, ...(period === p ? s.periodBtnActive : {}) }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Liste des créneaux (visible à l'écran + à l'impression) */}
        <div style={s.body}>
          <div style={s.printHead}>
            <h3 style={s.printTitle}>Planning ménage — {label}</h3>
            <p style={s.printSub}>{slots.length} créneau{slots.length > 1 ? 'x' : ''} · généré le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          {slots.length === 0 ? (
            <p style={s.empty}>Aucun créneau ménage prévu sur cette période.</p>
          ) : (
            <ol style={s.list}>
              {slots.map(slot => (
                <li key={slot.id} style={s.item}>
                  <div style={s.itemDate}>
                    <CalendarIcon size={14} weight="duotone" />
                    <strong>{fmtDateLong(slot.date)}</strong>
                    <span style={s.itemHours}>{slot.startTime}–{slot.endTime}</span>
                    {slot.sameDay && <span style={s.urgentBadge}>Turnover serré</span>}
                  </div>
                  <div style={s.itemLogement}>{slot.logementName}</div>
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
                </li>
              ))}
            </ol>
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
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(640px, calc(100vw - 32px))',
    maxHeight: 'calc(100vh - 64px)',
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
