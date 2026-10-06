'use client'

// Onglet « Pages pros par ville » (06/10/2026, Jason : « une partie sur les
// pages photographe + ville et équipe de ménage + ville ») : les 60 pages
// /photographe-lcd-<ville> et /menage-lcd-<ville>, avec leur place dans
// Google, nos visites, les pros présentés et les fiches ouvertes depuis la
// page. Données : lib/visibility/city-pros.ts.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Camera, Broom, ArrowSquareOut, PaperPlaneTilt, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { fmtInt, matchesText } from '@/lib/visibility/admin-rules'
import type { CityProPage, PagesProsData } from '@/lib/visibility/city-pros'
import type { CityMetier } from '@/lib/visibility/city-page'
import { AMBER, tint } from '../_ui/theme'
import { v, Figure, PlacePill, PlaceDelta, badge, ACCENT } from './ui'
import { ListStyles, Num, Caret, MainQuery, QueryTable, SearchBox, SortSelect, MoreButton, ChipGroup } from './ListParts'

const COLS = 'minmax(0,1.1fr) minmax(0,1.7fr) 60px 86px 76px 70px minmax(0,1fr) 80px 18px'
const PAGE = 30
type Sort = 'clics' | 'affichages' | 'place' | 'visiteurs' | 'nom'
type Filter = 'toutes' | 'vues' | 'recruter' | 'avecpro'

export default function PagesProsTab({ d }: { d: PagesProsData }) {
  const [metier, setMetier] = useState<CityMetier>('photographe')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('affichages')
  const [filter, setFilter] = useState<Filter>('toutes')
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const side = d[metier]
  const online = (c: CityProPage) => c.pros.some(p => p.online)

  const list = useMemo(() => {
    const keep = (c: CityProPage) =>
      filter === 'vues' ? c.impressions > 0
        : filter === 'recruter' ? c.impressions > 0 && !online(c)
          : filter === 'avecpro' ? online(c)
            : true
    const out = side.items.filter(c => keep(c) && matchesText(q, c.label, c.main?.query, ...c.queries.map(x => x.query), ...c.pros.map(p => p.name)))
    const cmp: Record<Sort, (a: CityProPage, b: CityProPage) => number> = {
      clics: (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
      affichages: (a, b) => b.impressions - a.impressions || b.clicks - a.clicks,
      place: (a, b) => (a.pagePlace ?? 999) - (b.pagePlace ?? 999) || b.impressions - a.impressions,
      visiteurs: (a, b) => b.visitors - a.visitors || b.impressions - a.impressions,
      nom: (a, b) => a.label.localeCompare(b.label, 'fr'),
    }
    return out.sort((a, b) => cmp[sort](a, b) || a.label.localeCompare(b.label, 'fr'))
  }, [side.items, q, sort, filter])

  const seen = side.items.filter(c => c.impressions > 0).length
  const word = metier === 'photographe' ? 'Photographe' : 'Ménage'

  return (
    <>
      <ListStyles />
      <section style={v.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
              {(['photographe', 'menage'] as const).map(m => (
                <button key={m} type="button" onClick={() => { setMetier(m); setOpen(null); setLimit(PAGE) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${metier === m ? ACCENT : 'var(--border)'}`, background: metier === m ? 'var(--accent-bg)' : 'var(--surface)', color: metier === m ? ACCENT : 'var(--text-2)' }}>
                  {m === 'photographe' ? <Camera size={15} weight="bold" /> : <Broom size={15} weight="bold" />}
                  {m === 'photographe' ? 'Photographe + ville' : 'Équipe de ménage + ville'}
                </button>
              ))}
            </div>
            <h2 style={v.title}>Les 60 pages « {word} à &lt;ville&gt; »</h2>
            <p style={v.text}>
              Chaque page présente les {metier === 'photographe' ? 'photographes' : 'équipes de ménage'} inscrits de la ville. {fmtInt(seen)} sont déjà vues dans Google ;{' '}
              <strong style={{ color: 'var(--text)' }}>{fmtInt(side.toRecruit)}</strong> n&apos;ont encore aucun pro en ligne : ce sont les villes où recruter en priorité.
            </p>
            <Link href="/dashboard/admin/prospection" style={{ ...v.btnPrimary, alignSelf: 'flex-start' }}>
              <PaperPlaneTilt size={15} weight="bold" /> Ouvrir la prospection
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            <Figure label="Clics" value={fmtInt(side.clicks)} sub="depuis Google" />
            <Figure label="Affichages" value={fmtInt(side.impressions)} sub="dans les résultats" />
            <Figure label="Visiteurs" value={fmtInt(side.visitors)} sub="sur nos mesures" />
            <Figure label="En 1re page" value={fmtInt(side.firstPage)} sub="recherche principale" />
            <Figure label="Fiches ouvertes" value={fmtInt(side.toFiches)} sub="depuis ces pages" />
          </div>
        </div>
      </section>

      <section style={{ ...v.card, gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <SearchBox value={q} onChange={s => { setQ(s); setLimit(PAGE) }} placeholder="Chercher une ville, une recherche ou un pro" />
          <ChipGroup label="Afficher" value={filter} onChange={f => { setFilter(f); setLimit(PAGE) }} options={[
            { key: 'toutes', label: 'Toutes', count: side.items.length },
            { key: 'vues', label: 'Vues dans Google', count: seen },
            { key: 'recruter', label: 'À recruter', count: side.toRecruit },
            { key: 'avecpro', label: 'Avec un pro', count: side.withPro },
          ]} />
          <SortSelect value={sort} onChange={setSort} options={[
            { key: 'affichages', label: 'Affichages' }, { key: 'clics', label: 'Clics' }, { key: 'place', label: 'Meilleure place' },
            { key: 'visiteurs', label: 'Visiteurs' }, { key: 'nom', label: 'Nom' },
          ]} />
        </div>
        <div>
          <div className="vis-grid vis-head" style={{ ['--cols' as string]: COLS }}>
            <span style={v.colHead}>Ville</span>
            <span style={v.colHead}>Recherche principale</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Clics</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Affichages</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Visiteurs</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Vers fiches</span>
            <span style={v.colHead}>Pros présentés</span>
            <span style={{ ...v.colHead, textAlign: 'right' }}>Évolution</span>
            <span />
          </div>
          {list.length === 0 && <p style={v.empty}>Aucune page ne correspond.</p>}
          {list.slice(0, limit).map(c => {
            const live = c.pros.filter(p => p.online)
            return (
              <div key={c.slug}>
                <button type="button" className="vis-row" aria-expanded={open === c.slug} onClick={() => setOpen(open === c.slug ? null : c.slug)}>
                  <span className="vis-grid" style={{ ['--cols' as string]: COLS }}>
                    <span className="vis-main" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <PlacePill place={c.pagePlace} size="sm" />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.label}</span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)' }}>{c.path}</span>
                      </span>
                    </span>
                    <MainQuery q={c.main} emptyText={c.impressions > 0 ? 'Recherches trop rares' : 'Pas encore vue dans Google'} />
                    <Num label="Clics">{fmtInt(c.clicks)}</Num>
                    <Num label="Affichages">{fmtInt(c.impressions)}</Num>
                    <Num label="Visiteurs">{fmtInt(c.visitors)}</Num>
                    <Num label="Vers fiches">{fmtInt(c.toFiches)}</Num>
                    <span style={{ minWidth: 0, fontSize: 12.5 }}>
                      {live.length > 0
                        ? <span style={badge(ACCENT)}><CheckCircle size={12} weight="fill" /> {live.length === 1 ? live[0].name : `${live.length} pros`}</span>
                        : c.impressions > 0
                          ? <span style={{ ...badge(AMBER), background: tint(AMBER, 14) }}>À recruter</span>
                          : <span style={{ color: 'var(--text-3)' }}>aucun</span>}
                    </span>
                    <Num label="Évolution"><PlaceDelta delta={c.delta} /></Num>
                    <Caret />
                  </span>
                </button>
                {open === c.slug && (
                  <div style={{ padding: '8px 10px 18px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-2)' }}>
                      <span>Période d&apos;avant : {fmtInt(c.prevVisitors)} visiteur{c.prevVisitors > 1 ? 's' : ''}</span>
                      {c.pros.length > 0 && <span>· Pros de la ville : {c.pros.map(p => `${p.name}${p.online ? '' : ' (pas en ligne)'}`).join(', ')}</span>}
                      <a href={`https://jasonmarinho.com${c.path}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>
                        Voir la page <ArrowSquareOut size={13} weight="bold" />
                      </a>
                    </div>
                    {c.queries.length > 0
                      ? <QueryTable queries={c.queries} />
                      : <p style={v.sub}>{c.impressions > 0 ? 'Recherches trop rares pour que Google les détaille.' : 'Google ne montre pas encore cette page.'}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <MoreButton shown={limit} total={list.length} onMore={() => setLimit(l => l + PAGE)} />
      </section>
    </>
  )
}
