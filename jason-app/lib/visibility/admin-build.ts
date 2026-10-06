// Page « Visibilité » de l'admin (05/10/2026) : assemblage des données à
// partir de ce qu'ont renvoyé Google Search Console, nos visites et les
// fiches pros (fonction pure : le chargement est dans admin-load.ts). Une
// source en panne n'empêche pas d'afficher les autres. Seules les données de
// l'onglet ouvert sont préparées pour le navigateur.
import type { GscResult } from '@/lib/google/search-analytics'
import type { AffilaeOverview } from '@/lib/affiliation/affilae'
import type { PartnerStackOverview } from '@/lib/affiliation/partnerstack'
import { buildPartners, buildPartnerSeo, type ClickRow, type PartnersData } from './partners'
import { buildCityPros, type CityPageTruth, type PagesProsData } from './city-pros'
import { isPaidPro } from '@/lib/admin/revenue'
import {
  pctChange, aggregateQueries, aggregatePages, bucketCounts, topRanked, nearlyFirstPage,
  isBrandQuery, isFirstPage, placeOf, pathOf, pageKind, pageLabel, cityOf, summarizeVisits, granularityFor, bucketKeys,
  AI_NAMES,
  type PeriodKey, type Period, type PageStat, type PlaceBucket, type VisitRow, type VisitSummary, type AiName, type PageKind,
  type QueryPageRow,
} from './rules'
import {
  liteOf, mainPageByQuery, queryItems, fillDays, sessionsByPath, topVisitedPages, proBucketOf, groupCities,
  type VisTab, type QueryItem, type ProItem, type PageItem, type CityItem, type ProBucket,
} from './admin-rules'

export type SourceState = { ok: true } | { ok: false; error: string; auth?: boolean }

export interface VisHero {
  clicks: number | null
  clicksPct: number | null
  impressions: number | null
  visitors: number | null
  visitorsPct: number | null
}

export interface EnsembleData {
  clicks: number; prevClicks: number; clicksPct: number | null; impressions: number
  firstPage: number; queriesTotal: number; brandQueries: number
  prosFirstPage: number; prosOnline: number
  visitors: number | null; visitorsPct: number | null; fromGoogle: number; fromAi: number
  daily: Array<{ date: string; clicks: number; impressions: number }>
  buckets: Record<PlaceBucket, number>
  top: QueryItem[]
  nearly: QueryItem[]
  ai: Array<{ name: AiName; count: number; prev: number }>
  googleVisits: number
}

export interface FichesData {
  items: ProItem[]
  online: number
  buckets: Record<ProBucket, number>
  firstPage: number
  impressions: number
  clicks: number
  counts: { photographe: number; menage: number }
}

export interface RecherchesData {
  items: QueryItem[]
  total: number
  buckets: Record<PlaceBucket, number>
  firstPage: number
  nearly: number
  brand: number
}

export interface VillesData { items: CityItem[]; clicks: number; impressions: number }

export interface PagesData { items: PageItem[]; kinds: Array<{ kind: PageKind; count: number }> }

export interface VisiteursData {
  summary: Omit<VisitSummary, 'series'>
  series: Array<{ key: string; visitors: number; views: number; prevVisitors: number | null }>
  granularity: 'day' | 'week' | 'month'
  prevVisitors: number
  prevViews: number
  topPages: Array<{ path: string; label: string; views: number; visitors: number }>
  mobilePct: number | null
}

export interface VisibilityData {
  periodKey: PeriodKey
  gscPeriod: Period
  visitPeriod: Period
  gsc: SourceState
  visits: SourceState
  pros: SourceState
  hero: VisHero
  counts: Partial<Record<VisTab, number>>
  ensemble?: EnsembleData
  fiches?: FichesData
  pagespros?: PagesProsData
  recherches?: RecherchesData
  villes?: VillesData
  pages?: PagesData
  visiteurs?: VisiteursData
  partenaires?: PartnersData
  affClicks: SourceState
}

const QUERIES_SENT = 1000
const QUERIES_PER_PAGE = 30
const PAGES_SENT = 600

export interface ProRow {
  id: string; slug: string | null; full_name: string | null; pseudo: string | null; ville: string | null; zone_couverte?: string | null
  status: string | null; is_public: boolean | null; tier: string | null; stripe_subscription_status: string | null
}

const STATUS_LABEL: Record<string, string> = {
  pending_validation: 'En validation',
  approved_pending_payment: 'Paiement attendu',
  pending_payment: 'Paiement attendu',
  rejected: 'Refusée',
  cancelled: 'Annulée',
  hidden: 'Masquée',
}

interface PageTruth { clicks: number; impressions: number; position: number; prevPosition: number | null; stat: PageStat | null }

type GscTotalsLite = { clicks: number; impressions: number }
type PageMetrics = Map<string, { clicks: number; impressions: number; position: number }>

export interface VisibilityInput {
  periodKey: PeriodKey
  tab: VisTab
  gscPeriod: Period
  visitPeriod: Period
  qp: GscResult<{ cur: QueryPageRow[]; prev: QueryPageRow[] }>
  daily: GscResult<{ days: Array<{ date: string; clicks: number; impressions: number }>; total: GscTotalsLite; prevTotal: GscTotalsLite }>
  truth: GscResult<{ cur: PageMetrics; prev: PageMetrics }>
  visitsRes: { ok: true; rows: VisitRow[] } | { ok: false; error: string }
  prevVisitsRes: { ok: true; rows: VisitRow[] } | { ok: false; rows: VisitRow[] }
  prosRes: { ok: true; photographers: ProRow[]; cleaners: ProRow[] } | { ok: false; error: string }
  demandes: Map<string, number>
  /** Clics vers les liens affiliés du site (affiliate_clicks), période et période d'avant */
  affClicksRes: { ok: true; cur: ClickRow[]; prev: ClickRow[] } | { ok: false; error: string }
  /** Ventes Affilae (chargées seulement pour l'onglet Partenaires) */
  affilae: AffilaeOverview | null
  /** Ventes PartnerStack (Brevo), même règle */
  partnerstack?: PartnerStackOverview | null
}

export function buildVisibility(input: VisibilityInput): VisibilityData {
  const { periodKey, tab, gscPeriod, visitPeriod, qp, daily, truth, visitsRes, prevVisitsRes, prosRes, demandes, affClicksRes, affilae, partnerstack } = input

  // ── État des sources ──
  const gscFail = [qp, daily, truth].find(r => !r.ok)
  const gsc: SourceState = gscFail && !gscFail.ok ? { ok: false, error: gscFail.error, auth: gscFail.auth } : { ok: true }
  const visits: SourceState = visitsRes.ok ? { ok: true } : { ok: false, error: visitsRes.error }
  const pros: SourceState = prosRes.ok ? { ok: true } : { ok: false, error: prosRes.error }

  // ── Google ──
  const qpCur = qp.ok ? qp.data.cur : []
  const qpPrev = qp.ok ? qp.data.prev : []
  const queryStats = qp.ok ? aggregateQueries(qpCur, qpPrev) : []
  const pageStats = qp.ok ? aggregatePages(qpCur, qpPrev) : []
  const mainPages = mainPageByQuery(qpCur)
  const allQueryItems = queryItems(queryStats, mainPages)
  const qItemByQuery = new Map(allQueryItems.map(q => [q.query, q]))

  // Vrais totaux par page (recherches masquées comprises) + recherches visibles
  const pages = new Map<string, PageTruth>()
  for (const st of pageStats) pages.set(st.path, { clicks: st.clicks, impressions: st.impressions, position: st.position, prevPosition: st.prevPosition, stat: st })
  if (truth.ok) {
    const prevByPath = new Map([...truth.data.prev.entries()].map(([url, v]) => [pathOf(url), v]))
    for (const [url, v] of truth.data.cur) {
      const path = pathOf(url)
      const prev = prevByPath.get(path)
      const existing = pages.get(path)
      pages.set(path, { clicks: v.clicks, impressions: v.impressions, position: v.position, prevPosition: prev ? prev.position : existing?.prevPosition ?? null, stat: existing?.stat ?? null })
    }
  }
  const pagePlaces = (p: PageTruth | undefined) => ({
    pagePlace: p && p.impressions > 0 ? placeOf(p.position) : null,
    prevPagePlace: p && p.prevPosition !== null ? placeOf(p.prevPosition) : null,
  })
  const pageQueries = (p: PageTruth | undefined) => (p?.stat?.queries ?? []).slice(0, QUERIES_PER_PAGE).map(liteOf)

  // ── Visites ──
  const curRows = visitsRes.ok ? visitsRes.rows : []
  const prevRows = prevVisitsRes.ok ? prevVisitsRes.rows : []
  const granularity = granularityFor(visitPeriod.days)
  const summary = summarizeVisits(curRows, { start: visitPeriod.start, end: visitPeriod.end, granularity })
  const prevSummary = summarizeVisits(prevRows, { start: visitPeriod.prevStart, end: visitPeriod.prevEnd, granularity })
  const visitorsByPath = sessionsByPath(curRows)
  const sourceCount = (s: VisitSummary, k: string) => s.sources.find(x => x.key === k)?.count ?? 0

  // ── Fiches pros ──
  const proItems: ProItem[] = []
  if (prosRes.ok) {
    const add = (r: ProRow, kind: 'photographe' | 'menage') => {
      const path = r.slug ? `/annuaires/${kind === 'photographe' ? 'photographes' : 'menage'}/${r.slug}` : null
      const p = path ? pages.get(path) : undefined
      const queries = pageQueries(p)
      const main = queries[0] ?? null
      const impressions = p?.impressions ?? 0
      const online = r.status === 'active' && !!r.is_public
      proItems.push({
        id: r.id,
        kind,
        name: (r.pseudo || r.full_name || 'Sans nom').trim(),
        ville: (r.ville ?? '').trim(),
        slug: r.slug,
        online,
        paid: isPaidPro(r),
        founder: r.tier === 'fondateur',
        statusLabel: online ? null : (r.status === 'active' ? 'Non publique' : STATUS_LABEL[r.status ?? ''] ?? 'Pas en ligne'),
        clicks: p?.clicks ?? 0,
        impressions,
        bucket: proBucketOf(main, impressions),
        main,
        ...pagePlaces(p),
        visitors: path ? visitorsByPath.get(path) ?? 0 : 0,
        demandes: demandes.get(r.id) ?? 0,
        queries,
      })
    }
    prosRes.photographers.forEach(r => add(r, 'photographe'))
    prosRes.cleaners.forEach(r => add(r, 'menage'))
  }
  const onlinePros = proItems.filter(p => p.online)
  const prosFirstPage = onlinePros.filter(p => p.main && isFirstPage(p.main.place)).length

  // ── Villes et autres pages ──
  const pageList = [...pages.entries()].map(([path, p]) => ({ path, p }))
  const cityPages = pageList.filter(x => cityOf(x.path)).map(({ path, p }) => {
    const places = pagePlaces(p)
    return {
      path, clicks: p.clicks, impressions: p.impressions, pagePlace: places.pagePlace,
      delta: places.pagePlace !== null && places.prevPagePlace !== null ? places.prevPagePlace - places.pagePlace : null,
      queries: pageQueries(p),
    }
  })
  const cities = groupCities(cityPages, proItems.filter(p => p.statusLabel !== 'Refusée' && p.statusLabel !== 'Annulée'))

  const otherPages: PageItem[] = pageList
    .filter(({ path }) => { const k = pageKind(path); return k !== 'fiche-photographe' && k !== 'fiche-menage' && k !== 'ville' })
    .map(({ path, p }) => {
      const queries = pageQueries(p)
      return {
        path, kind: pageKind(path), label: pageLabel(path), clicks: p.clicks, impressions: p.impressions,
        main: queries[0] ?? null, ...pagePlaces(p), visitors: visitorsByPath.get(path) ?? 0, queries,
      }
    })
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)

  // ── Chiffres communs ──
  const clicks = daily.ok ? daily.data.total.clicks : null
  const prevClicks = daily.ok ? daily.data.prevTotal.clicks : 0
  const hero: VisHero = {
    clicks,
    clicksPct: clicks === null ? null : pctChange(clicks, prevClicks),
    impressions: daily.ok ? daily.data.total.impressions : null,
    visitors: visitsRes.ok ? summary.visitors : null,
    visitorsPct: visitsRes.ok && prevVisitsRes.ok ? pctChange(summary.visitors, prevSummary.visitors) : null,
  }
  const cityProPaths = [...pages.entries()].filter(([path, p]) => /^\/(photographe|menage)-lcd-/.test(path) && p.impressions > 0)
  const counts: Partial<Record<VisTab, number>> = {
    ...(prosRes.ok ? { fiches: proItems.length } : {}),
    ...(qp.ok ? { pagespros: cityProPaths.length } : {}),
    ...(qp.ok ? { recherches: queryStats.length, villes: cities.length, pages: otherPages.length } : {}),
    ...(visitsRes.ok ? { visiteurs: summary.visitors } : {}),
    ...(affClicksRes.ok ? { partenaires: affClicksRes.cur.length } : {}),
  }

  const affClicks: SourceState = affClicksRes.ok ? { ok: true } : { ok: false, error: affClicksRes.error }
  const data: VisibilityData = { periodKey, gscPeriod, visitPeriod, gsc, visits, pros, hero, counts, affClicks }

  if (tab === 'ensemble') {
    const nonBrand = queryStats.filter(s => !isBrandQuery(s.query))
    const withPage = (list: typeof queryStats) => list.map(s => qItemByQuery.get(s.query)!).filter(Boolean)
    data.ensemble = {
      clicks: clicks ?? 0, prevClicks, clicksPct: hero.clicksPct, impressions: hero.impressions ?? 0,
      firstPage: nonBrand.filter(s => isFirstPage(s.position)).length,
      queriesTotal: queryStats.length,
      brandQueries: queryStats.length - nonBrand.length,
      prosFirstPage, prosOnline: onlinePros.length,
      visitors: hero.visitors, visitorsPct: hero.visitorsPct,
      fromGoogle: sourceCount(summary, 'google'), fromAi: sourceCount(summary, 'ia'),
      daily: daily.ok ? fillDays(daily.data.days, bucketKeys(gscPeriod.start, gscPeriod.end, 'day')) : [],
      buckets: bucketCounts(queryStats.map(s => s.position)),
      top: withPage(topRanked(queryStats, 8)),
      nearly: withPage(nearlyFirstPage(queryStats, 8)),
      ai: AI_NAMES.map(name => ({ name, count: summary.ai[name], prev: prevSummary.ai[name] })),
      googleVisits: sourceCount(summary, 'google'),
    }
  }

  if (tab === 'fiches') {
    const buckets = { '1': 0, '2-3': 0, '4-10': 0, '11-20': 0, '21+': 0, masked: 0, never: 0 } as Record<ProBucket, number>
    for (const p of onlinePros) buckets[p.bucket]++
    data.fiches = {
      items: proItems,
      online: onlinePros.length,
      buckets,
      firstPage: prosFirstPage,
      impressions: onlinePros.reduce((n, p) => n + p.impressions, 0),
      clicks: onlinePros.reduce((n, p) => n + p.clicks, 0),
      counts: { photographe: proItems.filter(p => p.kind === 'photographe').length, menage: proItems.filter(p => p.kind === 'menage').length },
    }
  }

  if (tab === 'pagespros') {
    const truthMap = new Map<string, CityPageTruth>()
    for (const [path, p] of pages) {
      if (!/^\/(photographe|menage)-lcd-/.test(path)) continue
      const places = pagePlaces(p)
      truthMap.set(path, { clicks: p.clicks, impressions: p.impressions, pagePlace: places.pagePlace, prevPagePlace: places.prevPagePlace, queries: pageQueries(p) })
    }
    const rowsOf = (rows: ProRow[]) => rows.map(r => ({
      name: (r.pseudo || r.full_name || 'Sans nom').trim(), ville: r.ville, zone: r.zone_couverte ?? null, slug: r.slug,
      online: r.status === 'active' && !!r.is_public, excluded: r.status === 'rejected' || r.status === 'cancelled',
    }))
    data.pagespros = buildCityPros({
      pages: truthMap,
      visits: curRows,
      prevVisits: prevRows,
      pros: prosRes.ok ? { photographe: rowsOf(prosRes.photographers), menage: rowsOf(prosRes.cleaners) } : { photographe: [], menage: [] },
    })
  }

  if (tab === 'recherches') {
    data.recherches = {
      items: allQueryItems.slice(0, QUERIES_SENT),
      total: allQueryItems.length,
      buckets: bucketCounts(queryStats.map(s => s.position)),
      firstPage: queryStats.filter(s => isFirstPage(s.position)).length,
      nearly: queryStats.filter(s => { const pl = placeOf(s.position); return pl >= 11 && pl <= 20 }).length,
      brand: allQueryItems.filter(q => q.brand).length,
    }
  }

  if (tab === 'villes') {
    data.villes = { items: cities, clicks: cities.reduce((n, c) => n + c.clicks, 0), impressions: cities.reduce((n, c) => n + c.impressions, 0) }
  }

  if (tab === 'pages') {
    const kinds = new Map<PageKind, number>()
    for (const p of otherPages) kinds.set(p.kind, (kinds.get(p.kind) ?? 0) + 1)
    data.pages = {
      items: otherPages.slice(0, PAGES_SENT),
      kinds: [...kinds.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
    }
  }

  if (tab === 'visiteurs') {
    const { series, ...rest } = summary
    const mobile = summary.devices.find(d => d.key === 'mobile')
    data.visiteurs = {
      summary: rest,
      series: series.map((s, i) => ({ ...s, prevVisitors: prevVisitsRes.ok ? prevSummary.series[i]?.visitors ?? null : null })),
      granularity,
      prevVisitors: prevSummary.visitors,
      prevViews: prevSummary.views,
      topPages: topVisitedPages(curRows, 12),
      mobilePct: summary.devices.length ? mobile?.pct ?? 0 : null,
    }
  }

  if (tab === 'partenaires') {
    data.partenaires = buildPartners({
      clicks: affClicksRes.ok ? affClicksRes.cur : [],
      prevClicks: affClicksRes.ok ? affClicksRes.prev : [],
      visits: curRows,
      period: visitPeriod,
      pages: new Map([...pages.entries()].map(([path, p]) => [path, { impressions: p.impressions, position: p.position }])),
      affilae,
      partnerstack,
    })
    data.partenaires.seo = buildPartnerSeo({
      pageStats,
      totals: new Map([...pages.entries()].map(([path, p]) => [path, { clicks: p.clicks, impressions: p.impressions, position: p.position, prevPosition: p.prevPosition }])),
      queries: queryStats,
    })
  }

  return data
}


