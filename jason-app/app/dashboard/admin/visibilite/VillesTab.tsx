'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PaperPlaneTilt, ArrowSquareOut, MapPin } from '@phosphor-icons/react/dist/ssr'
import { fmtInt, matchesText, type CityItem } from '@/lib/visibility/admin-rules'
import type { VillesData } from '@/lib/visibility/admin-build'
import { v, Figure, PlacePill, PlaceDelta, ACCENT } from './ui'
import { ListStyles, Num, Caret, MainQuery, QueryTable, SearchBox, SortSelect, MoreButton } from './ListParts'

const COLS = 'minmax(0,1.1fr) minmax(0,1.8fr) 64px 90px 120px 100px 18px'
const PAGE = 50
type CitySort = 'clics' | 'affichages' | 'place' | 'pros' | 'nom'

export default function VillesTab({ d }: { d: VillesData }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<CitySort>('clics')
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => {
    const out = d.items.filter(c => matchesText(q, c.name, c.best?.query, ...c.themes.flatMap(t => t.queries.map(x => x.query))))
    const pros = (c: CityItem) => c.pros.photographes + c.pros.menage
    const cmp: Record<CitySort, (a: CityItem, b: CityItem) => number> = {
      clics: (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
      affichages: (a, b) => b.impressions - a.impressions,
      place: (a, b) => (a.best?.place ?? 999) - (b.best?.place ?? 999) || b.impressions - a.impressions,
      pros: (a, b) => pros(b) - pros(a) || b.impressions - a.impressions,
      nom: (a, b) => a.name.localeCompare(b.name, 'fr'),
    }
    return out.sort((a, b) => cmp[sort](a, b) || a.name.localeCompare(b.name, 'fr'))
  }, [d.items, q, sort])
  const withoutPros = d.items.filter(c => c.impressions > 0 && c.pros.photographes + c.pros.menage === 0).length

  return (
    <>
      <ListStyles />
      <section style={v.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={v.title}>Les {fmtInt(d.items.length)} villes où Google montre nos pages</h2>
            <p style={v.text}>
              Pages Ménage, Photographe et Devenir hôte, regroupées par ville. Les villes où Google nous montre déjà sont celles où recruter des pros : une fiche y sera vue plus vite.
              {withoutPros > 0 && <> <strong style={{ color: 'var(--text)' }}>{fmtInt(withoutPros)}</strong> n&apos;ont encore aucun pro inscrit.</>}
            </p>
            <Link href="/dashboard/admin/prospection" style={{ ...v.btnPrimary, alignSelf: 'flex-start' }}>
              <PaperPlaneTilt size={15} weight="bold" /> Ouvrir la prospection
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Figure label="Clics" value={fmtInt(d.clicks)} sub="depuis Google" />
            <Figure label="Affichages" value={fmtInt(d.impressions)} sub="dans les résultats" />
          </div>
        </div>
      </section>

      <section style={{ ...v.card, gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <SearchBox value={q} onChange={s => { setQ(s); setLimit(PAGE) }} placeholder="Chercher une ville ou une recherche" />
          <SortSelect value={sort} onChange={setSort} options={[
            { key: 'clics', label: 'Clics' }, { key: 'affichages', label: 'Affichages' }, { key: 'place', label: 'Meilleure place' },
            { key: 'pros', label: 'Pros inscrits' }, { key: 'nom', label: 'Nom' },
          ]} />
        </div>
        <div>
          <div className="vis-grid vis-head" style={{ ['--cols' as string]: COLS }}>
            <span style={v.colHead}>Ville</span>
            <span style={v.colHead}>Meilleure recherche</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Clics</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Affichages</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Pros inscrits</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Évolution</span>
            <span />
          </div>
          {list.length === 0 && <p style={v.empty}>Aucune ville ne correspond.</p>}
          {list.slice(0, limit).map(c => (
            <div key={c.slug}>
              <button type="button" className="vis-row" aria-expanded={open === c.slug} onClick={() => setOpen(open === c.slug ? null : c.slug)}>
                <span className="vis-grid" style={{ ['--cols' as string]: COLS }}>
                  <span className="vis-main" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', color: ACCENT }}>
                      <MapPin size={16} weight="fill" />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)' }}>{c.themes.map(t => t.label).join(' · ')}</span>
                    </span>
                  </span>
                  <MainQuery q={c.best} />
                  <Num label="Clics">{fmtInt(c.clicks)}</Num>
                  <Num label="Affichages">{fmtInt(c.impressions)}</Num>
                  <Num label="Pros inscrits">
                    {c.pros.photographes + c.pros.menage === 0
                      ? <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>aucun</span>
                      : <span title={`${c.pros.photographes} photographe(s), ${c.pros.menage} équipe(s) de ménage`}>
                          {fmtInt(c.pros.photographes + c.pros.menage)}
                          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-3)' }}> ({c.pros.photographes} ph. · {c.pros.menage} mén.)</span>
                        </span>}
                  </Num>
                  <Num label="Évolution"><PlaceDelta delta={c.delta} /></Num>
                  <Caret />
                </span>
              </button>
              {open === c.slug && (
                <div style={{ padding: '6px 10px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 14 }}>
                  {c.themes.map(t => (
                    <div key={t.path} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <PlacePill place={t.place} size="sm" />
                        <strong style={{ fontSize: 14, color: 'var(--text)' }}>{t.label}</strong>
                        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{fmtInt(t.clicks)} clic{t.clicks > 1 ? 's' : ''} · {fmtInt(t.impressions)} affichage{t.impressions > 1 ? 's' : ''}</span>
                        <a href={`https://jasonmarinho.com${t.path}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>
                          Voir la page <ArrowSquareOut size={13} weight="bold" />
                        </a>
                      </div>
                      {t.queries.length > 0
                        ? <QueryTable queries={t.queries} />
                        : <p style={v.sub}>Recherches trop rares pour que Google les détaille.</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <MoreButton shown={limit} total={list.length} onMore={() => setLimit(l => l + PAGE)} />
      </section>
    </>
  )
}
