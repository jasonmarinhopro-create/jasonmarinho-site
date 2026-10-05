'use client'

import { useMemo, useState } from 'react'
import { filterQueries, fmtInt, ctrLabel, type QueryFilter, type QuerySort } from '@/lib/visibility/admin-rules'
import type { RecherchesData } from '@/lib/visibility/admin-build'
import { v, BucketBar, Figure, PlacePill, PlaceDelta, PLACE_KEYS, badge, ACCENT } from './ui'
import { ListStyles, Num, SearchBox, ChipGroup, SortSelect, MoreButton } from './ListParts'

const COLS = '60px minmax(0,2fr) 104px minmax(0,1.3fr) 64px 92px 70px'
const PAGE = 50

export default function RecherchesTab({ d }: { d: RecherchesData }) {
  const [filter, setFilter] = useState<QueryFilter>('toutes')
  const [sort, setSort] = useState<QuerySort>('place')
  const [hideBrand, setHideBrand] = useState(true)
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => filterQueries(d.items, { filter, hideBrand, q, sort }), [d.items, filter, hideBrand, q, sort])
  const counts = useMemo(() => ({
    progres: d.items.filter(x => (x.delta ?? 0) > 0 && (!hideBrand || !x.brand)).length,
    recul: d.items.filter(x => (x.delta ?? 0) < 0 && (!hideBrand || !x.brand)).length,
    nouvelles: d.items.filter(x => x.isNew && (!hideBrand || !x.brand)).length,
  }), [d.items, hideBrand])
  const reset = () => setLimit(PAGE)

  return (
    <>
      <ListStyles />
      <section style={v.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 style={v.title}>Les {fmtInt(d.total)} recherches où Google nous montre</h2>
              <p style={{ ...v.sub, marginTop: 3 }}>Tout le site, à la place moyenne de notre meilleure page sur chaque recherche, dont {fmtInt(d.brand)} sur notre nom.</p>
            </div>
            <BucketBar counts={d.buckets} keys={PLACE_KEYS} height={16} />
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Figure label="En première page" value={fmtInt(d.firstPage)} sub="dans les 10 premiers" />
            <Figure label="À un pas" value={fmtInt(d.nearly)} sub="entre la 11e et la 20e place" />
          </div>
        </div>
      </section>

      <section style={{ ...v.card, gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <SearchBox value={q} onChange={s => { setQ(s); reset() }} placeholder="Chercher une recherche ou une page" />
          <SortSelect value={sort} onChange={setSort} options={[
            { key: 'place', label: 'Place' }, { key: 'clics', label: 'Clics' }, { key: 'affichages', label: 'Affichages' }, { key: 'progression', label: 'Progression' },
          ]} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <ChipGroup label="Filtre" value={filter} onChange={f => { setFilter(f); reset() }} options={[
            { key: 'toutes', label: 'Toutes' },
            { key: 'progres', label: 'En progrès', count: counts.progres },
            { key: 'recul', label: 'En recul', count: counts.recul },
            { key: 'nouvelles', label: 'Nouvelles', count: counts.nouvelles },
          ]} />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={hideBrand} onChange={e => { setHideBrand(e.target.checked); reset() }} style={{ width: 16, height: 16, accentColor: 'var(--accent-text)' }} />
            Masquer les recherches sur notre nom
          </label>
        </div>

        <div>
          <div className="vis-grid vis-head" style={{ ['--cols' as string]: COLS }}>
            <span style={v.colHead}>Place</span>
            <span style={v.colHead}>Recherche</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Évolution</span>
            <span style={v.colHead}>Page principale</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Clics</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Affichages</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Taux</span>
          </div>
          {list.length === 0 && <p style={v.empty}>Aucune recherche ne correspond.</p>}
          {list.slice(0, limit).map(x => (
            <div key={x.query} style={{ padding: '11px 10px', borderBottom: '1px solid var(--border)' }}>
              <div className="vis-grid" style={{ ['--cols' as string]: COLS }}>
                <PlacePill place={x.place} />
                <span className="vis-grow" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' }}>{x.query}</span>
                  {x.isNew && <span style={badge(ACCENT)}>nouvelle</span>}
                  {x.brand && <span style={badge('var(--text-3)')}>notre nom</span>}
                </span>
                <Num label="Évolution"><PlaceDelta delta={x.delta} /></Num>
                <span className="vis-main" style={{ fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={x.mainPath ?? undefined}>
                  {x.mainLabel ?? '–'}
                </span>
                <Num label="Clics">{fmtInt(x.clicks)}</Num>
                <Num label="Affichages">{fmtInt(x.impressions)}</Num>
                <Num label="Taux"><span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{ctrLabel(x.clicks, x.impressions)}</span></Num>
              </div>
            </div>
          ))}
        </div>
        <MoreButton shown={limit} total={list.length} onMore={() => setLimit(l => l + PAGE)} />
        {d.total > d.items.length && (
          <p style={{ ...v.sub, textAlign: 'center' }}>Les {fmtInt(d.items.length)} recherches les plus cliquées sont listées ici, sur {fmtInt(d.total)}.</p>
        )}
      </section>
    </>
  )
}
