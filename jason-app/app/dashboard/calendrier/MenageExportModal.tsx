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

export default function MenageExportModal({ slots: allSlots, appUrl, icalToken, onClose }: Props) {
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
    window.print()
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .menage-print-area, .menage-print-area * { visibility: visible; }
          .menage-print-area {
            position: absolute;
            top: 0; left: 0; right: 0;
            background: white !important;
            color: black !important;
            padding: 20px !important;
          }
          .menage-no-print { display: none !important; }
        }
      `}</style>
      <div onClick={onClose} style={s.backdrop} className="menage-no-print" />
      <div style={s.modal} role="dialog" aria-label="Planning ménage" className="menage-modal-content">
        <header style={s.head} className="menage-no-print">
          <div style={s.headTitle}>
            <Broom size={18} weight="duotone" style={{ color: '#fb923c' }} />
            <h2 style={s.title}>Planning ménage</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={s.closeBtn}>
            <X size={16} weight="bold" />
          </button>
        </header>

        {/* Sélecteur de période */}
        <div style={s.periodRow} className="menage-no-print">
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
        <div className="menage-print-area" style={s.body}>
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
        <footer style={s.footer} className="menage-no-print">
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

        <p style={s.footerNote} className="menage-no-print">
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
    background: 'rgba(251,146,60,0.13)',
    borderColor: 'rgba(251,146,60,0.35)',
    color: '#fb923c',
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
    background: '#fb923c',
    border: '1px solid #fb923c',
    color: '#1a0c00',
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
