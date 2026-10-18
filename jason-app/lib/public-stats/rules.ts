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

import { isVideoQuery } from '@/lib/visibility/rules'

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
  if (/photo/.test(s) || isVideoQuery(s)) return 'photographe'
  if (/menage|nettoyage|femme de m|blanchisserie|linge/.test(s)) return 'menage'
  return 'hote'
}

/** Recherches vidéo (vidéo, vidéaste, drone…) où Google montre le site, toutes places : nombre, affichages, clics, les 5 plus vues */
export function videoSummary(rows: PairRow[]): { count: number; impressions: number; clicks: number; firstPage: number; top: PublicQuery[] } {
  const list = groupByQuery(rows).filter(q => !isBrand(q.q) && isVideoQuery(q.q))
  return {
    count: list.length,
    impressions: list.reduce((n, q) => n + q.impressions, 0),
    clicks: list.reduce((n, q) => n + q.clicks, 0),
    firstPage: list.filter(q => q.place <= FIRST_PAGE_MAX).length,
    top: [...list].sort((a, b) => b.impressions - a.impressions || a.place - b.place).slice(0, 5),
  }
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

export interface CityRank {
  path: string
  /** Place moyenne de la page sur toutes les recherches (masquées par Google comprises) */
  place: number
  impressions: number
  clicks: number
  /** Recherche la plus vue que Google nomme, s'il y en a une */
  query: string | null
}

/**
 * Pages de ville des pros en première page de Google (18/10/2026, Jason : « je
 * ressors en première page sur photographe airbnb Nice, Cannes… pourquoi ce
 * n'est pas mis en avant ? »). Google ne nomme pas les recherches trop rares
 * (vie privée) : Nice, Avignon, Nantes… sortaient en place 5 à 7 sans aucune
 * recherche nommée, donc absentes des listes. La place de la PAGE, elle, compte
 * toutes les recherches. Au moins QUERY_MIN_IMPRESSIONS affichages sur 28 jours.
 * Guides hôtes ajoutés le même jour (Jason : « fais la même chose pour les guides hôtes »).
 */
export function cityPageRanks(
  pages: Array<{ path: string; impressions: number; clicks: number; position: number }>,
  pairs: PairRow[],
): Record<Audience, CityRank[]> {
  const out: Record<Audience, CityRank[]> = { photographe: [], menage: [], hote: [] }
  const topQuery = new Map<string, { q: string; imp: number }>()
  for (const r of pairs) {
    const path = pathOf(r.page)
    if (!isCityPage(path) || isBrand(r.query)) continue
    const cur = topQuery.get(path)
    if (!cur || r.impressions > cur.imp) topQuery.set(path, { q: r.query, imp: r.impressions })
  }
  for (const p of pages) {
    if (!isCityPage(p.path) || p.position > FIRST_PAGE_MAX || p.impressions < QUERY_MIN_IMPRESSIONS) continue
    const kind: Audience = p.path.startsWith('/photographe-') ? 'photographe' : p.path.startsWith('/menage-') ? 'menage' : 'hote'
    out[kind].push({ path: p.path, place: r1(p.position), impressions: p.impressions, clicks: p.clicks, query: topQuery.get(p.path)?.q ?? null })
  }
  const sort = (a: CityRank, b: CityRank) => a.place - b.place || b.impressions - a.impressions
  out.photographe.sort(sort)
  out.menage.sort(sort)
  out.hote.sort(sort)
  return out
}

/** Pages de ville : pros (photographe, ménage) et guides hôtes (« /devenir-hote-airbnb-lyon ») */
export function isCityPage(path: string): boolean {
  return isProCityPage(path) || /^\/devenir-hote-airbnb-[a-z0-9-]+$/.test(path)
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

// ── Recherche par ville (13/10/2026, Jason : « 100 % transparent : une barre
//    de recherche pour que les gens voient les stats de leur ville ») ──────
// Quand quelqu'un cherche SA ville, tout est montré, même les petits chiffres :
// c'est une démarche volontaire, et la page explique qu'une page récente met
// du temps à monter dans Google.

// Depuis le 17/10/2026, chaque ville a ses 3 pages (scripts/creer-ville.mjs) : liste vide, gardée pour le test
export const NO_HOST_GUIDE = new Set<string>()

export interface PageFull {
  path: string
  impressions: number
  clicks: number
  /** Place moyenne pondérée (null si aucun affichage) */
  place: number | null
  prevImpressions: number
  visitors: number
  /** Recherches de la page, les plus vues d'abord (toutes places) */
  queries: PublicQuery[]
}

export function pageFull(
  path: string,
  cur: { impressions: number; clicks: number; position: number } | undefined,
  prev: { impressions: number } | undefined,
  pairs: PairRow[],
  visitors: number,
): PageFull {
  const queries = groupByQuery(pairs)
    .filter(q => !isBrand(q.q))
    .sort((a, b) => b.impressions - a.impressions || a.place - b.place)
    .slice(0, 10)
  return {
    path,
    impressions: cur?.impressions ?? 0,
    clicks: cur?.clicks ?? 0,
    place: cur && cur.impressions > 0 ? r1(cur.position) : null,
    prevImpressions: prev?.impressions ?? 0,
    visitors,
    queries,
  }
}

/** Nombre de fiches en ligne par page de ville, avec la règle de rattachement des pros */
export function prosByCity(
  rows: Array<{ ville: string | null; zone_couverte: string | null; status: string | null; is_public: boolean | null }>,
  slugOf: (ville: string | null, zone: string | null) => string | null,
): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'active' || r.is_public === false) continue
    const slug = slugOf(r.ville, r.zone_couverte)
    if (slug) out.set(slug, (out.get(slug) ?? 0) + 1)
  }
  return out
}

/** Demande de création d'une page de ville : nettoyage et contrôle */
export function cleanCityRequest(body: unknown):
  { ok: true; ville: string; metier: 'photographe' | 'menage' | 'hote'; email: string | null } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>
  const ville = typeof b.ville === 'string' ? b.ville.replace(/\s+/g, ' ').trim() : ''
  if (ville.length < 2 || ville.length > 60 || !/\p{L}/u.test(ville)) return { ok: false, error: 'Indique le nom de ta ville.' }
  const metier = b.metier === 'photographe' || b.metier === 'menage' || b.metier === 'hote' ? b.metier : 'hote'
  const raw = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
  if (raw && (raw.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw))) return { ok: false, error: 'Cette adresse e-mail ne semble pas valide.' }
  return { ok: true, ville, metier, email: raw || null }
}

/** Clé d'une ville demandée : sans accents, casse, tirets ni « Ville de » (Québec = quebec = Ville de Québec) */
export function cityRequestKey(ville: string): string {
  return ville.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/^(ville|city) (de |du |d')?/, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Résumé des demandes déjà reçues pour une ville (celle-ci comprise) */
export function cityRequestTally(rows: Array<{ metier: string; created_at: string }>): { total: number; parMetier: Record<'photographe' | 'menage' | 'hote', number>; premiere: string | null } {
  const parMetier = { photographe: 0, menage: 0, hote: 0 }
  for (const r of rows) if (r.metier in parMetier) parMetier[r.metier as keyof typeof parMetier]++
  const dates = rows.map(r => r.created_at).sort()
  return { total: rows.length, parMetier, premiere: dates[0] ?? null }
}
