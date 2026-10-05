import Link from 'next/link'
import {
  GoogleLogo, Users, Trophy, Footprints, Sparkle, Camera, MagnifyingGlass, WarningCircle, ArrowRight, Info,
  ListMagnifyingGlass, MapPin, Article, ChartLineUp, Binoculars,
} from '@phosphor-icons/react/dist/ssr'
import AdminHero, { adminAsideCard } from '../_ui/AdminHero'
import { AMBER, tint } from '../_ui/theme'
import { PERIODS } from '@/lib/visibility/rules'
import { VIS_TABS, fmtInt, shortDate, type VisTab, type QueryItem } from '@/lib/visibility/admin-rules'
import type { VisibilityData, EnsembleData } from '@/lib/visibility/admin-build'
import { v, PlacePill, PctDelta, BucketBar, PLACE_KEYS, ACCENT } from './ui'
import TrendChart from './TrendChart'
import FichesTab from './FichesTab'
import RecherchesTab from './RecherchesTab'
import VillesTab from './VillesTab'
import PagesTab from './PagesTab'
import VisiteursTab from './VisiteursTab'

// Page « Visibilité » de l'admin (05/10/2026, inspirée de l'outil Driing de
// Jason) : où l'on sort dans Google, recherche par recherche, pour le site,
// les fiches pros et les pages villes, et d'où viennent les visiteurs.

const BASE = '/dashboard/admin/visibilite'
const SHOWN_PERIODS = PERIODS.filter(p => p.key !== '12m')
const plural = (n: number, one: string, many = `${one}s`) => `${fmtInt(n)} ${n > 1 ? many : one}`

const TAB_ICON: Record<VisTab, React.ReactNode> = {
  ensemble: <ChartLineUp size={15} weight="bold" />,
  fiches: <Camera size={15} weight="bold" />,
  recherches: <ListMagnifyingGlass size={15} weight="bold" />,
  villes: <MapPin size={15} weight="bold" />,
  pages: <Article size={15} weight="bold" />,
  visiteurs: <Users size={15} weight="bold" />,
}

export default function VisibiliteView({ data, tab }: { data: VisibilityData; tab: VisTab }) {
  const { hero, gscPeriod, visitPeriod, periodKey } = data
  const days = SHOWN_PERIODS.find(p => p.key === periodKey)?.days ?? gscPeriod.days
  const href = (o: { periode?: string; onglet?: VisTab }) =>
    `${BASE}?periode=${o.periode ?? periodKey}&onglet=${o.onglet ?? tab}`

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminHero
        section="Visibilité"
        title="Où l'on nous trouve,"
        em="recherche par recherche"
        desc="Les recherches où Google montre nos pages et nos fiches pros, à quelle place, et d'où viennent les visiteurs du site (Google, IA, réseaux)."
        aside={
          <div style={adminAsideCard}>
            <span style={asideLabel}><GoogleLogo size={15} weight="bold" color={ACCENT} /> Clics depuis Google</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <strong style={asideBig}>{hero.clicks === null ? '–' : fmtInt(hero.clicks)}</strong>
              {hero.clicks !== null && <PctDelta pct={hero.clicksPct} />}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              {hero.impressions !== null ? `${plural(hero.impressions, 'affichage')} · ` : ''}du {shortDate(gscPeriod.start)} au {shortDate(gscPeriod.end)}
            </span>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <span style={asideLabel}><Users size={15} weight="bold" color={ACCENT} /> Visiteurs du site</span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <strong style={asideBig}>{hero.visitors === null ? '–' : fmtInt(hero.visitors)}</strong>
              {hero.visitors !== null && <PctDelta pct={hero.visitorsPct} />}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>du {shortDate(visitPeriod.start)} au {shortDate(visitPeriod.end)}, comparé à la période d&apos;avant</span>
          </div>
        }
      >
        <div role="group" aria-label="Période" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SHOWN_PERIODS.map(p => (
            <Link key={p.key} href={href({ periode: p.key })} scroll={false} style={p.key === periodKey ? v.chipOn : v.chip} aria-current={p.key === periodKey ? 'true' : undefined}>
              {p.label}
            </Link>
          ))}
        </div>
      </AdminHero>

      {/* Onglets */}
      <nav aria-label="Sections" style={tabsWrap}>
        {VIS_TABS.map(t => {
          const on = t.key === tab
          const n = data.counts[t.key]
          return (
            <Link key={t.key} href={href({ onglet: t.key })} scroll={false} style={on ? tabOn : tabOff} aria-current={on ? 'page' : undefined}>
              {TAB_ICON[t.key]} {t.label}
              {n !== undefined && <span style={{ ...count, ...(on ? countOn : {}) }}>{fmtInt(n)}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sources en panne */}
      {!data.gsc.ok && tab !== 'visiteurs' && (
        <Banner tone="warn" title={data.gsc.auth ? 'La connexion à Google Search Console est à refaire' : 'Google Search Console ne répond pas'}>
          {data.gsc.auth
            ? <>Les chiffres de Google sont indisponibles tant que la connexion n&apos;est pas refaite. <Link href="/dashboard/admin/indexation" style={bannerLink}>Reconnecter</Link></>
            : <>{data.gsc.error} Les visites du site restent affichées.</>}
        </Banner>
      )}
      {!data.visits.ok && (tab === 'visiteurs' || tab === 'ensemble') && (
        <Banner tone="warn" title="Nos mesures de visites sont indisponibles">{data.visits.error}</Banner>
      )}
      {!data.pros.ok && tab === 'fiches' && (
        <Banner tone="warn" title="Les fiches pros n'ont pas pu être lues">{data.pros.error}</Banner>
      )}

      {tab === 'ensemble' && data.ensemble && <Ensemble d={data.ensemble} days={days} moreHref={href({ onglet: 'recherches' })} gscOk={data.gsc.ok} visitsOk={data.visits.ok} />}
      {tab === 'fiches' && data.fiches && <FichesTab d={data.fiches} />}
      {tab === 'recherches' && data.recherches && <RecherchesTab d={data.recherches} />}
      {tab === 'villes' && data.villes && <VillesTab d={data.villes} />}
      {tab === 'pages' && data.pages && <PagesTab d={data.pages} />}
      {tab === 'visiteurs' && data.visiteurs && <VisiteursTab d={data.visiteurs} />}

      <p style={{ display: 'flex', gap: 6, fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.55 }}>
        <Info size={13} weight="bold" style={{ flexShrink: 0, marginTop: 3 }} />
        Google publie ses chiffres avec 2 jours de retard : sa période s&apos;arrête au {shortDate(gscPeriod.end).replace(/\.$/, '')}. Une place est la place moyenne sur la période, pondérée par les affichages. Les visiteurs viennent de nos propres mesures (une visite = une session de navigation, sans cookie).
      </p>
    </div>
  )
}

function Banner({ tone, title, children }: { tone: 'warn'; title: string; children: React.ReactNode }) {
  const color = tone === 'warn' ? AMBER : ACCENT
  return (
    <div role="status" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, background: tint(color, 9), border: `1px solid ${tint(color, 30)}` }}>
      <WarningCircle size={20} weight="fill" color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <strong style={{ fontSize: 14, color: 'var(--text)' }}>{title}</strong>
        <span style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, overflowWrap: 'anywhere' }}>{children}</span>
      </div>
    </div>
  )
}

// ── Vue d'ensemble ───────────────────────────────────────────────────────

function Ensemble({ d, days, gscOk, visitsOk, moreHref }: { d: EnsembleData; days: number; gscOk: boolean; visitsOk: boolean; moreHref: string }) {
  const totalBuckets = PLACE_KEYS.reduce((n, k) => n + d.buckets[k], 0)
  const firstPageAll = d.buckets['1'] + d.buckets['2-3'] + d.buckets['4-10']
  const aiTotal = d.ai.reduce((n, a) => n + a.count, 0)
  return (
    <>
      <div style={statGrid}>
        <StatCard icon={<GoogleLogo size={18} weight="bold" />} label="Clics depuis Google" value={gscOk ? fmtInt(d.clicks) : '–'}
          delta={gscOk ? <PctDelta pct={d.clicksPct} suffix="vs période d'avant" /> : null}
          sub={gscOk ? `${plural(d.impressions, 'affichage')} dans les résultats` : 'Google indisponible'} />
        <StatCard icon={<Trophy size={18} weight="bold" />} label="Nos pages en première page" value={gscOk ? fmtInt(d.firstPage) : '–'}
          sub={gscOk ? `recherches dans les 10 premiers, sur ${plural(d.queriesTotal - d.brandQueries, 'recherche')} (hors notre nom)` : 'Google indisponible'} />
        <StatCard icon={<Camera size={18} weight="bold" />} label="Fiches pros en première page" value={gscOk ? fmtInt(d.prosFirstPage) : '–'}
          sub={`sur ${plural(d.prosOnline, 'fiche')} en ligne, selon leur recherche principale`} />
        <StatCard icon={<Footprints size={18} weight="bold" />} label="Visiteurs du site" value={d.visitors === null ? '–' : fmtInt(d.visitors)}
          delta={d.visitors !== null ? <PctDelta pct={d.visitorsPct} suffix="vs période d'avant" /> : null}
          sub={visitsOk ? `dont ${fmtInt(d.fromGoogle)} venus de Google, ${fmtInt(d.fromAi)} d'une IA` : 'Mesures indisponibles'} />
      </div>

      {gscOk && (
        <section style={v.card}>
          <header style={v.head}>
            <span style={v.icon}><GoogleLogo size={18} weight="bold" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={v.title}>Google, sur {days} jours</h2>
              <p style={v.sub}>Clics jour par jour, et la place de nos pages sur chaque recherche</p>
            </div>
          </header>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 36px', alignItems: 'stretch' }}>
            <div style={{ flex: '2 1 420px', minWidth: 0 }}>
              <TrendChart points={d.daily.map(p => ({ key: p.date, label: shortDate(p.date), value: p.clicks }))} unit="clic" height={190} />
            </div>
            <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 18px', borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div>
                <span style={v.colHead}>Nos {fmtInt(totalBuckets)} recherches, par place</span>
                <p style={{ ...v.sub, marginTop: 4 }}>Chaque recherche compte une fois, à la place moyenne de notre meilleure page</p>
              </div>
              <BucketBar counts={d.buckets} keys={PLACE_KEYS} height={16} />
              <p style={{ ...v.text, fontSize: 13.5 }}>
                <strong style={{ color: 'var(--text)' }}>{fmtInt(firstPageAll)}</strong> en première page, dont {fmtInt(d.brandQueries)} sur notre nom.
              </p>
            </div>
          </div>
        </section>
      )}

      {gscOk && (
        <div style={v.grid2}>
          <QueryList
            icon={<Trophy size={18} weight="bold" />}
            title="Nos pages en tête"
            sub="Recherches où nous sortons dans les 3 premiers, hors recherches sur notre nom"
            list={d.top}
            empty="Aucune recherche dans les 3 premiers pour l'instant."
            moreHref={moreHref}
          />
          <QueryList
            icon={<MagnifyingGlass size={18} weight="bold" />}
            title="Nos pages à un pas de la première page"
            sub="Entre la 11e et la 20e place : une page mieux faite ou un article sur le sujet peut suffire à passer devant."
            list={d.nearly}
            empty="Aucune recherche entre la 11e et la 20e place."
            moreHref={moreHref}
            tone="amber"
          />
        </div>
      )}

      {visitsOk && (
        <section style={v.card}>
          <header style={v.head}>
            <span style={v.icon}><Sparkle size={18} weight="fill" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={v.title}>Les visiteurs envoyés par une IA</h2>
              <p style={v.sub}>{aiTotal > 0 ? `${plural(aiTotal, 'visite')} sur la période` : 'Aucune visite venue d\'une IA sur la période'}</p>
            </div>
          </header>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10 }}>
            {d.ai.map(a => (
              <div key={a.name} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 16px', borderRadius: 13, background: a.count ? tint(ACCENT, 7) : 'var(--surface-2)', border: `1px solid ${a.count ? tint(ACCENT, 22) : 'var(--border)'}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>{a.name}</span>
                <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 26, color: a.count ? 'var(--text)' : 'var(--text-3)', lineHeight: 1.15 }}>{fmtInt(a.count)}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtInt(a.prev)} sur la période d&apos;avant</span>
              </div>
            ))}
          </div>
          <p style={v.sub}>
            À comparer : {plural(d.googleVisits, 'visite')} venue{d.googleVisits > 1 ? 's' : ''} de Google. Beaucoup de réponses d&apos;IA ne donnent pas de lien : ce chiffre est un plancher.
          </p>
        </section>
      )}

      {!gscOk && !visitsOk && (
        <section style={{ ...v.card, alignItems: 'center', textAlign: 'center' }}>
          <Binoculars size={28} color="var(--text-3)" />
          <p style={v.text}>Aucune source n&apos;a répondu. Réessaie dans quelques minutes.</p>
        </section>
      )}
    </>
  )
}

function StatCard({ icon, label, value, delta, sub }: { icon: React.ReactNode; label: string; value: string; delta?: React.ReactNode; sub: string }) {
  return (
    <div style={{ ...v.card, gap: 10 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ ...v.icon, width: 32, height: 32, borderRadius: 10 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', lineHeight: 1.3 }}>{label}</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 34, color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
        {delta}
      </span>
      <span style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>{sub}</span>
    </div>
  )
}

function QueryList({ icon, title, sub, list, empty, tone, moreHref }: { icon: React.ReactNode; title: string; sub: string; list: QueryItem[]; empty: string; tone?: 'amber'; moreHref: string }) {
  return (
    <section style={v.card}>
      <header style={{ ...v.head, alignItems: 'flex-start' }}>
        <span style={tone === 'amber' ? { ...v.icon, background: tint(AMBER, 13), color: AMBER } : v.icon}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={v.title}>{title}</h2>
          <p style={{ ...v.sub, marginTop: 2 }}>{sub}</p>
        </div>
      </header>
      {list.length === 0 ? <p style={v.empty}>{empty}</p> : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }}>
          {list.map(q => (
            <li key={q.query} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px', borderBottom: '1px solid var(--border)' }}>
              <PlacePill place={q.place} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' }}>{q.query}</span>
                {q.mainLabel && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', overflowWrap: 'anywhere' }}>{q.mainLabel}</span>}
              </span>
              <span style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(q.impressions)}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>affichage{q.impressions > 1 ? 's' : ''}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <Link href={moreHref} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>
        Toutes les recherches <ArrowRight size={13} weight="bold" />
      </Link>
    </section>
  )
}

const asideLabel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' }
const asideBig: React.CSSProperties = { fontFamily: 'var(--font-fraunces), serif', fontWeight: 400, fontSize: 30, color: 'var(--text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }
const statGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 16 }
const tabsWrap: React.CSSProperties = { display: 'flex', gap: 4, overflowX: 'auto', borderBottom: '1px solid var(--border)', margin: '-4px 0 0', scrollbarWidth: 'thin' }
const tabBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 14px', fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', marginBottom: -1 }
const tabOff: React.CSSProperties = { ...tabBase, color: 'var(--text-2)', borderBottom: '2px solid transparent' }
const tabOn: React.CSSProperties = { ...tabBase, color: ACCENT, fontWeight: 700, borderBottom: `2px solid ${ACCENT}` }
const count: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }
const countOn: React.CSSProperties = { background: tint(ACCENT, 12), border: `1px solid ${tint(ACCENT, 26)}`, color: ACCENT }
const bannerLink: React.CSSProperties = { color: ACCENT, fontWeight: 700 }
