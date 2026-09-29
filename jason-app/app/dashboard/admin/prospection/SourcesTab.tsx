'use client'

// Onglet « Trouver des contacts » : annuaire des entreprises (INSEE, gratuit),
// Google Maps (site web puis e-mail publié), import d'un fichier CSV (export
// DATAtourisme ou tableur). Chaque contact garde sa source et sa date de
// collecte (information au premier message, CNIL).

import { useMemo, useState } from 'react'
import { Buildings, MapPin, FileArrowUp, MagnifyingGlass, CheckCircle, WarningCircle, ArrowSquareOut, Globe, Info } from '@phosphor-icons/react/dist/ssr'
import { AUDIENCES, type Audience } from '@/lib/outreach/engine'
import { parseCsv, mapHeaders, rowsToContacts, type CsvField } from '@/lib/outreach/csv'
import type { FoundContact } from '@/lib/outreach/sources'
import { AMBER, BROWN, tint } from '../_ui/theme'
import { importContacts, searchSireneAction, searchGoogleAction, findEmails } from './actions'
import { ui } from './shared'

const NAF: Record<Audience, Array<{ code: string; label: string }>> = {
  photographe: [{ code: '74.20Z', label: 'Activités photographiques' }],
  menage: [
    { code: '81.21Z', label: 'Nettoyage courant des bâtiments' },
    { code: '81.22Z', label: 'Autres nettoyages des bâtiments' },
    { code: '81.29B', label: 'Autres activités de nettoyage' },
  ],
  hote: [{ code: '55.20Z', label: 'Hébergement touristique et de courte durée' }],
  autre: [],
}
const QUERY_HINT: Record<Audience, string> = {
  photographe: 'photographe immobilier Annecy',
  menage: 'ménage location saisonnière Nice',
  hote: 'gîte Dordogne',
  autre: '',
}
const FIELD_LABEL: Record<CsvField, string> = {
  email: 'E-mail', prenom: 'Prénom', nom: 'Nom', entreprise: 'Entreprise', ville: 'Ville', departement: 'Département',
  site_web: 'Site web', telephone: 'Téléphone', instagram: 'Instagram', siren: 'SIREN',
}

type Msg = { ok?: string; err?: string } | null

export default function SourcesTab({ audience, placesKey }: { audience: Audience; placesKey: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={ui.notice}>
        <Info size={17} weight="fill" style={{ flexShrink: 0, marginTop: '1px', color: AMBER }} />
        <span>
          Prospection entre professionnels : pas besoin d&apos;accord préalable, à condition d&apos;écrire à une adresse professionnelle, pour une offre liée à son métier,
          en disant d&apos;où vient l&apos;adresse et avec une désinscription en un clic. Le premier e-mail de chaque séquence l&apos;ajoute tout seul.
          {' '}<a href="https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique-sms-mms-et-automate-dappel" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>Règles de la CNIL</a>
        </span>
      </div>
      <div style={s.grid}>
        <GoogleCard audience={audience} enabled={placesKey} />
        <SireneCard audience={audience} />
        <CsvCard audience={audience} />
      </div>
    </div>
  )
}

function Flash({ msg }: { msg: Msg }) {
  if (!msg) return null
  return (
    <div style={{ ...ui.notice, ...(msg.ok ? { background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' } : { background: tint('var(--danger)', 8), borderColor: tint('var(--danger)', 30), color: 'var(--danger)' }) }}>
      {msg.ok ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />} {msg.ok ?? msg.err}
    </div>
  )
}

function Head({ icon, color, title, sub, badge }: { icon: React.ReactNode; color: string; title: string; sub: string; badge: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ ...s.icon, color, background: tint(color, 12) }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h3 style={ui.cardTitle}>{title}</h3>
          <span style={ui.pill}>{badge}</span>
        </div>
        <p style={{ ...ui.sub, marginTop: '4px' }}>{sub}</p>
      </div>
    </div>
  )
}

function ResultList({ rows, picked, setPicked, known, keyOf }: {
  rows: FoundContact[]; picked: Set<number>; setPicked: (s: Set<number>) => void; known: Set<string>; keyOf: (r: FoundContact) => string | null | undefined
}) {
  if (!rows.length) return null
  const fresh = rows.map((r, i) => ({ r, i })).filter(x => !known.has(keyOf(x.r) ?? ''))
  return (
    <div style={s.results}>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-3)', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <input type="checkbox" checked={fresh.length > 0 && fresh.every(x => picked.has(x.i))} onChange={e => setPicked(e.target.checked ? new Set(fresh.map(x => x.i)) : new Set())} style={{ accentColor: 'var(--accent-text)' }} />
        {rows.length} résultat{rows.length > 1 ? 's' : ''}, {rows.length - fresh.length} déjà dans tes contacts
      </label>
      {rows.map((r, i) => {
        const already = known.has(keyOf(r) ?? '')
        return (
          <label key={i} style={{ ...s.resRow, opacity: already ? 0.5 : 1 }}>
            <input type="checkbox" disabled={already} checked={picked.has(i)} onChange={() => { const n = new Set(picked); if (n.has(i)) n.delete(i); else n.add(i); setPicked(n) }} style={{ accentColor: 'var(--accent-text)', marginTop: '3px' }} />
            <span style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ fontSize: '13.5px', color: 'var(--text)' }}>{r.entreprise || r.nom}</strong>
              {r.entreprise && r.nom && r.nom !== r.entreprise && <span style={{ fontSize: '12.5px', color: 'var(--text-3)' }}> · {r.nom}</span>}
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-2)', overflowWrap: 'anywhere' }}>
                {[r.ville, r.departement ? `(${r.departement})` : null].filter(Boolean).join(' ')}
                {r.site_web && <> · <Globe size={11} /> {r.site_web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</>}
                {r.siren && <> · SIREN {r.siren}</>}
                {already && ' · déjà ajouté'}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

function GoogleCard({ audience, enabled }: { audience: Audience; enabled: boolean }) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<FoundContact[]>([])
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [token, setToken] = useState<string | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<Msg>(null)
  const [autoFind, setAutoFind] = useState(true)

  async function search(more = false) {
    setBusy('search'); setMsg(null)
    const res = await searchGoogleAction(audience, query, more ? token ?? undefined : undefined)
    setBusy(null)
    if (!res.ok) return setMsg({ err: res.error })
    const next = more ? [...rows, ...res.data!.results] : res.data!.results
    setRows(next)
    setKnown(new Set([...(more ? Array.from(known) : []), ...res.data!.known]))
    setToken(res.data!.nextPageToken)
    if (!more) setPicked(new Set())
  }
  async function add() {
    const list = rows.filter((_, i) => picked.has(i))
    setBusy('add'); setMsg(null)
    const res = await importContacts(audience, list, 'google', `Google Maps : « ${query} »`)
    if (!res.ok) { setBusy(null); return setMsg({ err: res.error }) }
    let text = `${res.data!.added} contact${res.data!.added > 1 ? 's' : ''} ajouté${res.data!.added > 1 ? 's' : ''}`
    if (autoFind && res.data!.ids.length) {
      setMsg({ ok: `${text}. Recherche des e-mails sur leurs sites…` })
      const f = await findEmails(res.data!.ids)
      if (f.ok) text += `, ${f.data!.found} e-mail${f.data!.found > 1 ? 's' : ''} trouvé${f.data!.found > 1 ? 's' : ''}${f.data!.left ? ` (${f.data!.left} à chercher depuis l'onglet Contacts)` : ''}`
    }
    setBusy(null)
    setMsg({ ok: text })
    setKnown(k => new Set([...Array.from(k), ...list.map(r => r.site_web ?? '')]))
    setPicked(new Set())
  }

  return (
    <div style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Head icon={<MapPin size={18} weight="fill" />} color="var(--accent-text)" title="Google Maps" badge="1 000 recherches gratuites / mois"
        sub="Les pros actifs, avec leur site : l'app y cherche l'e-mail publié (accueil, contact, mentions légales). La meilleure source pour les photographes." />
      {!enabled ? (
        <p style={ui.sub}>Clé Google absente : ajoute GOOGLE_PLACES_API_KEY sur Vercel (la même que pour l&apos;audit de fiche Google).</p>
      ) : (
        <>
          <form onSubmit={e => { e.preventDefault(); search() }} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`ex. ${QUERY_HINT[audience]}`} style={{ ...ui.input, flex: '1 1 200px', width: 'auto' }} aria-label="Recherche Google Maps" />
            <button type="submit" disabled={busy === 'search' || query.trim().length < 3} style={ui.btn}><MagnifyingGlass size={14} weight="bold" /> {busy === 'search' ? 'Recherche…' : 'Chercher'}</button>
          </form>
          <ResultList rows={rows} picked={picked} setPicked={setPicked} known={known} keyOf={r => r.site_web} />
          {rows.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" onClick={add} disabled={!picked.size || !!busy} style={{ ...ui.btn, opacity: picked.size ? 1 : 0.5 }}>{busy === 'add' ? 'Ajout…' : `Ajouter ${picked.size || ''} en ${AUDIENCES[audience].plural.toLowerCase()}`}</button>
              {token && <button type="button" onClick={() => search(true)} disabled={!!busy} style={ui.btnGhost}>20 de plus</button>}
              <label style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', fontSize: '12.5px', color: 'var(--text-2)' }}>
                <input type="checkbox" checked={autoFind} onChange={e => setAutoFind(e.target.checked)} style={{ accentColor: 'var(--accent-text)' }} /> chercher les e-mails tout de suite
              </label>
            </div>
          )}
        </>
      )}
      <Flash msg={msg} />
    </div>
  )
}

function SireneCard({ audience }: { audience: Audience }) {
  const codes = NAF[audience]
  const [naf, setNaf] = useState(codes[0]?.code ?? '')
  const [dep, setDep] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState<FoundContact[]>([])
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<Msg>(null)
  const nafNow = codes.find(c => c.code === naf) ? naf : codes[0]?.code ?? ''

  async function search(p = 1) {
    setBusy('search'); setMsg(null)
    const res = await searchSireneAction(audience, nafNow, dep, p)
    setBusy(null)
    if (!res.ok) return setMsg({ err: res.error })
    setRows(res.data!.results); setKnown(new Set(res.data!.known)); setPage(p); setPages(res.data!.pages); setTotal(res.data!.total); setPicked(new Set())
  }
  async function add() {
    const list = rows.filter((_, i) => picked.has(i))
    setBusy('add')
    const res = await importContacts(audience, list, 'sirene', `Annuaire des entreprises, ${nafNow}, département ${dep}`)
    setBusy(null)
    if (!res.ok) return setMsg({ err: res.error })
    setMsg({ ok: `${res.data!.added} ajouté${res.data!.added > 1 ? 's' : ''} en « E-mail à trouver » : l'annuaire ne donne pas d'e-mail, complète-les depuis l'onglet Contacts (bouton « Chercher sur Google »).` })
    setKnown(k => new Set([...Array.from(k), ...list.map(r => r.siren ?? '')]))
    setPicked(new Set())
  }

  if (!codes.length) return null
  return (
    <div style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Head icon={<Buildings size={18} weight="fill" />} color={BROWN} title="Annuaire des entreprises" badge="INSEE, gratuit"
        sub="Toutes les entreprises actives d'un métier dans un département, données officielles. Pas d'e-mail : utile pour repérer, à compléter ensuite." />
      <form onSubmit={e => { e.preventDefault(); search(1) }} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <select value={nafNow} onChange={e => setNaf(e.target.value)} style={{ ...ui.input, flex: '2 1 200px', width: 'auto' }} aria-label="Activité">
          {codes.map(c => <option key={c.code} value={c.code}>{c.code} · {c.label}</option>)}
        </select>
        <input value={dep} onChange={e => setDep(e.target.value)} placeholder="Département, ex. 74" style={{ ...ui.input, flex: '1 1 110px', width: 'auto' }} aria-label="Département" />
        <button type="submit" disabled={busy === 'search' || !dep.trim()} style={ui.btn}><MagnifyingGlass size={14} weight="bold" /> {busy === 'search' ? 'Recherche…' : 'Chercher'}</button>
      </form>
      {total > 0 && <span style={ui.sub}>{total} entreprise{total > 1 ? 's' : ''} active{total > 1 ? 's' : ''}, page {page} sur {pages}</span>}
      <ResultList rows={rows} picked={picked} setPicked={setPicked} known={known} keyOf={r => r.siren} />
      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={add} disabled={!picked.size || !!busy} style={{ ...ui.btn, opacity: picked.size ? 1 : 0.5 }}>Ajouter {picked.size || ''}</button>
          <button type="button" onClick={() => search(page - 1)} disabled={page <= 1 || !!busy} style={{ ...ui.btnGhost, opacity: page <= 1 ? 0.5 : 1 }}>Page précédente</button>
          <button type="button" onClick={() => search(page + 1)} disabled={page >= pages || !!busy} style={{ ...ui.btnGhost, opacity: page >= pages ? 0.5 : 1 }}>Page suivante</button>
        </div>
      )}
      <Flash msg={msg} />
    </div>
  )
}

function CsvCard({ audience }: { audience: Audience }) {
  const [headers, setHeaders] = useState<string[]>([])
  const [body, setBody] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Array<CsvField | null>>([])
  const [fileName, setFileName] = useState('')
  const [isDt, setIsDt] = useState(audience === 'hote')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)
  const contacts = useMemo(() => rowsToContacts(body, mapping), [body, mapping])
  const withEmail = contacts.filter(c => c.email).length

  async function onFile(file: File) {
    setMsg(null)
    if (file.size > 8 * 1024 * 1024) return setMsg({ err: 'Fichier trop lourd (8 Mo max) : filtre ton export par département.' })
    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length < 2) return setMsg({ err: 'Fichier vide ou illisible.' })
    setFileName(file.name)
    setHeaders(rows[0])
    setBody(rows.slice(1))
    setMapping(mapHeaders(rows[0]))
    if (/datatourisme/i.test(file.name)) setIsDt(true)
  }
  async function run() {
    setBusy(true)
    const res = await importContacts(audience, contacts, isDt ? 'datatourisme' : 'csv', isDt ? `DATAtourisme (${fileName})` : `Fichier ${fileName}`)
    setBusy(false)
    if (!res.ok) return setMsg({ err: res.error })
    setMsg({ ok: `${res.data!.added} contact${res.data!.added > 1 ? 's' : ''} ajouté${res.data!.added > 1 ? 's' : ''}, ${res.data!.skipped} ignoré${res.data!.skipped > 1 ? 's' : ''} (doublons, adresses désinscrites ou invalides).` })
    setHeaders([]); setBody([]); setMapping([])
  }

  return (
    <div style={{ ...ui.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Head icon={<FileArrowUp size={18} weight="fill" />} color={AMBER} title="DATAtourisme ou fichier CSV" badge="gratuit"
        sub="DATAtourisme publie les gîtes, chambres d'hôtes et meublés déclarés aux offices de tourisme, souvent avec leur e-mail : la meilleure source pour les hôtes." />
      <ol style={s.steps}>
        <li>Ouvre <a href="https://www.datatourisme.fr/explorer-les-donnees/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>l&apos;explorateur DATAtourisme <ArrowSquareOut size={11} /></a> (sans compte).</li>
        <li>Filtre sur les hébergements (gîtes, chambres d&apos;hôtes, meublés) et un département.</li>
        <li>Télécharge en CSV et dépose le fichier ici. Même chose pour n&apos;importe quel tableur exporté en CSV.</li>
      </ol>
      <label style={s.drop}>
        <FileArrowUp size={20} weight="duotone" color="var(--accent-text)" />
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{fileName || 'Choisir un fichier .csv'}</span>
        <input type="file" accept=".csv,text/csv" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} style={{ display: 'none' }} />
      </label>
      {headers.length > 0 && (
        <>
          <span style={ui.sub}>Vérifie les colonnes reconnues :</span>
          <div style={s.mapGrid}>
            {headers.map((h, i) => (
              <label key={i} style={ui.label}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h}>{h || `Colonne ${i + 1}`}</span>
                <select value={mapping[i] ?? ''} onChange={e => setMapping(m => m.map((x, j) => j === i ? (e.target.value || null) as CsvField | null : x))} style={{ ...ui.input, padding: '6px 8px', fontSize: '13px' }}>
                  <option value="">Ignorer</option>
                  {(Object.keys(FIELD_LABEL) as CsvField[]).map(k => <option key={k} value={k}>{FIELD_LABEL[k]}</option>)}
                </select>
              </label>
            ))}
          </div>
          <label style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', fontSize: '12.5px', color: 'var(--text-2)' }}>
            <input type="checkbox" checked={isDt} onChange={e => setIsDt(e.target.checked)} style={{ accentColor: 'var(--accent-text)' }} /> Export DATAtourisme (cité comme source dans le premier e-mail)
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={run} disabled={busy || !contacts.length} style={ui.btn}>{busy ? 'Import…' : `Importer ${contacts.length} contact${contacts.length > 1 ? 's' : ''}`}</button>
            <span style={ui.sub}>{withEmail} avec e-mail, {contacts.length - withEmail} à compléter · audience : {AUDIENCES[audience].plural.toLowerCase()}</span>
          </div>
        </>
      )}
      <Flash msg={msg} />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 440px), 1fr))', gap: '16px', alignItems: 'start' },
  icon: { width: '38px', height: '38px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  results: { maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg)' },
  resRow: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer' },
  steps: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 },
  drop: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '18px', borderRadius: '14px', border: '1.5px dashed var(--accent-border)', background: 'color-mix(in srgb, var(--accent-bg) 50%, transparent)', cursor: 'pointer' },
  mapGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: '8px' },
}
