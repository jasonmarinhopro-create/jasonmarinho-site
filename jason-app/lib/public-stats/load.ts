// Chargement des chiffres publics (server only). Google Search Console (28
// jours, 2 jours de retard), visites mesurées par nav.js (30 jours) et nombre
// de demandes d'hôtes transmises. Résultat gardé 6 h (Google ne change qu'une
// fois par jour) ; une source en panne donne `null` sans casser les autres,
// et un résultat incomplet n'est gardé qu'1 h.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { gscQuery } from '@/lib/google/search-analytics'
import { loadVisits } from '@/lib/visibility/load'
import { getServiceClient } from '@/lib/supabase/service'
import { parisToday } from '@/lib/stripe/deposit-window'
import { GSC_LAG_DAYS, addDays } from '@/lib/visibility/rules'
import { CITY_PAGE_SLUGS } from '@/lib/visibility/city-page'
import {
  CITY_TOTALS_MIN_IMPRESSIONS, cityStats, countVisitors, firstPageQueries, isProCityPage, monthlySeries,
  pathOf, type Audience, type CityStats, type PairRow, type PublicQuery, type MonthPoint,
} from './rules'

export interface PublicStats {
  updatedAt: string
  google: {
    start: string
    end: string
    impressions: number
    clicks: number
    prevImpressions: number
    prevClicks: number
    pagesSeen: number
    firstPageCount: number
    months: MonthPoint[]
  } | null
  visitors: { last30: number; prev30: number | null } | null
  queries: Record<Audience, PublicQuery[]> | null
  cities: Record<string, CityStats> | null
  cityPages: number
  /** Demandes d'hôtes transmises aux pros (null tant qu'il y en a moins de 5) */
  demandes: number | null
  threshold: number
}

async function compute(): Promise<{ stats: PublicStats; complete: boolean }> {
  const today = parisToday()
  const end = addDays(today, -GSC_LAG_DAYS)
  const start = addDays(end, -27)
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -27)
  const monthsStart = `${addDays(end, -185).slice(0, 7)}-01`
  let complete = true

  const googleP = (async () => {
    const [pages, prevPages, pairs, days] = await Promise.all([
      gscQuery({ startDate: start, endDate: end, dimensions: ['page'], rowLimit: 5000 }),
      gscQuery({ startDate: prevStart, endDate: prevEnd, dimensions: ['page'], rowLimit: 5000 }),
      gscQuery({ startDate: start, endDate: end, dimensions: ['query', 'page'], rowLimit: 25000 }),
      gscQuery({ startDate: monthsStart, endDate: end, dimensions: ['date'] }),
    ])
    return { pages, prevPages, pairs, days }
  })().catch(() => { complete = false; return null })

  const visitsP = (async () => {
    const [cur, prev] = await Promise.all([
      loadVisits({ start: addDays(today, -29), end: today }),
      loadVisits({ start: addDays(today, -59), end: addDays(today, -30) }),
    ])
    return { cur, prev }
  })().catch(() => { complete = false; return null })

  const demandesP = (async () => {
    const { count, error } = await getServiceClient().from('demandes_hotes').select('id', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
  })().catch(() => null)

  const [g, v, demandes] = await Promise.all([googleP, visitsP, demandesP])

  const visitorsCur = v ? countVisitors(v.cur) : null
  const visitorsPrev = v ? countVisitors(v.prev) : null

  let google: PublicStats['google'] = null
  let queries: PublicStats['queries'] = null
  let cities: PublicStats['cities'] = null
  if (g) {
    const sum = (rows: Array<{ impressions: number; clicks: number }>) => ({
      impressions: rows.reduce((n, r) => n + r.impressions, 0),
      clicks: rows.reduce((n, r) => n + r.clicks, 0),
    })
    const totals = sum(g.days.filter(d => d.keys[0] >= start))
    const prevTotals = sum(g.prevPages)
    const pairs: PairRow[] = g.pairs.map(r => ({ query: r.keys[0], page: r.keys[1], clicks: r.clicks, impressions: r.impressions, position: r.position }))
    queries = firstPageQueries(pairs)
    const firstPage = new Set(pairs.filter(p => p.position <= 10).map(p => p.query))

    google = {
      start, end,
      impressions: totals.impressions,
      clicks: totals.clicks,
      prevImpressions: prevTotals.impressions,
      prevClicks: prevTotals.clicks,
      pagesSeen: g.pages.filter(p => p.impressions > 0).length,
      firstPageCount: firstPage.size,
      months: monthlySeries(g.days.map(d => ({ date: d.keys[0], impressions: d.impressions, clicks: d.clicks })), end),
    }

    const pageTotals = new Map(g.pages.map(p => [pathOf(p.keys[0]), { impressions: p.impressions, clicks: p.clicks }]))
    const pairsByPage = new Map<string, PairRow[]>()
    for (const p of pairs) {
      const path = pathOf(p.page)
      if (!isProCityPage(path)) continue
      pairsByPage.set(path, [...(pairsByPage.get(path) ?? []), p])
    }
    cities = {}
    const paths = new Set([...pageTotals.keys(), ...pairsByPage.keys()].filter(isProCityPage))
    for (const path of paths) {
      const s = cityStats(pageTotals.get(path), pairsByPage.get(path) ?? [], visitorsCur?.byPath.get(path) ?? 0)
      if (s.totals || s.queries.length) cities[path] = s
    }
  }

  return {
    complete,
    stats: {
      updatedAt: new Date().toISOString(),
      google,
      visitors: visitorsCur ? { last30: visitorsCur.total, prev30: visitorsPrev && visitorsPrev.total > 0 ? visitorsPrev.total : null } : null,
      queries,
      cities,
      cityPages: CITY_PAGE_SLUGS.length * 2,
      demandes: demandes !== null && demandes >= 5 ? demandes : null,
      threshold: CITY_TOTALS_MIN_IMPRESSIONS,
    },
  }
}

const cachedFull = unstable_cache(async () => {
  const r = await compute()
  if (!r.complete) throw new Error('incomplet')
  return r.stats
}, ['public-stats-v1'], { revalidate: 6 * 3600, tags: ['public-stats'] })

const cachedPartial = unstable_cache(async () => (await compute()).stats, ['public-stats-partial-v1'], { revalidate: 3600, tags: ['public-stats'] })

export async function loadPublicStats(): Promise<PublicStats> {
  try {
    return await cachedFull()
  } catch {
    return cachedPartial()
  }
}
