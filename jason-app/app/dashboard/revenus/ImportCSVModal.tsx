'use client'

// Import d'un export CSV Airbnb (Recettes) ou Booking.com (Réservations) dans
// les finances. Lecture et calculs : lib/finances/csv-import.ts (testé).
// 02/11/2026 : refait après le message d'une hôte (dates Airbnb mois/jour
// refusées, fond transparent, lignes de versement vides, nom de l'annonce
// remplacé par « Airbnb ») : un séjour par ligne, brut / frais / versé, choix
// du logement, frais de la plateforme ajoutés aux charges.

import { useMemo, useRef, useState, useTransition } from 'react'
import { CloudArrowUp, Check, X, Warning, FileCsv, Info } from '@phosphor-icons/react/dist/ssr'
import { bulkImportRevenusEntries, bulkImportPlatformFees } from './actions'
import { importPlatformCsv, matchLogement, type ImportResult } from '@/lib/finances/csv-import'

interface Props {
  open: boolean
  onClose: () => void
  onImported: (count: number) => void
  /** Logements de l'app, pour rattacher chaque annonce */
  logements?: Array<{ id: string; nom: string }>
}

const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const frDate = (iso: string | null) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '–'
const KEEP = '__annonce__'

export default function ImportCSVModal({ open, onClose, onImported, logements = [] }: Props) {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [withFees, setWithFees] = useState(true)
  const [pending, startT] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const listings = useMemo(() => Array.from(new Set((result?.stays ?? []).map(s => s.logement))), [result])
  const totals = useMemo(() => (result?.stays ?? []).reduce((a, s) => ({ brut: a.brut + s.brut, frais: a.frais + s.frais, verse: a.verse + s.verse, regul: a.regul + s.regularisation }), { brut: 0, frais: 0, verse: 0, regul: 0 }), [result])

  if (!open) return null

  const platformLabel = result?.platform === 'airbnb' ? 'Airbnb' : result?.platform === 'booking' ? 'Booking.com' : 'Inconnue'
  const nomFor = (listing: string) => {
    const v = mapping[listing]
    return !v || v === KEEP ? (listing || platformLabel) : v
  }

  function reset() {
    setResult(null); setFileName(''); setError(null); setFeedback(null); setMapping({}); setWithFees(true)
    if (inputRef.current) inputRef.current.value = ''
  }
  function handleClose() { reset(); onClose() }

  async function handleFile(file: File) {
    setError(null); setFeedback(null)
    if (file.size > 5 * 1024 * 1024) { setError('Fichier trop lourd (5 Mo au plus).'); return }
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') { setError('Choisis un fichier .csv exporté depuis Airbnb ou Booking.com.'); return }
    let text: string
    try { text = await file.text() } catch { setError('Impossible de lire le fichier.'); return }
    const r = importPlatformCsv(text)
    if (!r.headers.length) { setError('Le fichier semble vide.'); return }
    if (r.platform === 'unknown') { setError('Format non reconnu : le fichier doit venir d’Airbnb (Recettes) ou de Booking.com (Réservations).'); return }
    if (!r.stays.length) { setError('Aucun séjour à importer dans ce fichier.'); return }
    const names = logements.map(l => l.nom)
    const m: Record<string, string> = {}
    for (const listing of new Set(r.stays.map(s => s.logement))) m[listing] = matchLogement(listing, names) ?? KEEP
    setMapping(m)
    setFileName(file.name)
    setResult(r)
  }

  function handleImport() {
    if (!result?.stays.length) return
    const label = platformLabel
    startT(async () => {
      const entries = result.stays.map(s => ({
        logement_nom: nomFor(s.logement),
        montant: s.brut,
        date_paiement: s.date,
        mode_paiement: 'virement',
        type_paiement: 'loyer',
        description: [label, s.voyageur, s.nuits ? `${s.nuits} nuit${s.nuits > 1 ? 's' : ''}${s.arrivee ? ` dès le ${frDate(s.arrivee)}` : ''}` : null, s.code || null].filter(Boolean).join(' · '),
      }))
      const res = await bulkImportRevenusEntries(entries)
      if ('error' in res && res.error) { setError(res.error); return }
      const inserted = ('inserted' in res ? res.inserted : 0) ?? 0
      const skipped = ('skipped' in res ? res.skipped : 0) ?? 0
      let feesMsg = ''
      if (withFees) {
        const fees = result.stays.filter(s => s.frais > 0).map(s => {
          const nom = nomFor(s.logement)
          return { logement_nom: nom, logement_id: logements.find(l => l.nom === nom)?.id ?? null, montant: s.frais, date_charge: s.date, description: `Frais ${label}${s.voyageur ? ` · ${s.voyageur}` : ''}${s.code ? ` · ${s.code}` : ''}` }
        })
        const fr = await bulkImportPlatformFees(fees)
        if ('error' in fr && fr.error) { setError(`Séjours importés, mais pas les frais : ${fr.error}`); return }
        const fi = ('inserted' in fr ? fr.inserted : 0) ?? 0
        if (fi) feesMsg = ` et ${fi} frais ${label} ajoutés à tes charges`
      }
      setFeedback(inserted > 0
        ? `${inserted} séjour${inserted > 1 ? 's' : ''} importé${inserted > 1 ? 's' : ''}${feesMsg}${skipped ? ` (${skipped} déjà présent${skipped > 1 ? 's' : ''}, ignoré${skipped > 1 ? 's' : ''})` : ''}.`
        : `Ces séjours étaient déjà dans tes finances (${skipped} ignoré${skipped > 1 ? 's' : ''}).`)
      onImported(inserted)
      setTimeout(handleClose, 2500)
    })
  }

  const r = result
  return (
    <div style={s.overlay} onClick={handleClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="csv-title">
        <div style={s.head}>
          <div>
            <h2 id="csv-title" style={s.title}>Importer un fichier CSV</h2>
            <p style={s.subtitle}>Les recettes d’Airbnb ou les réservations de Booking.com, séjour par séjour.</p>
          </div>
          <button onClick={handleClose} style={s.closeBtn} aria-label="Fermer"><X size={16} weight="bold" /></button>
        </div>

        {!r && !feedback && (
          <>
            <button type="button" style={s.dropZone} onClick={() => inputRef.current?.click()}>
              <CloudArrowUp size={34} weight="duotone" style={{ color: 'var(--accent-text)' }} />
              <span style={s.dropTitle}>Choisis ton fichier .csv</span>
              <span style={s.dropSub}>
                Airbnb : depuis la page Revenus de ton compte hôte, export CSV des paiements<br />
                Booking.com : depuis l’Extranet, page Réservations, export enregistré en .csv
              </span>
            </button>
            <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {error && <div style={s.errBox}><Warning size={15} weight="fill" style={{ flexShrink: 0 }} /> {error}</div>}
          </>
        )}

        {r && !feedback && (
          <>
            <div style={s.metaRow}>
              <span style={s.metaChip}><FileCsv size={13} weight="fill" /><span style={s.ellipsis}>{fileName}</span></span>
              <span style={{ ...s.metaChip, ...s.metaOk }}>Plateforme : <strong>{platformLabel}</strong></span>
            </div>

            <div style={s.stats}>
              <Stat value={String(r.stays.length)} label={`séjour${r.stays.length > 1 ? 's' : ''}`} />
              <Stat value={eur(totals.brut)} label="recettes brutes" hint="ce que tu déclares" strong />
              <Stat value={eur(totals.frais)} label={`frais ${platformLabel}`} hint="en charges" />
              <Stat value={eur(totals.verse)} label="versé sur ton compte" />
            </div>

            <div style={s.notes}>
              {r.payouts > 0 && <Note>{r.payouts} ligne{r.payouts > 1 ? 's' : ''} « Payout » ignorée{r.payouts > 1 ? 's' : ''} : ce sont les virements de ces mêmes séjours, ils ne comptent pas deux fois.</Note>}
              {totals.regul !== 0 && <Note>{eur(totals.regul)} de régularisation (centre de résolution) déduit{Math.abs(totals.regul) > 1 ? 's' : ''} du séjour concerné.</Note>}
              {r.cancelled > 0 && <Note>{r.cancelled} réservation{r.cancelled > 1 ? 's' : ''} annulée{r.cancelled > 1 ? 's' : ''}, non importée{r.cancelled > 1 ? 's' : ''}.</Note>}
              {r.orphanAdjustments.map((a, i) => <Note key={i} warn>Régularisation de {eur(a.montant)}{a.code ? ` (${a.code})` : ''} sans séjour dans ce fichier : non importée, ajoute-la à la main si besoin.</Note>)}
              {r.problems.map((p, i) => <Note key={`p${i}`} warn>Ligne {p.ligne} non importée : {p.raison}.</Note>)}
            </div>

            {listings.length > 0 && (
              <div style={s.mapBox}>
                <span style={s.label}>Rattacher à quel logement ?</span>
                {listings.map(listing => (
                  <label key={listing} style={s.mapRow}>
                    <span style={{ ...s.ellipsis, flex: '1 1 200px', minWidth: 0 }} title={listing}>{listing || `Sans nom (${platformLabel})`}</span>
                    <select value={mapping[listing] ?? KEEP} onChange={e => setMapping(m => ({ ...m, [listing]: e.target.value }))} style={s.select}>
                      <option value={KEEP}>Garder le nom de l’annonce</option>
                      {logements.map(l => <option key={l.id} value={l.nom}>{l.nom}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            )}

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Séjour</th>
                    <th style={s.th}>Voyageur</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Brut</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Frais</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Versé</th>
                  </tr>
                </thead>
                <tbody>
                  {r.stays.map((st, i) => (
                    <tr key={`${st.code}-${i}`}>
                      <td style={s.td}>
                        <span style={{ display: 'block', color: 'var(--text)', fontWeight: 600 }}>{frDate(st.arrivee ?? st.date)}</span>
                        <span style={s.sub}>{st.nuits ? `${st.nuits} nuit${st.nuits > 1 ? 's' : ''}` : ''}{st.regularisation ? ` · régularisation ${eur(st.regularisation)}` : ''}</span>
                      </td>
                      <td style={{ ...s.td, ...s.ellipsis, maxWidth: 170 }} title={st.voyageur}>{st.voyageur || '–'}</td>
                      <td style={{ ...s.td, ...s.num, color: 'var(--text)', fontWeight: 600 }}>{eur(st.brut)}</td>
                      <td style={{ ...s.td, ...s.num }}>{st.frais ? eur(st.frais) : '–'}</td>
                      <td style={{ ...s.td, ...s.num }}>{eur(st.verse)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totals.frais > 0 && (
              <label style={s.check}>
                <input type="checkbox" checked={withFees} onChange={e => setWithFees(e.target.checked)} style={{ accentColor: 'var(--accent-text)' }} />
                <span>Ajouter les frais {platformLabel} à mes charges (commission de plateforme), pour un bénéfice juste.</span>
              </label>
            )}

            {error && <div style={s.errBox}><Warning size={15} weight="fill" style={{ flexShrink: 0 }} /> {error}</div>}

            <div style={s.actions}>
              <button onClick={reset} style={s.btnGhost} disabled={pending}>Choisir un autre fichier</button>
              <button onClick={handleImport} disabled={pending} style={{ ...s.btnPrimary, opacity: pending ? 0.5 : 1 }}>
                {pending ? 'Import en cours…' : `Importer ${r.stays.length} séjour${r.stays.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}

        {feedback && (
          <div style={s.successBox}>
            <Check size={20} weight="bold" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14 }}>{feedback}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ value, label, hint, strong }: { value: string; label: string; hint?: string; strong?: boolean }) {
  return (
    <div style={{ ...s.stat, ...(strong ? s.statStrong : {}) }}>
      <span style={{ ...s.statValue, ...(strong ? { color: 'var(--accent-text)' } : {}) }}>{value}</span>
      <span style={s.statLabel}>{label}</span>
      {hint && <span style={s.statHint}>{hint}</span>}
    </div>
  )
}

function Note({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <p style={{ ...s.note, ...(warn ? { color: 'var(--danger)' } : {}) }}>
      {warn ? <Warning size={14} weight="fill" style={{ flexShrink: 0, marginTop: 2 }} /> : <Info size={14} weight="bold" style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent-text)' }} />}
      <span>{children}</span>
    </p>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  // Fond opaque : --surface est transparent en thème sombre (voir globals.css)
  modal: { background: 'var(--floating-surface)', border: '1px solid var(--floating-border)', borderRadius: 18, padding: 22, width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 70px rgba(0,0,0,0.35)' },
  head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, fontWeight: 400, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: 13.5, color: 'var(--text-2)', margin: '4px 0 0', lineHeight: 1.5 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dropZone: { border: '2px dashed var(--border-2)', borderRadius: 14, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, fontFamily: 'inherit', width: '100%' },
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  dropSub: { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 },
  errBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--danger)', fontSize: 13 },
  metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaChip: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '5px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', maxWidth: 300 },
  metaOk: { border: '1px solid var(--accent-border)', color: 'var(--accent-text)' },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 },
  stat: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2 },
  statStrong: { border: '1px solid var(--accent-border)', background: 'var(--accent-bg)' },
  statValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 21, fontWeight: 400, color: 'var(--text)', lineHeight: 1.15 },
  statLabel: { fontSize: 12.5, color: 'var(--text-2)' },
  statHint: { fontSize: 11.5, color: 'var(--text-3)' },
  notes: { display: 'flex', flexDirection: 'column', gap: 6 },
  note: { display: 'flex', gap: 8, alignItems: 'flex-start', margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' },
  mapBox: { display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' },
  label: { fontSize: 12, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-3)' },
  mapRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13.5, color: 'var(--text)' },
  select: { flex: '1 1 220px', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--floating-surface)', color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit' },
  tableWrap: { border: '1px solid var(--border)', borderRadius: 12, overflow: 'auto', maxHeight: 320, minHeight: 180, flexShrink: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' },
  td: { padding: '9px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', verticalAlign: 'top' },
  sub: { display: 'block', fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 },
  num: { textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  check: { display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5, cursor: 'pointer' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
  btnGhost: { fontSize: 13.5, fontWeight: 500, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { fontSize: 13.5, fontWeight: 600, padding: '10px 18px', borderRadius: 10, border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit' },
  successBox: { display: 'flex', alignItems: 'center', gap: 12, padding: 18, borderRadius: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--text)' },
}
