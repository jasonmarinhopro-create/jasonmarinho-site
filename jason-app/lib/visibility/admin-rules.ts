// Page « Visibilité » de l'admin (05/10/2026) : types des données envoyées
// au navigateur et règles pures (regroupement par ville, filtres, tris,
// dates courtes). Testé (admin-rules.test.ts). Les calculs lourds se font
// côté serveur (lib/visibility/admin-load.ts), le navigateur ne fait que
// filtrer et trier.
import {
  placeOf, placeBucket, pathOf, pageLabel, cityOf, isBrandQuery, CITY_THEME_LABEL,
  type CityTheme, type PageKind, type PlaceBucket, type QueryPageRow, type SearchStat, type VisitRow,
} from './rules'

// ── Types partagés serveur / navigateur ──────────────────────────────────

export type VisTab = 'ensemble' | 'fiches' | 'recherches' | 'villes' | 'pages' | 'visiteurs'

export const VIS_TABS: Array<{ key: VisTab; label: string }> = [
  { key: 'ensemble', label: 'Vue d\'ensemble' },
  { key: 'fiches', label: 'Fiches pros' },
  { key: 'recherches', label: 'Toutes les recherches' },
  { key: 'villes', label: 'Villes' },
  { key: 'pages', label: 'Pages & blog' },
  { key: 'visiteurs', label: 'Visiteurs' },
]

export function parseTab(v: string | null | undefined): VisTab {
  return VIS_TABS.some(t => t.key === v) ? (v as VisTab) : 'ensemble'
}

/** Une recherche, réduite à ce qu'affiche la page */
export interface QueryLite {
  query: string
  clicks: number
  impressions: number
  /** Place arrondie (1 = premier) */
  place: number
  prevPlace: number | null
  /** Places gagnées (positif = mieux) */
  delta: number | null
  isNew: boolean
}

export function liteOf(s: SearchStat): QueryLite {
  return {
    query: s.query,
    clicks: s.clicks,
    impressions: s.impressions,
    place: placeOf(s.position),
    prevPlace: s.prevPosition === null ? null : placeOf(s.prevPosition),
    delta: s.delta,
    isNew: s.isNew,
  }
}

export interface QueryItem extends QueryLite {
  brand: boolean
  /** Page qui sort le plus sur cette recherche */
  mainPath: string | null
  mainLabel: string | null
}

/** « Recherches masquées » : la fiche a des affichages, mais aucune recherche visible */
export type ProBucket = PlaceBucket | 'masked' | 'never'

export interface ProItem {
  id: string
  kind: 'photographe' | 'menage'
  name: string
  ville: string
  slug: string | null
  online: boolean
  paid: boolean
  founder: boolean
  /** Libellé du statut quand la fiche n'est pas en ligne */
  statusLabel: string | null
  clicks: number
  impressions: number
  bucket: ProBucket
  main: QueryLite | null
  /** Place moyenne toutes recherches confondues */
  pagePlace: number | null
  prevPagePlace: number | null
  visitors: number
  demandes: number
  queries: QueryLite[]
}

export interface PageItem {
  path: string
  kind: PageKind
  label: string
  clicks: number
  impressions: number
  main: QueryLite | null
  pagePlace: number | null
  prevPagePlace: number | null
  visitors: number
  queries: QueryLite[]
}

export interface CityThemeItem {
  theme: CityTheme
  label: string
  path: string
  clicks: number
  impressions: number
  place: number | null
  queries: QueryLite[]
}

export interface CityItem {
  slug: string
  name: string
  clicks: number
  impressions: number
  best: QueryLite | null
  /** Places gagnées en moyenne (pondéré par les affichages) */
  delta: number | null
  pros: { photographes: number; menage: number }
  themes: CityThemeItem[]
}

// ── Petites aides ─────────────────────────────────────────────────────────

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** « 2026-10-05 » → « 5 oct. » (sans fuseau ni locale : même texte serveur et navigateur) */
export function shortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!m || !d) return iso
  return `${d} ${MONTHS[m - 1]}`
}

/** Nombre à la française, espace fine pour les milliers (sans dépendre de la locale du navigateur) */
export function fmtInt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** Taux de clic en %, une décimale sous 10 % */
export function ctrLabel(clicks: number, impressions: number): string {
  if (!impressions) return '–'
  const pct = (clicks / impressions) * 100
  return `${pct < 10 ? pct.toFixed(1).replace('.', ',') : Math.round(pct)} %`
}

/** « Lyon 3e », « LYON », « Saint-Malo » → forme comparable (« lyon 3e », « saint malo ») */
export function normCity(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
}

/** La ville d'une fiche correspond-elle à la page ville ? (« Paris 15 » ↔ « Paris ») */
export function cityMatches(proVille: string, city: string): boolean {
  const a = normCity(proVille)
  const b = normCity(city)
  if (!a || !b) return false
  return a === b || a.startsWith(`${b} `)
}

/** Page qui sort le plus sur chaque recherche (clics, puis affichages) */
export function mainPageByQuery(rows: QueryPageRow[]): Map<string, string> {
  const best = new Map<string, QueryPageRow>()
  for (const r of rows) {
    const b = best.get(r.query)
    if (!b || r.clicks > b.clicks || (r.clicks === b.clicks && r.impressions > b.impressions)) best.set(r.query, r)
  }
  return new Map([...best.entries()].map(([q, r]) => [q, pathOf(r.page)]))
}

export function queryItems(stats: SearchStat[], mainPages: Map<string, string>): QueryItem[] {
  return stats.map(s => {
    const mainPath = mainPages.get(s.query) ?? null
    return { ...liteOf(s), brand: isBrandQuery(s.query), mainPath, mainLabel: mainPath ? pageLabel(mainPath) : null }
  })
}

/** Jours sans clic remplis à zéro */
export function fillDays(days: Array<{ date: string; clicks: number; impressions: number }>, keys: string[]) {
  const map = new Map(days.map(d => [d.date, d]))
  return keys.map(k => ({ date: k, clicks: map.get(k)?.clicks ?? 0, impressions: map.get(k)?.impressions ?? 0 }))
}

/** Visiteurs (sessions distinctes) par page */
export function sessionsByPath(rows: Array<Pick<VisitRow, 'session_id' | 'path'>>): Map<string, number> {
  const sets = new Map<string, Set<string>>()
  for (const r of rows) {
    const p = normPath(r.path)
    if (!sets.has(p)) sets.set(p, new Set())
    sets.get(p)!.add(r.session_id)
  }
  return new Map([...sets.entries()].map(([p, s]) => [p, s.size]))
}

/** Chemin tel que l'écrit nav.js, ramené à la forme de Google (« / » final, .html retirés) */
export function normPath(p: string): string {
  let clean = (p || '/').split(/[?#]/)[0].replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '')
  try { clean = decodeURIComponent(clean) } catch { /* tel quel */ }
  return clean || '/'
}

/** Pages les plus vues : vues et visiteurs */
export function topVisitedPages(rows: Array<Pick<VisitRow, 'session_id' | 'path'>>, limit = 12) {
  const views = new Map<string, number>()
  for (const r of rows) { const p = normPath(r.path); views.set(p, (views.get(p) ?? 0) + 1) }
  const visitors = sessionsByPath(rows)
  return [...views.entries()]
    .map(([path, v]) => ({ path, label: pageLabel(path), views: v, visitors: visitors.get(path) ?? 0 }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, limit)
}

/** Tranche d'une fiche selon sa recherche principale */
export function proBucketOf(main: QueryLite | null, impressions: number): ProBucket {
  if (main) return placeBucket(main.place)
  return impressions > 0 ? 'masked' : 'never'
}

/** Places gagnées en moyenne, pondérées par les affichages (null si rien à comparer) */
export function weightedDelta(list: Array<{ delta: number | null; impressions: number }>): number | null {
  const known = list.filter(x => x.delta !== null)
  if (!known.length) return null
  const imp = known.reduce((n, x) => n + x.impressions, 0)
  if (!imp) return Math.round(known.reduce((n, x) => n + (x.delta ?? 0), 0) / known.length)
  return Math.round(known.reduce((n, x) => n + (x.delta ?? 0) * x.impressions, 0) / imp)
}

/** Meilleure place parmi des recherches (à égalité, la plus vue) */
export function bestQuery(list: QueryLite[]): QueryLite | null {
  let best: QueryLite | null = null
  for (const q of list) {
    if (!best || q.place < best.place || (q.place === best.place && q.impressions > best.impressions)) best = q
  }
  return best
}

/**
 * Pages villes regroupées par ville, avec les pros inscrits de cette ville.
 * `pages` : pages de Google (déjà agrégées), `pros` : villes des fiches.
 */
export function groupCities(
  pages: Array<{ path: string; clicks: number; impressions: number; pagePlace: number | null; delta: number | null; queries: QueryLite[] }>,
  pros: Array<{ kind: 'photographe' | 'menage'; ville: string }>,
): CityItem[] {
  const map = new Map<string, CityItem & { deltas: Array<{ delta: number | null; impressions: number }> }>()
  for (const p of pages) {
    const c = cityOf(p.path)
    if (!c) continue
    let item = map.get(c.slug)
    if (!item) {
      item = { slug: c.slug, name: c.name, clicks: 0, impressions: 0, best: null, delta: null, pros: { photographes: 0, menage: 0 }, themes: [], deltas: [] }
      map.set(c.slug, item)
    }
    item.clicks += p.clicks
    item.impressions += p.impressions
    item.deltas.push({ delta: p.delta, impressions: p.impressions })
    item.themes.push({ theme: c.theme, label: CITY_THEME_LABEL[c.theme], path: p.path, clicks: p.clicks, impressions: p.impressions, place: p.pagePlace, queries: p.queries })
  }
  const order: CityTheme[] = ['menage', 'photographe', 'hote']
  return [...map.values()].map(({ deltas, ...item }) => {
    item.themes.sort((a, b) => order.indexOf(a.theme) - order.indexOf(b.theme))
    item.best = bestQuery(item.themes.flatMap(t => t.queries))
    item.delta = weightedDelta(deltas)
    for (const pro of pros) {
      if (!cityMatches(pro.ville, item.name)) continue
      if (pro.kind === 'photographe') item.pros.photographes++
      else item.pros.menage++
    }
    return item
  }).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.name.localeCompare(b.name))
}

// ── Filtres et tris (navigateur) ─────────────────────────────────────────

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function matchesText(q: string, ...fields: Array<string | null | undefined>): boolean {
  const needle = fold(q.trim())
  if (!needle) return true
  return fields.some(f => f && fold(f).includes(needle))
}

/** Tri par place : sans place à la fin */
const byPlace = (a: number | null | undefined, b: number | null | undefined) =>
  (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY)

export type ProFilter = 'toutes' | 'payees' | 'fondateur' | 'jamais' | 'hors-ligne'
export type ProSort = 'clics' | 'affichages' | 'place' | 'visiteurs' | 'nom'

export function filterPros(items: ProItem[], o: { kind: 'all' | 'photographe' | 'menage'; filter: ProFilter; q: string; sort: ProSort }): ProItem[] {
  const out = items.filter(p =>
    (o.kind === 'all' || p.kind === o.kind)
    && (o.filter === 'toutes'
      || (o.filter === 'payees' && p.paid)
      || (o.filter === 'fondateur' && p.founder)
      || (o.filter === 'jamais' && p.bucket === 'never')
      || (o.filter === 'hors-ligne' && !p.online))
    && matchesText(o.q, p.name, p.ville, p.main?.query, ...p.queries.map(x => x.query)))
  const cmp: Record<ProSort, (a: ProItem, b: ProItem) => number> = {
    clics: (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
    affichages: (a, b) => b.impressions - a.impressions || b.clicks - a.clicks,
    place: (a, b) => byPlace(a.main?.place, b.main?.place) || b.impressions - a.impressions,
    visiteurs: (a, b) => b.visitors - a.visitors || b.clicks - a.clicks,
    nom: (a, b) => a.name.localeCompare(b.name, 'fr'),
  }
  return out.sort((a, b) => cmp[o.sort](a, b) || a.name.localeCompare(b.name, 'fr'))
}

export type QueryFilter = 'toutes' | 'progres' | 'recul' | 'nouvelles'
export type QuerySort = 'place' | 'clics' | 'affichages' | 'progression'

export function filterQueries(items: QueryItem[], o: { filter: QueryFilter; hideBrand: boolean; q: string; sort: QuerySort }): QueryItem[] {
  const out = items.filter(x =>
    (!o.hideBrand || !x.brand)
    && (o.filter === 'toutes'
      || (o.filter === 'progres' && (x.delta ?? 0) > 0)
      || (o.filter === 'recul' && (x.delta ?? 0) < 0)
      || (o.filter === 'nouvelles' && x.isNew))
    && matchesText(o.q, x.query, x.mainLabel))
  const cmp: Record<QuerySort, (a: QueryItem, b: QueryItem) => number> = {
    place: (a, b) => a.place - b.place || b.impressions - a.impressions,
    clics: (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
    affichages: (a, b) => b.impressions - a.impressions || b.clicks - a.clicks,
    progression: (a, b) => (b.delta ?? Number.NEGATIVE_INFINITY) - (a.delta ?? Number.NEGATIVE_INFINITY) || b.impressions - a.impressions,
  }
  return out.sort((a, b) => cmp[o.sort](a, b) || a.query.localeCompare(b.query, 'fr'))
}

export type PageSort = 'clics' | 'affichages' | 'place' | 'visiteurs'

export function filterPages(items: PageItem[], o: { kind: PageKind | 'all'; q: string; sort: PageSort }): PageItem[] {
  const out = items.filter(p => (o.kind === 'all' || p.kind === o.kind) && matchesText(o.q, p.label, p.path, p.main?.query))
  const cmp: Record<PageSort, (a: PageItem, b: PageItem) => number> = {
    clics: (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
    affichages: (a, b) => b.impressions - a.impressions || b.clicks - a.clicks,
    place: (a, b) => byPlace(a.main?.place, b.main?.place) || b.impressions - a.impressions,
    visiteurs: (a, b) => b.visitors - a.visitors || b.clicks - a.clicks,
  }
  return out.sort((a, b) => cmp[o.sort](a, b) || a.path.localeCompare(b.path))
}
