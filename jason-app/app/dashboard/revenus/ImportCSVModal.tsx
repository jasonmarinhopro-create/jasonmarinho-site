'use client'

import { useState, useRef, useTransition } from 'react'
import { CloudArrowUp, Check, X, Warning, FileCsv, ArrowRight } from '@phosphor-icons/react'
import { bulkImportRevenusEntries } from './actions'

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  raw: Record<string, string>
  date_paiement: string | null  // ISO YYYY-MM-DD
  logement_nom: string
  montant: number | null
  voyageur: string
  status: 'ok' | 'cancelled' | 'payout' | 'invalid'
  reason?: string
}

type Platform = 'airbnb' | 'booking' | 'unknown'

interface Props {
  open: boolean
  onClose: () => void
  onImported: (count: number) => void
}

// ── CSV parsing ──────────────────────────────────────────────────────────────

function detectDelimiter(firstLine: string): string {
  const semis  = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  const tabs   = (firstLine.match(/\t/g) ?? []).length
  if (tabs >= semis && tabs >= commas) return '\t'
  return semis > commas ? ';' : ','
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)

  const firstLineEnd = text.indexOf('\n')
  const firstLine    = firstLineEnd === -1 ? text : text.slice(0, firstLineEnd)
  const delim        = detectDelimiter(firstLine)

  const rowsRaw: string[][] = []
  let cur: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else { inQuotes = false }
      } else { cell += c }
    } else {
      if (c === '"')      { inQuotes = true }
      else if (c === delim) { cur.push(cell); cell = '' }
      else if (c === '\n')  { cur.push(cell); rowsRaw.push(cur); cur = []; cell = '' }
      else if (c === '\r')  { /* skip */ }
      else                  { cell += c }
    }
  }
  if (cell.length > 0 || cur.length > 0) { cur.push(cell); rowsRaw.push(cur) }

  if (rowsRaw.length === 0) return { headers: [], rows: [] }

  const headers = rowsRaw[0].map(h => h.trim())
  const rows = rowsRaw.slice(1)
    .filter(r => r.some(c => c.trim() !== ''))
    .map(r => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim() })
      return obj
    })

  return { headers, rows }
}

// ── Platform detection ───────────────────────────────────────────────────────

function detectPlatform(headers: string[]): Platform {
  const set = new Set(headers.map(h => h.toLowerCase()))
  const has = (...keys: string[]) => keys.some(k => set.has(k.toLowerCase()))

  // Airbnb signals
  if (has('confirmation code', 'code de confirmation', 'listing', 'annonce', 'gross earnings', 'recettes brutes')) {
    return 'airbnb'
  }
  // Booking signals
  if (has('book number', 'numéro de réservation', 'commission amount', 'montant de la commission', 'booker country')) {
    return 'booking'
  }
  return 'unknown'
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findCol(row: Record<string, string>, candidates: string[]): string {
  const keys = Object.keys(row)
  for (const c of candidates) {
    const k = keys.find(k => k.toLowerCase() === c.toLowerCase())
    if (k && row[k]) return row[k]
  }
  return ''
}

function parseAmount(s: string): number | null {
  if (!s) return null
  // Remove currency symbols, spaces, replace comma with dot
  const cleaned = s.replace(/[€$£\s]/g, '').replace(/\./g, '').replace(',', '.')
  // ^^ for FR format "1.234,56" → "1234.56" ; for "1,234.56" first replace "." (none after comma) leaves the dot
  // safer approach: detect format
  let n: number
  if (/,\d{1,2}$/.test(s.replace(/\s/g, ''))) {
    // FR format: "1.234,56" or "1234,56"
    n = parseFloat(s.replace(/[€$£\s]/g, '').replace(/\./g, '').replace(',', '.'))
  } else {
    // EN format: "1,234.56" or "1234.56"
    n = parseFloat(s.replace(/[€$£\s,]/g, ''))
  }
  if (isNaN(n)) return null
  return Math.round(n * 100) / 100
}

function parseDate(s: string): string | null {
  if (!s) return null
  const trimmed = s.trim()

  // ISO YYYY-MM-DD or YYYY/MM/DD
  let m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // DD/MM/YYYY or DD-MM-YYYY
  m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
  if (m) {
    const [, d, mo, y] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // MM/DD/YYYY (US fallback) - only if first part > 12 it's DD, else assume DD/MM (FR)
  // Already handled above as DD/MM
  // Try Date parser as last resort
  const dt = new Date(trimmed)
  if (!isNaN(dt.getTime())) {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  }
  return null
}

// ── Mapping per platform ─────────────────────────────────────────────────────

function mapAirbnbRow(row: Record<string, string>): ParsedRow {
  const type   = findCol(row, ['Type']).toLowerCase()
  const status = findCol(row, ['Status', 'Statut']).toLowerCase()

  // Skip payout lines (already counted in reservation lines)
  if (type.includes('payout') || type.includes('versement') || type.includes('paiement')) {
    return { raw: row, date_paiement: null, logement_nom: '', montant: null, voyageur: '', status: 'payout', reason: 'Versement Airbnb (déjà compté dans les réservations)' }
  }
  // Skip cancellations
  if (status.includes('cancel') || status.includes('annul') || type.includes('cancel') || type.includes('refund')) {
    return { raw: row, date_paiement: null, logement_nom: '', montant: null, voyageur: '', status: 'cancelled', reason: 'Réservation annulée' }
  }

  const dateStr = findCol(row, ['Start Date', 'Date d\'arrivée', "Date d'arrivée", 'Booking date', 'Date'])
  const date    = parseDate(dateStr)

  const logement = findCol(row, ['Listing', 'Annonce', 'Property']) || 'Airbnb'
  const guest    = findCol(row, ['Guest', 'Voyageur', 'Guest name'])

  // Prefer net Earnings, fallback to Gross Earnings, then Amount
  const amountStr = findCol(row, ['Earnings', 'Recettes', 'Net earnings', 'Gross Earnings', 'Recettes brutes', 'Amount', 'Montant'])
  const montant   = parseAmount(amountStr)

  if (!date || montant === null || montant <= 0) {
    return { raw: row, date_paiement: date, logement_nom: logement, montant, voyageur: guest, status: 'invalid', reason: !date ? 'Date manquante' : !montant ? 'Montant manquant' : 'Montant ≤ 0' }
  }

  return { raw: row, date_paiement: date, logement_nom: logement, montant, voyageur: guest, status: 'ok' }
}

function mapBookingRow(row: Record<string, string>): ParsedRow {
  const status = findCol(row, ['Status', 'Statut']).toLowerCase()

  if (status.includes('cancel') || status.includes('annul') || status === 'no_show' || status === 'no-show') {
    return { raw: row, date_paiement: null, logement_nom: '', montant: null, voyageur: '', status: 'cancelled', reason: `Réservation ${status}` }
  }

  const dateStr  = findCol(row, ['Check-in', 'Arrivée', 'Date d\'arrivée', "Date d'arrivée", 'Arrival'])
  const date     = parseDate(dateStr)
  const logement = findCol(row, ['Property', 'Logement', 'Listing', 'Hébergement']) || 'Booking.com'
  const guest    = findCol(row, ['Guest name', 'Nom du voyageur', 'Guest', 'Voyageur'])
  const amountStr= findCol(row, ['Price', 'Prix total', 'Total price', 'Total', 'Montant', 'Revenue'])
  const montant  = parseAmount(amountStr)

  if (!date || montant === null || montant <= 0) {
    return { raw: row, date_paiement: date, logement_nom: logement, montant, voyageur: guest, status: 'invalid', reason: !date ? 'Date manquante' : 'Montant manquant ou ≤ 0' }
  }

  return { raw: row, date_paiement: date, logement_nom: logement, montant, voyageur: guest, status: 'ok' }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ImportCSVModal({ open, onClose, onImported }: Props) {
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [rows, setRows]         = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pending, startT]       = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function reset() {
    setPlatform('unknown'); setRows([]); setFileName(''); setError(null); setFeedback(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleClose() {
    reset(); onClose()
  }

  async function handleFile(file: File) {
    setError(null); setFeedback(null)
    if (file.size > 5 * 1024 * 1024) { setError('Fichier trop lourd (max 5 Mo).'); return }
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setError('Format de fichier non supporté. Utilise un .csv exporté depuis Airbnb ou Booking.')
      return
    }

    let text: string
    try { text = await file.text() } catch { setError('Impossible de lire le fichier.'); return }

    const { headers, rows: rawRows } = parseCSV(text)
    if (headers.length === 0 || rawRows.length === 0) {
      setError('Le CSV semble vide ou mal formé.')
      return
    }

    const detected = detectPlatform(headers)
    setPlatform(detected)

    const parsed: ParsedRow[] = rawRows.map(r =>
      detected === 'booking' ? mapBookingRow(r) : mapAirbnbRow(r),
    )

    if (detected === 'unknown') {
      const okRows = parsed.filter(p => p.status === 'ok')
      if (okRows.length === 0) {
        setError(
          'Format non reconnu. Le CSV doit provenir d\'Airbnb (export Recettes) ou Booking.com (export Réservations).',
        )
        return
      }
    }

    setFileName(file.name)
    setRows(parsed)
  }

  function handleImport() {
    const okRows = rows.filter(r => r.status === 'ok')
    if (okRows.length === 0) return

    const platformLabel = platform === 'airbnb' ? 'Airbnb' : platform === 'booking' ? 'Booking.com' : 'CSV'

    startT(async () => {
      const res = await bulkImportRevenusEntries(
        okRows.map(r => ({
          logement_nom: r.logement_nom || platformLabel,
          montant: r.montant!,
          date_paiement: r.date_paiement!,
          mode_paiement: platform === 'booking' ? 'virement' : 'stripe',
          type_paiement: 'loyer',
          description: r.voyageur ? `Import ${platformLabel}, ${r.voyageur}` : `Import ${platformLabel}`,
        })),
      )

      if ('error' in res && res.error) { setError(res.error); return }

      const inserted = ('inserted' in res ? res.inserted : 0) ?? 0
      const skipped  = ('skipped'  in res ? res.skipped  : 0) ?? 0

      setFeedback(
        inserted > 0
          ? `✓ ${inserted} ligne${inserted > 1 ? 's' : ''} importée${inserted > 1 ? 's' : ''}${skipped > 0 ? ` · ${skipped} doublon${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''}` : ''}`
          : `Toutes les lignes existaient déjà (${skipped} ignorée${skipped > 1 ? 's' : ''}).`,
      )
      onImported(inserted)

      // Auto-close after 2s
      setTimeout(handleClose, 2000)
    })
  }

  const okCount      = rows.filter(r => r.status === 'ok').length
  const cancCount    = rows.filter(r => r.status === 'cancelled').length
  const payoutCount  = rows.filter(r => r.status === 'payout').length
  const invalidCount = rows.filter(r => r.status === 'invalid').length

  const platformLabel = platform === 'airbnb' ? 'Airbnb' : platform === 'booking' ? 'Booking.com' : 'Inconnu'

  return (
    <div style={s.overlay} onClick={handleClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        <div style={s.head}>
          <div>
            <h2 style={s.title}>Importer un CSV</h2>
            <p style={s.subtitle}>
              Exporte tes recettes depuis Airbnb ou tes réservations depuis Booking.com
            </p>
          </div>
          <button onClick={handleClose} style={s.closeBtn} aria-label="Fermer">
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Empty state, file picker */}
        {rows.length === 0 && !feedback && (
          <>
            <div style={s.dropZone} onClick={() => inputRef.current?.click()}>
              <CloudArrowUp size={36} weight="duotone" style={{ color: 'var(--accent-text)' }} />
              <p style={s.dropTitle}>Sélectionne ton fichier .csv</p>
              <p style={s.dropSub}>
                Airbnb : Hôte → Performance → Recettes → <em>Télécharger CSV</em><br />
                Booking : Extranet → Réservations → <em>Exporter</em> (XLS → enregistrer en .csv)
              </p>
              <input
                ref={inputRef} type="file" accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
            {error && (
              <div style={s.errBox}>
                <Warning size={14} weight="fill" /> {error}
              </div>
            )}
          </>
        )}

        {/* Preview */}
        {rows.length > 0 && !feedback && (
          <>
            <div style={s.metaRow}>
              <div style={s.metaChip}>
                <FileCsv size={13} weight="fill" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
              </div>
              <div style={{ ...s.metaChip, ...(platform === 'unknown' ? s.metaWarn : s.metaOk) }}>
                Plateforme&nbsp;: <strong>{platformLabel}</strong>
              </div>
            </div>

            <div style={s.statsRow}>
              <Stat label="Importables"  value={okCount}      color="#16a34a" />
              <Stat label="Annulées"     value={cancCount}    color="var(--text-muted)" />
              <Stat label="Versements"   value={payoutCount}  color="var(--text-muted)" />
              <Stat label="Invalides"    value={invalidCount} color="#fb923c" />
            </div>

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}></th>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Logement</th>
                    <th style={s.th}>Voyageur</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} style={r.status !== 'ok' ? s.trMuted : undefined}>
                      <td style={s.td}>
                        {r.status === 'ok' ? <Check size={13} color="#16a34a" weight="bold" />
                          : r.status === 'cancelled' ? <X size={13} color="var(--text-muted)" />
                          : r.status === 'payout'    ? <ArrowRight size={13} color="var(--text-muted)" />
                          : <Warning size={13} color="#fb923c" />}
                      </td>
                      <td style={s.td}>{r.date_paiement ?? '–'}</td>
                      <td style={{ ...s.td, ...s.tdEllipsis }}>{r.logement_nom || '–'}</td>
                      <td style={{ ...s.td, ...s.tdEllipsis, color: 'var(--text-muted)' }}>{r.voyageur || '–'}</td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: r.status === 'ok' ? 600 : 400 }}>
                        {r.montant != null ? `${r.montant.toFixed(2)} €` : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p style={s.tableNote}>+ {rows.length - 50} lignes non affichées (toutes seront traitées à l'import)</p>
              )}
            </div>

            {error && (
              <div style={s.errBox}>
                <Warning size={14} weight="fill" /> {error}
              </div>
            )}

            <div style={s.actions}>
              <button onClick={reset} style={s.btnGhost} disabled={pending}>
                Choisir un autre fichier
              </button>
              <button
                onClick={handleImport}
                disabled={okCount === 0 || pending}
                style={{ ...s.btnPrimary, opacity: okCount === 0 || pending ? 0.4 : 1 }}
              >
                {pending ? 'Import en cours…' : `Importer ${okCount} ligne${okCount > 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}

        {/* Feedback */}
        {feedback && (
          <div style={s.successBox}>
            <Check size={20} weight="fill" style={{ color: '#16a34a' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>{feedback}</p>
          </div>
        )}

      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={s.stat}>
      <span style={{ ...s.statValue, color }}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', backdropFilter: 'blur(3px)',
  },
  modal: {
    background: 'var(--card-bg)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
    width: '100%', maxWidth: '720px',
    maxHeight: '90vh', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '18px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  head:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' },
  title:    { fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.5 },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  dropZone: {
    border: '2px dashed var(--border-2)', borderRadius: '14px',
    padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
    background: 'var(--surface)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    transition: 'border-color 0.15s, background 0.15s',
  },
  dropTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 },
  dropSub:   { fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.7 },

  errBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    color: '#ef4444', fontSize: '13px',
  },

  metaRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  metaChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', padding: '5px 10px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)',
    maxWidth: '300px',
  },
  metaOk:   { borderColor: 'rgba(22,163,74,0.3)', color: '#16a34a' },
  metaWarn: { borderColor: 'rgba(251,146,60,0.3)', color: '#fb923c' },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
  },
  stat: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  },
  statValue: { fontSize: '20px', fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: '11px', color: 'var(--text-muted)' },

  tableWrap: {
    border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden',
    maxHeight: '300px', overflowY: 'auto',
  },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: {
    padding: '8px 10px', textAlign: 'left', fontWeight: 600,
    color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)', position: 'sticky' as const, top: 0,
    fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.4px',
  },
  td:        { padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' },
  tdEllipsis:{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  trMuted:   { opacity: 0.5 },
  tableNote: { fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px', margin: 0, background: 'var(--surface)' },

  actions:  { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  btnGhost: {
    fontSize: '13px', fontWeight: 500, padding: '9px 16px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },
  btnPrimary: {
    fontSize: '13px', fontWeight: 600, padding: '9px 18px', borderRadius: '8px',
    border: '1px solid var(--accent)', background: 'rgba(0,76,63,0.2)', color: 'var(--accent-text)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },

  successBox: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '20px', borderRadius: '12px',
    background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)',
    color: 'var(--text)',
  },
}
