'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PaperPlaneTilt, ArrowSquareOut, MapPin, Broom, Camera, Wrench, House } from '@phosphor-icons/react/dist/ssr'
import InlineStyle from '@/components/ui/InlineStyle'
import { fmtInt, matchesText, type CityItem, type CityThemeItem } from '@/lib/visibility/admin-rules'
import type { VillesData } from '@/lib/visibility/admin-build'
import { v, Figure, PlacePill, PlaceDelta, ACCENT } from './ui'
import { ListStyles, Num, Caret, MainQuery, QueryTable, SearchBox, SortSelect, MoreButton } from './ListParts'

const COLS = 'minmax(0,1.1fr) minmax(0,1.8fr) 64px 90px 140px 100px 18px'
const PAGE = 50
type CitySort = 'clics' | 'affichages' | 'place' | 'pros' | 'nom'

export default function VillesTab({ d }: { d: VillesData }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<CitySort>('clics')
  const [open, setOpen] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => {
    const out = d.items.filter(c => matchesText(q, c.name, c.best?.query, ...c.themes.flatMap(t => t.queries.map(x => x.query))))
    const pros = (c: CityItem) => c.pros.photographes + c.pros.menage + (c.pros.depannage ?? 0)
    const cmp: Record<CitySort, (a: CityItem, b: CityItem) => number> = {
      clics: (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
      affichages: (a, b) => b.impressions - a.impressions,
      place: (a, b) => (a.best?.place ?? 999) - (b.best?.place ?? 999) || b.impressions - a.impressions,
      pros: (a, b) => pros(b) - pros(a) || b.impressions - a.impressions,
      nom: (a, b) => a.name.localeCompare(b.name, 'fr'),
    }
    return out.sort((a, b) => cmp[sort](a, b) || a.name.localeCompare(b.name, 'fr'))
  }, [d.items, q, sort])
  const withoutPros = d.items.filter(c => c.impressions > 0 && c.pros.photographes + c.pros.menage + (c.pros.depannage ?? 0) === 0).length

  return (
    <>
      <ListStyles />
      <InlineStyle css={CITY_CSS} />
      <section style={v.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 40px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={v.title}>Les {fmtInt(d.items.length)} villes où Google montre nos pages</h2>
            <p style={v.text}>
              Pages Ménage, Photographe, Dépannage et Devenir hôte, regroupées par ville. Les villes où Google nous montre déjà sont celles où recruter des pros : une fiche y sera vue plus vite.
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
                    {c.pros.photographes + c.pros.menage + (c.pros.depannage ?? 0) === 0
                      ? <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>aucun</span>
                      : <span title={`${c.pros.photographes} photographe(s), ${c.pros.menage} équipe(s) de ménage, ${c.pros.depannage ?? 0} pro(s) du dépannage`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.25 }}>
                          {fmtInt(c.pros.photographes + c.pros.menage + (c.pros.depannage ?? 0))}
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{c.pros.photographes} ph. · {c.pros.menage} mén. · {c.pros.depannage ?? 0} dép.</span>
                        </span>}
                  </Num>
                  <Num label="Évolution"><PlaceDelta delta={c.delta} /></Num>
                  <Caret />
                </span>
              </button>
              {open === c.slug && (
                <div className="vis-city-grid">
                  {c.themes.map(t => <ThemeCard key={t.path} t={t} />)}
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

// Dépliage d'une ville (07/11/2026, Jason : « mets le dépannage et fais 2 sur
// 2 ») : les 4 pages de la ville en cartes, 2 par ligne (1 au téléphone),
// même celles que Google n'a pas encore montrées.
const CITY_CSS = `
.vis-city-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:12px 10px 18px;background:var(--surface-2);border-bottom:1px solid var(--border)}
.vis-city-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:10px 8px;padding:10px 12px;border-radius:10px;background:var(--surface-2)}
@media (max-width:760px){.vis-city-grid{grid-template-columns:minmax(0,1fr);padding:10px 0 16px}}
`

const THEME_ICON = { menage: Broom, photographe: Camera, depannage: Wrench, hote: House } as const

function ThemeCard({ t }: { t: CityThemeItem }) {
  const Icon = THEME_ICON[t.theme]
  const seen = t.impressions > 0
  const stats: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: 'Clics', value: fmtInt(t.clicks) },
    { label: 'Affichages', value: fmtInt(t.impressions) },
    { label: 'Visiteurs', value: fmtInt(t.visitors) },
  ]
  if (t.pros !== null) stats.push({ label: 'Pros inscrits', value: fmtInt(t.pros) })
  if (t.demandes !== null) stats.push({ label: 'Demandes', value: fmtInt(t.demandes), strong: t.demandes > 0 })
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', color: ACCENT }}>
          <Icon size={15} weight="fill" />
        </span>
        <strong style={{ fontSize: 14.5, color: 'var(--text)' }}>{t.label}</strong>
        <PlacePill place={t.place} size="sm" />
        <a href={`https://jasonmarinho.com${t.path}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>
          Voir la page <ArrowSquareOut size={13} weight="bold" />
        </a>
      </div>
      <div className="vis-city-stats">
        {stats.map(x => (
          <div key={x.label} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.label}</span>
            <strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: x.strong ? ACCENT : 'var(--text)' }}>{x.value}</strong>
          </div>
        ))}
      </div>
      {t.queries.length > 0
        ? <QueryTable queries={t.queries} />
        : <p style={v.sub}>{seen ? 'Recherches trop rares pour que Google les détaille.' : 'Pas encore montrée par Google sur la période.'}</p>}
    </div>
  )
}
