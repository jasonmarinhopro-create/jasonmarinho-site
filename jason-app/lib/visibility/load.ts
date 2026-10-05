// Chargements partagés de la Visibilité (05/10/2026) : visites du site
// (site_visits, service role : à n'appeler qu'après avoir vérifié l'admin
// ou le propriétaire de la fiche) et chiffres de Google Search Console.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { gscQuery, type GscRow } from '@/lib/google/search-analytics'
import type { Period, QueryPageRow, VisitRow } from './rules'

const LEGACY_COLUMNS = 'session_id, path, referrer, utm_source, utm_medium, created_at'
const FULL_COLUMNS = `${LEGACY_COLUMNS}, country, region, city, device, duration_s`

/** Début d'une journée de Paris en horodatage UTC (approximation à l'heure près, suffisante ici) */
function dayStartIso(day: string): string { return `${day}T00:00:00+02:00` }
function dayEndIso(day: string): string { return `${day}T23:59:59+02:00` }

/**
 * Visites entre deux jours (inclus). `path` : une page précise ; `prefix` :
 * toutes les pages qui commencent ainsi. Pagination par 1 000 (plafond de
 * l'API), 50 000 lignes au plus. Tolère l'absence de la migration 123.
 */
export async function loadVisits(opts: { start: string; end: string; path?: string; prefix?: string }): Promise<VisitRow[]> {
  const db = getServiceClient()
  const run = async (columns: string) => {
    const out: VisitRow[] = []
    for (let from = 0; from < 50_000; from += 1000) {
      let q = db.from('site_visits').select(columns)
        .gte('created_at', dayStartIso(opts.start))
        .lte('created_at', dayEndIso(opts.end))
        .order('created_at', { ascending: true })
        .range(from, from + 999)
      if (opts.path) q = q.eq('path', opts.path)
      if (opts.prefix) q = q.like('path', `${opts.prefix.replace(/[%_\\]/g, '\\$&')}%`)
      const { data, error } = await q
      if (error) return { error }
      out.push(...((data ?? []) as unknown as VisitRow[]))
      if (!data || data.length < 1000) break
    }
    return { rows: out }
  }
  const full = await run(FULL_COLUMNS)
  if ('rows' in full) return full.rows ?? []
  // Colonnes de la migration 123 absentes (42703) : visites sans pays ni écran
  const legacy = await run(LEGACY_COLUMNS)
  if ('rows' in legacy) return legacy.rows ?? []
  throw new Error(`Lecture des visites impossible : ${legacy.error.message}`)
}

const toQueryPage = (r: GscRow): QueryPageRow => ({ query: r.keys[0], page: r.keys[1], clicks: r.clicks, impressions: r.impressions, position: r.position })

/** Recherches × pages de la période et de la période d'avant (pour l'évolution) */
export async function loadGscQueryPages(period: Period, page?: { op: 'equals' | 'contains'; value: string }) {
  const [cur, prev] = await Promise.all([
    gscQuery({ startDate: period.start, endDate: period.end, dimensions: ['query', 'page'], page }),
    gscQuery({ startDate: period.prevStart, endDate: period.prevEnd, dimensions: ['query', 'page'], page }),
  ])
  return { cur: cur.map(toQueryPage), prev: prev.map(toQueryPage) }
}

export interface GscTotals { clicks: number; impressions: number; ctr: number; position: number }

const totalsOf = (rows: GscRow[]): GscTotals => {
  const clicks = rows.reduce((n, r) => n + r.clicks, 0)
  const impressions = rows.reduce((n, r) => n + r.impressions, 0)
  const position = impressions ? rows.reduce((n, r) => n + r.position * r.impressions, 0) / impressions : 0
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position }
}

/**
 * Totaux jour par jour (vrais totaux de Google, recherches masquées
 * comprises) + totaux de la période et de la période d'avant.
 */
export async function loadGscDaily(period: Period, page?: { op: 'equals' | 'contains'; value: string }) {
  const [cur, prev] = await Promise.all([
    gscQuery({ startDate: period.start, endDate: period.end, dimensions: ['date'], page }),
    gscQuery({ startDate: period.prevStart, endDate: period.prevEnd, dimensions: ['date'], page }),
  ])
  return {
    days: cur.map(r => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
    total: totalsOf(cur),
    prevTotal: totalsOf(prev),
  }
}

/** Totaux par page (vrais totaux par page, recherches masquées comprises) */
export async function loadGscPages(period: Period, page?: { op: 'equals' | 'contains'; value: string }) {
  const [cur, prev] = await Promise.all([
    gscQuery({ startDate: period.start, endDate: period.end, dimensions: ['page'], page }),
    gscQuery({ startDate: period.prevStart, endDate: period.prevEnd, dimensions: ['page'], page }),
  ])
  const map = (rows: GscRow[]) => new Map(rows.map(r => [r.keys[0], { clicks: r.clicks, impressions: r.impressions, position: r.position }]))
  return { cur: map(cur), prev: map(prev) }
}

/** Écran des internautes selon Google (MOBILE, DESKTOP, TABLET) */
export async function loadGscDevices(period: Period, page?: { op: 'equals' | 'contains'; value: string }) {
  const rows = await gscQuery({ startDate: period.start, endDate: period.end, dimensions: ['device'], page })
  return rows.map(r => ({ device: r.keys[0].toLowerCase(), clicks: r.clicks, impressions: r.impressions }))
}

export const SITE_ORIGIN = 'https://jasonmarinho.com'
