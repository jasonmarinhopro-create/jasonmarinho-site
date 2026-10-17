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
import { CITY_PAGE_SLUGS, cityLabel, citySlugOf } from '@/lib/visibility/city-page'
import { adminUserIds, splitDemo } from '@/lib/pros/demo'
import {
  CITY_TOTALS_MIN_IMPRESSIONS, NO_HOST_GUIDE, videoSummary, cityStats, countVisitors, firstPageQueries, isProCityPage, monthlySeries,
  pageFull, pathOf, prosByCity, type Audience, type CityStats, type PageFull, type PairRow, type PublicQuery, type MonthPoint,
} from './rules'

export interface CityFull {
  slug: string
  label: string
  /** Fiches en ligne présentées sur la page (null si la lecture a échoué) */
  pros: { photographe: number; menage: number } | null
  pages: { photographe: PageFull; menage: PageFull; hote: PageFull | null }
}

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
  /** Recherches vidéo (vidéastes, drone) sur 28 jours */
  video: ReturnType<typeof videoSummary> | null
  cities: Record<string, CityStats> | null
  cityPages: number
  /** Demandes d'hôtes transmises aux pros (null tant qu'il y en a moins de 5) */
  demandes: number | null
  threshold: number
  /** Villes qui ont leurs pages (pour la recherche) */
  villes: Array<{ slug: string; label: string }>
}

export interface PublicStatsFull extends PublicStats {
  /** Chiffres complets par ville (servis un par un avec ?ville=) */
  cityFull: Record<string, CityFull> | null
}

async function compute(): Promise<{ stats: PublicStatsFull; complete: boolean }> {
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

  const prosP = (async () => {
    const db = getServiceClient()
    const cols = 'ville, zone_couverte, status, is_public, user_id'
    const [ph, cl, admins] = await Promise.all([
      db.from('photographers').select(cols), db.from('cleaners').select(cols), adminUserIds(db),
    ])
    if (ph.error || cl.error) throw new Error('pros')
    type R = { ville: string | null; zone_couverte: string | null; status: string | null; is_public: boolean | null; user_id: string | null }
    // Fiches d'exemple des comptes admin jamais comptées
    return {
      photographe: prosByCity(splitDemo((ph.data ?? []) as R[], admins).real, citySlugOf),
      menage: prosByCity(splitDemo((cl.data ?? []) as R[], admins).real, citySlugOf),
    }
  })().catch(() => null)

  const [g, v, demandes, pros] = await Promise.all([googleP, visitsP, demandesP, prosP])

  const visitorsCur = v ? countVisitors(v.cur) : null
  const visitorsPrev = v ? countVisitors(v.prev) : null

  let google: PublicStats['google'] = null
  let queries: PublicStats['queries'] = null
  let video: PublicStats['video'] = null
  let cities: PublicStats['cities'] = null
  let cityFull: PublicStatsFull['cityFull'] = null
  if (g) {
    const sum = (rows: Array<{ impressions: number; clicks: number }>) => ({
      impressions: rows.reduce((n, r) => n + r.impressions, 0),
      clicks: rows.reduce((n, r) => n + r.clicks, 0),
    })
    const totals = sum(g.days.filter(d => d.keys[0] >= start))
    const prevTotals = sum(g.prevPages)
    const pairs: PairRow[] = g.pairs.map(r => ({ query: r.keys[0], page: r.keys[1], clicks: r.clicks, impressions: r.impressions, position: r.position }))
    queries = firstPageQueries(pairs)
    video = videoSummary(pairs)
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

    // Chiffres complets de chaque ville (photographe, ménage, guide hôte)
    const prevByPage = new Map(g.prevPages.map(p => [pathOf(p.keys[0]), { impressions: p.impressions }]))
    const curTotals = new Map(g.pages.map(p => [pathOf(p.keys[0]), { impressions: p.impressions, clicks: p.clicks, position: p.position }]))
    const pairsOf = new Map<string, PairRow[]>()
    for (const p of pairs) {
      const path = pathOf(p.page)
      if (!/^\/(photographe-lcd|menage-lcd|devenir-hote-airbnb)-/.test(path)) continue
      pairsOf.set(path, [...(pairsOf.get(path) ?? []), p])
    }
    const full = (path: string) => pageFull(path, curTotals.get(path), prevByPage.get(path), pairsOf.get(path) ?? [], visitorsCur?.byPath.get(path) ?? 0)
    cityFull = {}
    for (const slug of CITY_PAGE_SLUGS) {
      cityFull[slug] = {
        slug,
        label: cityLabel(slug),
        pros: pros ? { photographe: pros.photographe.get(slug) ?? 0, menage: pros.menage.get(slug) ?? 0 } : null,
        pages: {
          photographe: full(`/photographe-lcd-${slug}`),
          menage: full(`/menage-lcd-${slug}`),
          hote: NO_HOST_GUIDE.has(slug) ? null : full(`/devenir-hote-airbnb-${slug}`),
        },
      }
    }
  }

  return {
    complete,
    stats: {
      updatedAt: new Date().toISOString(),
      google,
      visitors: visitorsCur ? { last30: visitorsCur.total, prev30: visitorsPrev && visitorsPrev.total > 0 ? visitorsPrev.total : null } : null,
      queries,
      video,
      cities,
      cityPages: CITY_PAGE_SLUGS.length * 2,
      demandes: demandes !== null && demandes >= 5 ? demandes : null,
      threshold: CITY_TOTALS_MIN_IMPRESSIONS,
      villes: CITY_PAGE_SLUGS.map(slug => ({ slug, label: cityLabel(slug) })).sort((a, b) => a.label.localeCompare(b.label, 'fr')),
      cityFull,
    },
  }
}

const cachedFull = unstable_cache(async () => {
  const r = await compute()
  if (!r.complete) throw new Error('incomplet')
  return r.stats
}, ['public-stats-v3'], { revalidate: 6 * 3600, tags: ['public-stats'] })

const cachedPartial = unstable_cache(async () => (await compute()).stats, ['public-stats-partial-v2'], { revalidate: 3600, tags: ['public-stats'] })

export async function loadPublicStats(): Promise<PublicStatsFull> {
  try {
    return await cachedFull()
  } catch {
    return cachedPartial()
  }
}
