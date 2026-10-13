// Chiffres publics de visibilité (13/10/2026, Jason : « beaucoup de gens me
// disent : puisque c'est payant, j'aimerais m'assurer que vous avez de la
// visibilité »). Page jasonmarinho.com/chiffres + encart sur les pages de
// ville des pros. Règles pures, testées.
//
// Honnêteté avant tout :
//  - place = position moyenne de Google Search Console sur 28 jours (pas une
//    recherche faite par Jason, qui est personnalisée) ;
//  - un affichage n'est pas un client : chaque chiffre est expliqué sur la page ;
//  - les chiffres d'une page de ville ne sont montrés qu'au-delà d'un seuil
//    (en dessous, seulement les recherches où elle sort en première page) ;
//  - rien de personnel : des totaux, des recherches Google et des adresses de pages.

export const CITY_TOTALS_MIN_IMPRESSIONS = 100
export const QUERY_MIN_IMPRESSIONS = 3
export const FIRST_PAGE_MAX = 10
export const QUERIES_PER_AUDIENCE = 25
export const HOST_QUERY_MIN_IMPRESSIONS = 20

export type Audience = 'photographe' | 'menage' | 'hote'

export interface PairRow { query: string; page: string; clicks: number; impressions: number; position: number }

export interface PublicQuery {
  q: string
  /** Position moyenne pondérée par les affichages, arrondie au dixième */
  place: number
  impressions: number
  clicks: number
  /** Page qui sort le plus pour cette recherche */
  page: string
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function isBrand(q: string): boolean {
  return /jason\s*marinho|marinho|jasonmarinho/.test(norm(q))
}

/** Public visé par une recherche : photographe, ménage, sinon hôte */
export function audienceOf(q: string): Audience {
  const s = norm(q)
  if (/photo/.test(s)) return 'photographe'
  if (/menage|nettoyage|femme de m|blanchisserie|linge/.test(s)) return 'menage'
  return 'hote'
}

export const r1 = (n: number) => Math.round(n * 10) / 10

/** Chemin d'une URL Google (« https://jasonmarinho.com/x/ » → « /x ») */
export function pathOf(url: string): string {
  let p = url
  try { p = new URL(url).pathname } catch { p = url.split(/[?#]/)[0] }
  p = p.replace(/\/+$/, '')
  try { p = decodeURIComponent(p) } catch { /* tel quel */ }
  return p || '/'
}

/** Regroupe les lignes recherche × page par recherche (place pondérée par les affichages) */
export function groupByQuery(rows: PairRow[]): PublicQuery[] {
  const m = new Map<string, PairRow[]>()
  for (const r of rows) m.set(r.query, [...(m.get(r.query) ?? []), r])
  const out: PublicQuery[] = []
  for (const [q, list] of m) {
    const impressions = list.reduce((n, r) => n + r.impressions, 0)
    const clicks = list.reduce((n, r) => n + r.clicks, 0)
    const position = impressions
      ? list.reduce((n, r) => n + r.position * r.impressions, 0) / impressions
      : list.reduce((n, r) => n + r.position, 0) / list.length
    const best = [...list].sort((a, b) => b.impressions - a.impressions)[0]
    out.push({ q, place: r1(position), impressions, clicks, page: pathOf(best.page) })
  }
  return out
}

const byPlaceThenImpressions = (a: PublicQuery, b: PublicQuery) =>
  a.place - b.place || b.impressions - a.impressions

/** Recherches en première page de Google, par public (hors recherches sur notre nom) */
export function firstPageQueries(rows: PairRow[]): Record<Audience, PublicQuery[]> {
  const out: Record<Audience, PublicQuery[]> = { photographe: [], menage: [], hote: [] }
  for (const q of groupByQuery(rows)) {
    if (isBrand(q.q) || q.place > FIRST_PAGE_MAX) continue
    const a = audienceOf(q.q)
    const min = a === 'hote' ? HOST_QUERY_MIN_IMPRESSIONS : QUERY_MIN_IMPRESSIONS
    if (q.impressions < min) continue
    out[a].push(q)
  }
  // Hôtes : les plus vues d'abord (beaucoup de recherches) ; pros : les mieux placées d'abord
  out.hote.sort((a, b) => b.impressions - a.impressions || a.place - b.place)
  out.photographe.sort(byPlaceThenImpressions)
  out.menage.sort(byPlaceThenImpressions)
  return {
    photographe: out.photographe.slice(0, QUERIES_PER_AUDIENCE),
    menage: out.menage.slice(0, QUERIES_PER_AUDIENCE),
    hote: out.hote.slice(0, QUERIES_PER_AUDIENCE),
  }
}

/** Pages de ville des pros (« /photographe-lcd-lyon », « /menage-lcd-bordeaux ») */
export function isProCityPage(path: string): boolean {
  return /^\/(photographe|menage)-lcd-[a-z0-9-]+$/.test(path)
}

export interface CityStats {
  /** Totaux montrés seulement au-delà du seuil (sinon null) */
  totals: { impressions: number; clicks: number; visitors: number } | null
  /** Recherches où la page sort en première page */
  queries: PublicQuery[]
}

/**
 * Chiffres d'une page de ville. `pageTotals` = vrais totaux de Google pour la
 * page (recherches masquées comprises), `pairs` = recherches de cette page.
 */
export function cityStats(
  pageTotals: { impressions: number; clicks: number } | undefined,
  pairs: PairRow[],
  visitors: number,
): CityStats {
  const imp = pageTotals?.impressions ?? 0
  const queries = groupByQuery(pairs)
    .filter(q => !isBrand(q.q) && q.place <= FIRST_PAGE_MAX && q.impressions >= QUERY_MIN_IMPRESSIONS)
    .sort(byPlaceThenImpressions)
    .slice(0, 8)
  return {
    totals: imp >= CITY_TOTALS_MIN_IMPRESSIONS ? { impressions: imp, clicks: pageTotals?.clicks ?? 0, visitors } : null,
    queries,
  }
}

export interface MonthPoint { month: string; impressions: number; clicks: number; partial: boolean }

/** Totaux par mois à partir des lignes jour par jour de Google */
export function monthlySeries(days: Array<{ date: string; impressions: number; clicks: number }>, lastDay: string): MonthPoint[] {
  const m = new Map<string, { impressions: number; clicks: number }>()
  for (const d of days) {
    const k = d.date.slice(0, 7)
    const v = m.get(k) ?? { impressions: 0, clicks: 0 }
    v.impressions += d.impressions
    v.clicks += d.clicks
    m.set(k, v)
  }
  const lastMonth = lastDay.slice(0, 7)
  const endOfMonth = (k: string) => {
    const [y, mo] = k.split('-').map(Number)
    return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10)
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({
    month, ...v, partial: month === lastMonth && lastDay < endOfMonth(month),
  }))
}

/** Visiteurs = sessions distinctes, au total et par page */
export function countVisitors(visits: Array<{ session_id: string; path: string }>): { total: number; byPath: Map<string, number> } {
  const all = new Set<string>()
  const byPath = new Map<string, Set<string>>()
  for (const v of visits) {
    all.add(v.session_id)
    const p = v.path.replace(/\/+$/, '') || '/'
    if (!byPath.has(p)) byPath.set(p, new Set())
    byPath.get(p)!.add(v.session_id)
  }
  return { total: all.size, byPath: new Map([...byPath].map(([p, s]) => [p, s.size])) }
}
