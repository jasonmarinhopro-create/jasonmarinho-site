'use client'

import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import { fmtInt, type QueryLite } from '@/lib/visibility/admin-rules'
import { v, PlacePill, PlaceDelta } from './ui'

// Listes dépliables partagées (fiches pros, pages, villes) : grille sur
// ordinateur, cartes empilées sous 900 px (libellé au-dessus de chaque chiffre).

export const LIST_CSS = `
.vis-grid{display:grid;grid-template-columns:var(--cols);align-items:center;gap:14px}
.vis-row{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--border);padding:13px 10px;cursor:pointer;color:inherit;font:inherit;border-radius:0}
.vis-row:hover{background:var(--surface-2)}
.vis-row:focus-visible{outline:2px solid var(--accent-text);outline-offset:-2px}
.vis-row[aria-expanded=true]{background:var(--surface-2);border-bottom-color:transparent}
.vis-head{padding:0 10px 10px;border-bottom:1px solid var(--border)}
.vis-num{text-align:right;font-variant-numeric:tabular-nums;font-size:14px;font-weight:600;color:var(--text)}
.vis-num-label{display:none}
.vis-qt{display:grid;grid-template-columns:48px minmax(0,1fr) 52px 70px 56px;gap:10px;align-items:center}
.vis-caret{transition:transform .15s ease;color:var(--text-3);justify-self:end}
.vis-row[aria-expanded=true] .vis-caret{transform:rotate(180deg)}
@media (max-width:520px){
  .vis-qt{grid-template-columns:40px minmax(0,1fr) 40px 56px;gap:8px}
  .vis-qt-evol{display:none}
}
@media (max-width:900px){
  .vis-grid.vis-head{display:none}
  .vis-grid{display:flex;flex-wrap:wrap;gap:10px 18px}
  .vis-main{flex:1 1 100%;min-width:0}
  .vis-grow{flex:1 1 calc(100% - 80px);min-width:0}
  .vis-num{text-align:left}
  .vis-num-label{display:block;font-size:11px;color:var(--text-3);font-weight:600;letter-spacing:.2px}
  .vis-caret{margin-left:auto;align-self:center}
}
`

export function ListStyles() {
  return <InlineStyle css={LIST_CSS} />
}

export function Num({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="vis-num">
      <span className="vis-num-label">{label}</span>
      {children}
    </span>
  )
}

export function Caret() {
  return <CaretDown size={15} weight="bold" className="vis-caret" />
}

/** Recherche principale : pastille de place + texte */
export function MainQuery({ q, emptyText = 'Aucune recherche visible' }: { q: QueryLite | null; emptyText?: string }) {
  if (!q) return <span className="vis-main" style={{ fontSize: 13, color: 'var(--text-3)' }}>{emptyText}</span>
  return (
    <span className="vis-main" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <PlacePill place={q.place} />
      <span style={{ fontSize: 13.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={q.query}>{q.query}</span>
    </span>
  )
}

/** Détail déplié : toutes les recherches + place moyenne + actions */
export function QueriesDetail({ queries, pagePlace, prevPagePlace, subject, children }: {
  queries: QueryLite[]
  pagePlace: number | null
  prevPagePlace: number | null
  subject: string
  children?: React.ReactNode
}) {
  return (
    <div style={{ padding: '4px 10px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {queries.length > 0 ? <QueryTable queries={queries} /> : (
        <p style={{ ...v.sub, paddingTop: 10 }}>Google ne détaille aucune recherche pour {subject} sur la période (recherches trop rares, ou aucun affichage).</p>
      )}
      {pagePlace !== null && (
        <p style={{ ...v.text, fontSize: 13.5 }}>
          Toutes recherches confondues, {subject} sort en moyenne <strong style={{ color: 'var(--text)' }}>{pagePlace === 1 ? '1re' : `${pagePlace}e`}</strong>
          {prevPagePlace !== null ? <> ({prevPagePlace === 1 ? '1re' : `${prevPagePlace}e`} sur la période d&apos;avant).</> : <> (rien sur la période d&apos;avant).</>}
        </p>
      )}
      {children && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>}
    </div>
  )
}

/** Tableau des recherches d'une page (défilant au-delà d'une dizaine) */
export function QueryTable({ queries }: { queries: QueryLite[] }) {
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
      <div className="vis-qt" style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
        <span style={v.colHead}>Place</span>
        <span style={v.colHead}>Recherche</span>
        <span style={{ ...v.colHead, textAlign: 'right' }}>Clics</span>
        <span style={{ ...v.colHead, textAlign: 'right' }}>Affich.</span>
        <span className="vis-qt-evol" style={{ ...v.colHead, textAlign: 'right' }}>Évol.</span>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {queries.map((q, i) => (
          <div key={q.query} className="vis-qt" style={{ padding: '8px 12px', borderBottom: i < queries.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <PlacePill place={q.place} size="sm" />
            <span style={{ fontSize: 13.5, color: 'var(--text)', overflowWrap: 'anywhere' }}>{q.query}</span>
            <span style={{ ...v.num, fontSize: 13 }}>{fmtInt(q.clicks)}</span>
            <span style={{ ...v.num, fontSize: 13 }}>{fmtInt(q.impressions)}</span>
            <span className="vis-qt-evol" style={{ textAlign: 'right' }}><PlaceDelta delta={q.delta} isNew={q.isNew} compact /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  return (
    <label style={{ position: 'relative', display: 'flex', flex: '1 1 240px', minWidth: 0 }}>
      <MagnifyingGlass size={15} weight="bold" color="var(--text-3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} style={{ ...v.input, flex: 1 }} />
    </label>
  )
}

export function ChipGroup<T extends string>({ options, value, onChange, label }: {
  options: Array<{ key: T; label: string; count?: number }>
  value: T
  onChange: (k: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => (
        <button key={o.key} type="button" onClick={() => onChange(o.key)} aria-pressed={o.key === value} style={o.key === value ? v.chipOn : v.chip}>
          {o.label}{o.count !== undefined && <span style={{ opacity: 0.75, fontWeight: 600 }}>· {fmtInt(o.count)}</span>}
        </button>
      ))}
    </div>
  )
}

export function SortSelect<T extends string>({ options, value, onChange }: { options: Array<{ key: T; label: string }>; value: T; onChange: (k: T) => void }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
      Trier par
      <select value={value} onChange={e => onChange(e.target.value as T)} style={v.select}>
        {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function MoreButton({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null
  return (
    <button type="button" onClick={onMore} style={v.more}>
      Voir les {fmtInt(Math.min(50, total - shown))} suivantes <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>({fmtInt(total - shown)} restantes)</span>
    </button>
  )
}
