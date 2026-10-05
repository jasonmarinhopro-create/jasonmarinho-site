'use client'

import { useMemo, useState } from 'react'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import { filterPages, fmtInt, type PageItem, type PageSort } from '@/lib/visibility/admin-rules'
import { PAGE_KIND_LABEL, type PageKind } from '@/lib/visibility/rules'
import type { PagesData } from '@/lib/visibility/admin-build'
import { v, Figure, PlaceDelta } from './ui'
import { ListStyles, Num, Caret, MainQuery, QueriesDetail, SearchBox, ChipGroup, SortSelect, MoreButton } from './ListParts'

const COLS = 'minmax(0,1.6fr) minmax(0,1.7fr) 64px 90px 84px 100px 18px'
const PAGE = 50

// Pluriels des sortes de pages pour les pastilles
const KIND_PLURAL: Partial<Record<PageKind, string>> = {
  blog: 'Blog', simulateur: 'Simulateurs', partenaire: 'Partenaires', comparatif: 'Comparatifs', service: 'Services',
  annuaire: 'Annuaires', accueil: 'Accueil', autre: 'Autres pages',
}

export default function PagesTab({ d }: { d: PagesData }) {
  const [kind, setKind] = useState<PageKind | 'all'>('all')
  const [sort, setSort] = useState<PageSort>('clics')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => filterPages(d.items, { kind, q, sort }), [d.items, kind, q, sort])
  const shown = kind === 'all' ? d.items : d.items.filter(p => p.kind === kind)
  const firstPage = shown.filter(p => p.main && p.main.place <= 10).length

  return (
    <>
      <ListStyles />
      <section style={v.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h2 style={v.title}>Les {fmtInt(d.items.length)} autres pages vues dans Google</h2>
              <p style={{ ...v.sub, marginTop: 3 }}>Blog, simulateurs, partenaires, comparatifs, services, accueil. Les fiches pros et les pages villes ont leur onglet.</p>
            </div>
            <ChipGroup
              label="Sorte de page"
              value={kind}
              onChange={k => { setKind(k); setLimit(PAGE) }}
              options={[{ key: 'all' as const, label: 'Toutes', count: d.items.length }, ...d.kinds.map(k => ({ key: k.kind, label: KIND_PLURAL[k.kind] ?? PAGE_KIND_LABEL[k.kind], count: k.count }))]}
            />
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Figure label="En première page" value={fmtInt(firstPage)} sub={`sur ${fmtInt(shown.length)} pages`} />
            <Figure label="Clics" value={fmtInt(shown.reduce((n, p) => n + p.clicks, 0))} sub="depuis Google" />
          </div>
        </div>
      </section>

      <section style={{ ...v.card, gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <SearchBox value={q} onChange={s => { setQ(s); setLimit(PAGE) }} placeholder="Chercher une page ou une recherche" />
          <SortSelect value={sort} onChange={setSort} options={[
            { key: 'clics', label: 'Clics' }, { key: 'affichages', label: 'Affichages' }, { key: 'place', label: 'Place' }, { key: 'visiteurs', label: 'Visiteurs' },
          ]} />
        </div>
        <div>
          <div className="vis-grid vis-head" style={{ ['--cols' as string]: COLS }}>
            <span style={v.colHead}>Page</span>
            <span style={v.colHead}>Recherche principale</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Clics</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Affichages</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Visiteurs</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Évolution</span>
            <span />
          </div>
          {list.length === 0 && <p style={v.empty}>Aucune page ne correspond.</p>}
          {list.slice(0, limit).map(p => <PageRow key={p.path} p={p} open={open === p.path} onToggle={() => setOpen(open === p.path ? null : p.path)} />)}
        </div>
        <MoreButton shown={limit} total={list.length} onMore={() => setLimit(l => l + PAGE)} />
      </section>
    </>
  )
}

function PageRow({ p, open, onToggle }: { p: PageItem; open: boolean; onToggle: () => void }) {
  const title = p.label.includes(' · ') ? p.label.split(' · ').slice(1).join(' · ') : p.label
  return (
    <div>
      <button type="button" className="vis-row" aria-expanded={open} onClick={onToggle}>
        <span className="vis-grid" style={{ ['--cols' as string]: COLS }}>
          <span className="vis-main" style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.path}>{title}</span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{PAGE_KIND_LABEL[p.kind]} · {p.path}</span>
          </span>
          <MainQuery q={p.main} emptyText="Recherches masquées" />
          <Num label="Clics">{fmtInt(p.clicks)}</Num>
          <Num label="Affichages">{fmtInt(p.impressions)}</Num>
          <Num label="Visiteurs">{fmtInt(p.visitors)}</Num>
          <Num label="Évolution"><PlaceDelta delta={p.main?.delta ?? null} isNew={p.main?.isNew} /></Num>
          <Caret />
        </span>
      </button>
      {open && (
        <QueriesDetail queries={p.queries} pagePlace={p.pagePlace} prevPagePlace={p.prevPagePlace} subject="la page">
          <a href={`https://jasonmarinho.com${p.path === '/' ? '' : p.path}`} target="_blank" rel="noopener noreferrer" style={v.btn}>
            <ArrowSquareOut size={15} weight="bold" /> Voir la page
          </a>
        </QueriesDetail>
      )}
    </div>
  )
}
