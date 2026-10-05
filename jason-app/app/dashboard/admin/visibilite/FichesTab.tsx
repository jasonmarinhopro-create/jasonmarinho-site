'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Camera, Broom, ArrowSquareOut, PresentationChart, IdentificationCard } from '@phosphor-icons/react/dist/ssr'
import { AMBER, BROWN } from '../_ui/theme'
import { filterPros, fmtInt, type ProFilter, type ProSort, type ProBucket, type ProItem } from '@/lib/visibility/admin-rules'
import type { FichesData } from '@/lib/visibility/admin-build'
import { v, BucketBar, Figure, PlaceDelta, badge, ACCENT } from './ui'
import { ListStyles, Num, Caret, MainQuery, QueriesDetail, SearchBox, ChipGroup, SortSelect, MoreButton } from './ListParts'

const COLS = 'minmax(0,1.5fr) minmax(0,1.7fr) 64px 90px 84px 84px 100px 18px'
const ALL_BUCKETS: ProBucket[] = ['1', '2-3', '4-10', '11-20', '21+', 'masked', 'never']
const PAGE = 50

export default function FichesTab({ d }: { d: FichesData }) {
  const [kind, setKind] = useState<'all' | 'photographe' | 'menage'>('all')
  const [filter, setFilter] = useState<ProFilter>('toutes')
  const [sort, setSort] = useState<ProSort>('clics')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)

  const ofKind = useMemo(() => d.items.filter(p => kind === 'all' || p.kind === kind), [d.items, kind])
  const online = ofKind.filter(p => p.online)
  const buckets = useMemo(() => {
    const b = Object.fromEntries(ALL_BUCKETS.map(k => [k, 0])) as Record<ProBucket, number>
    for (const p of online) b[p.bucket]++
    return b
  }, [online])
  const firstPage = online.filter(p => p.main && p.main.place <= 10).length
  const list = useMemo(() => filterPros(d.items, { kind, filter, q, sort }), [d.items, kind, filter, q, sort])

  const kindLabel = kind === 'photographe' ? 'fiches photographes' : kind === 'menage' ? 'fiches ménage' : 'fiches'

  return (
    <>
      <ListStyles />
      <section style={v.card}>
        <ChipGroup
          label="Sorte de fiche"
          value={kind}
          onChange={k => { setKind(k); setLimit(PAGE) }}
          options={[
            { key: 'photographe', label: 'Photographes', count: d.counts.photographe },
            { key: 'menage', label: 'Équipes de ménage', count: d.counts.menage },
            { key: 'all', label: 'Toutes', count: d.items.length },
          ]}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 style={v.title}>Les {fmtInt(online.length)} {kindLabel} en ligne, selon leur recherche principale</h2>
              <p style={{ ...v.sub, marginTop: 3 }}>La recherche principale est celle qui amène le plus de clics à la fiche (à égalité, le plus d&apos;affichages).</p>
            </div>
            <BucketBar counts={buckets} keys={ALL_BUCKETS} height={16} />
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Figure label="En première page" value={fmtInt(firstPage)} sub={`sur ${fmtInt(online.length)}`} />
            <Figure label="Vues dans Google" value={fmtInt(online.reduce((n, p) => n + p.impressions, 0))} sub="affichages" />
            <Figure label="Clics" value={fmtInt(online.reduce((n, p) => n + p.clicks, 0))} sub="depuis Google" />
          </div>
        </div>
      </section>

      <section style={{ ...v.card, gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <SearchBox value={q} onChange={s => { setQ(s); setLimit(PAGE) }} placeholder="Chercher un nom, une ville, une recherche" />
          <SortSelect value={sort} onChange={setSort} options={[
            { key: 'clics', label: 'Clics' }, { key: 'affichages', label: 'Affichages' }, { key: 'place', label: 'Place' },
            { key: 'visiteurs', label: 'Visiteurs' }, { key: 'nom', label: 'Nom' },
          ]} />
        </div>
        <ChipGroup label="Filtre" value={filter} onChange={f => { setFilter(f); setLimit(PAGE) }} options={[
          { key: 'toutes', label: 'Toutes' }, { key: 'payees', label: 'Payées' }, { key: 'fondateur', label: 'Fondateur' },
          { key: 'jamais', label: 'Jamais montrées' }, { key: 'hors-ligne', label: 'Pas en ligne' },
        ]} />

        <div>
          <div className="vis-grid vis-head" style={{ ['--cols' as string]: COLS }}>
            <span style={v.colHead}>Fiche</span>
            <span style={v.colHead}>Recherche principale</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Clics</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Affichages</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Visiteurs</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Demandes</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Évolution</span>
            <span />
          </div>
          {list.length === 0 && <p style={v.empty}>Aucune fiche ne correspond.</p>}
          {list.slice(0, limit).map(p => (
            <ProRow key={`${p.kind}-${p.id}`} p={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} />
          ))}
        </div>
        <MoreButton shown={limit} total={list.length} onMore={() => setLimit(l => l + PAGE)} />
      </section>
    </>
  )
}

function ProRow({ p, open, onToggle }: { p: ProItem; open: boolean; onToggle: () => void }) {
  const space = p.kind === 'photographe' ? 'ma-fiche-photographe' : 'ma-fiche-menage'
  const publicUrl = p.slug ? `https://jasonmarinho.com/annuaires/${p.kind === 'photographe' ? 'photographes' : 'menage'}/${p.slug}` : null
  const Icon = p.kind === 'photographe' ? Camera : Broom
  return (
    <div>
      <button type="button" className="vis-row" aria-expanded={open} onClick={onToggle}>
        <span className="vis-grid" style={{ ['--cols' as string]: COLS }}>
          <span className="vis-main" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', color: p.kind === 'photographe' ? AMBER : BROWN }}>
              <Icon size={16} weight="fill" />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 2 }}>
                {p.ville && <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 2 }}>{p.ville}</span>}
                {p.founder && <span style={badge(AMBER)}>Fondateur</span>}
                {p.paid && <span style={badge(ACCENT)}>payée</span>}
                {!p.online && <span style={badge(BROWN)}>{p.statusLabel ?? 'pas en ligne'}</span>}
              </span>
            </span>
          </span>
          <MainQuery q={p.main} emptyText={p.bucket === 'masked' ? 'Recherches masquées' : 'Jamais montrée'} />
          <Num label="Clics">{fmtInt(p.clicks)}</Num>
          <Num label="Affichages">{fmtInt(p.impressions)}</Num>
          <Num label="Visiteurs">{fmtInt(p.visitors)}</Num>
          <Num label="Demandes">{p.demandes > 0 ? <span style={{ color: ACCENT, fontWeight: 700 }}>{fmtInt(p.demandes)}</span> : '0'}</Num>
          <Num label="Évolution"><PlaceDelta delta={p.main?.delta ?? null} isNew={p.main?.isNew} /></Num>
          <Caret />
        </span>
      </button>
      {open && (
        <QueriesDetail queries={p.queries} pagePlace={p.pagePlace} prevPagePlace={p.prevPagePlace} subject="la fiche">
          <Link href={`/dashboard/${space}?id=${p.id}`} style={v.btnPrimary}><IdentificationCard size={15} weight="bold" /> Fiche du pro</Link>
          <Link href={`/dashboard/${space}/statistiques?id=${p.id}`} style={v.btn}><PresentationChart size={15} weight="bold" /> Statistiques</Link>
          {publicUrl && p.online && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={v.btn}><ArrowSquareOut size={15} weight="bold" /> Voir la fiche</a>
          )}
        </QueriesDetail>
      )}
    </div>
  )
}
