// Visibilité (05/10/2026) : règles pures partagées par la page « Visibilité »
// de l'admin et les statistiques des fiches pros (« Mes statistiques »).
// Inspirées de l'outil Driing de Jason. Testées (rules.test.ts).
//
// Deux sources :
//  - Google Search Console (recherches, places, affichages, clics), avec
//    2 jours de retard ;
//  - nos visites (site_visits, écrites par nav.js) : visiteurs, provenance,
//    pays, écran, temps passé.

// ── Périodes ──────────────────────────────────────────────────────────────

export type PeriodKey = '7j' | '28j' | '3m' | '12m'

export const PERIODS: Array<{ key: PeriodKey; label: string; days: number }> = [
  { key: '7j', label: '7 jours', days: 7 },
  { key: '28j', label: '28 jours', days: 28 },
  { key: '3m', label: '3 mois', days: 90 },
  { key: '12m', label: '12 mois', days: 365 },
]

export interface Period {
  key: PeriodKey
  days: number
  start: string
  end: string
  prevStart: string
  prevEnd: string
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function parsePeriod(v: string | null | undefined, fallback: PeriodKey = '28j'): PeriodKey {
  return PERIODS.some(p => p.key === v) ? (v as PeriodKey) : fallback
}

/**
 * Période qui finit `lagDays` avant aujourd'hui (Google : 2 jours de retard),
 * et la période d'avant, de même durée.
 */
export function periodRange(key: PeriodKey, today: string, lagDays = 0): Period {
  const days = PERIODS.find(p => p.key === key)?.days ?? 28
  const end = addDays(today, -lagDays)
  const start = addDays(end, -(days - 1))
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -(days - 1))
  return { key, days, start, end, prevStart, prevEnd }
}

/** Chiffres de Google : 2 jours de retard */
export const GSC_LAG_DAYS = 2

/** Écart en % (null si rien avant : pas de « +∞ % ») */
export function pctChange(cur: number, prev: number): number | null {
  if (!prev) return null
  return Math.round(((cur - prev) / prev) * 100)
}

// ── Places dans Google ────────────────────────────────────────────────────

export type PlaceBucket = '1' | '2-3' | '4-10' | '11-20' | '21+'

export const PLACE_BUCKETS: Array<{ key: PlaceBucket; label: string }> = [
  { key: '1', label: '1er' },
  { key: '2-3', label: '2e-3e' },
  { key: '4-10', label: '4e-10e' },
  { key: '11-20', label: '11e-20e' },
  { key: '21+', label: 'Au-delà' },
]

export function placeOf(position: number): number {
  return Math.max(1, Math.round(position))
}

export function placeBucket(position: number): PlaceBucket {
  const p = placeOf(position)
  if (p === 1) return '1'
  if (p <= 3) return '2-3'
  if (p <= 10) return '4-10'
  if (p <= 20) return '11-20'
  return '21+'
}

export function placeLabel(position: number): string {
  const p = placeOf(position)
  return p === 1 ? '1er' : `${p}e`
}

export function bucketCounts(positions: number[]): Record<PlaceBucket, number> {
  const out: Record<PlaceBucket, number> = { '1': 0, '2-3': 0, '4-10': 0, '11-20': 0, '21+': 0 }
  for (const p of positions) out[placeBucket(p)]++
  return out
}

export const isFirstPage = (position: number) => placeOf(position) <= 10

// ── Pages du site ─────────────────────────────────────────────────────────

export type PageKind =
  | 'accueil' | 'fiche-photographe' | 'fiche-menage' | 'annuaire' | 'ville' | 'blog'
  | 'simulateur' | 'service' | 'partenaire' | 'comparatif' | 'autre'

export const PAGE_KIND_LABEL: Record<PageKind, string> = {
  accueil: 'Accueil',
  'fiche-photographe': 'Fiche photographe',
  'fiche-menage': 'Fiche ménage',
  annuaire: 'Annuaire',
  ville: 'Ville',
  blog: 'Blog',
  simulateur: 'Simulateur',
  service: 'Service',
  partenaire: 'Partenaire',
  comparatif: 'Comparatif',
  autre: 'Page',
}

/** Chemin d'une URL de Google (domaine, requête, ancre et « / » final retirés) */
export function pathOf(url: string): string {
  let p = url
  try { p = new URL(url).pathname } catch { p = url.split(/[?#]/)[0] }
  p = p.replace(/\/+$/, '')
  try { p = decodeURIComponent(p) } catch { /* tel quel */ }
  return p || '/'
}

export function proSlugOf(path: string): { kind: 'photographe' | 'menage'; slug: string } | null {
  const m = /^\/annuaires\/(photographes|menage)\/([^/]+)$/.exec(path)
  if (!m) return null
  return { kind: m[1] === 'photographes' ? 'photographe' : 'menage', slug: m[2] }
}

export type CityTheme = 'menage' | 'photographe' | 'hote'

export const CITY_THEME_LABEL: Record<CityTheme, string> = {
  menage: 'Ménage',
  photographe: 'Photographe',
  hote: 'Devenir hôte',
}

const CITY_PATTERNS: Array<[RegExp, CityTheme]> = [
  [/^\/menage-lcd-([a-z0-9-]+)$/, 'menage'],
  [/^\/photographe-lcd-([a-z0-9-]+)$/, 'photographe'],
  [/^\/devenir-hote-airbnb-([a-z0-9-]+)$/, 'hote'],
]

/** « la-rochelle » → « La Rochelle », « saint-malo » → « Saint-Malo », « aix-en-provence » → « Aix-en-Provence » */
export function cityName(slug: string): string {
  const small = new Set(['en', 'de', 'du', 'des', 'sur', 'les', 'le', 'la', 'et'])
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
  const words = slug.split('-').filter(Boolean)
  // Article en tête (La Rochelle, Le Mans) : séparé par une espace, le reste garde ses tirets
  const lead = words.length > 1 && ['le', 'la', 'les'].includes(words[0]) ? `${cap(words.shift()!)} ` : ''
  return lead + words.map((w, i) => (i > 0 && small.has(w) ? w : cap(w))).join('-')
}

export function cityOf(path: string): { slug: string; name: string; theme: CityTheme } | null {
  for (const [re, theme] of CITY_PATTERNS) {
    const m = re.exec(path)
    if (m) return { slug: m[1], name: cityName(m[1]), theme }
  }
  return null
}

export function pageKind(path: string): PageKind {
  if (path === '/' || path === '') return 'accueil'
  const pro = proSlugOf(path)
  if (pro) return pro.kind === 'photographe' ? 'fiche-photographe' : 'fiche-menage'
  if (path.startsWith('/annuaires')) return 'annuaire'
  if (cityOf(path)) return 'ville'
  if (path.startsWith('/blog')) return 'blog'
  if (path.startsWith('/calculateurs') || path.startsWith('/services/simulateurs')) return 'simulateur'
  if (path.startsWith('/partenaires') || /-avis$|-prix$|^\/code-promo-/.test(path)) return 'partenaire'
  if (path.startsWith('/comparatif-')) return 'comparatif'
  if (path.startsWith('/services') || path.startsWith('/pour-qui') || path === '/tarifs') return 'service'
  return 'autre'
}

/** Libellé lisible d'une page : « Blog Comment déclarer… » à partir du chemin */
export function pageLabel(path: string): string {
  const kind = pageKind(path)
  if (kind === 'accueil') return 'Accueil'
  const city = cityOf(path)
  if (city) return `${CITY_THEME_LABEL[city.theme]} · ${city.name}`
  const last = path.split('/').filter(Boolean).pop() ?? path
  const words = last.replace(/-/g, ' ')
  const text = words.charAt(0).toUpperCase() + words.slice(1)
  return kind === 'autre' ? text : `${PAGE_KIND_LABEL[kind]} · ${text}`
}

// ── Recherches Google ─────────────────────────────────────────────────────

export interface QueryPageRow {
  query: string
  page: string
  clicks: number
  impressions: number
  position: number
}

export interface SearchStat {
  query: string
  clicks: number
  impressions: number
  /** Place moyenne, pondérée par les affichages */
  position: number
  prevPosition: number | null
  /** Places gagnées depuis la période d'avant (positif = mieux) */
  delta: number | null
  isNew: boolean
}

export interface PageStat {
  path: string
  kind: PageKind
  clicks: number
  impressions: number
  position: number
  prevPosition: number | null
  delta: number | null
  /** Recherche qui amène le plus de clics (à égalité, d'affichages) */
  main: SearchStat | null
  queries: SearchStat[]
}

/** Recherches sur notre nom : à part dans « nos pages en tête » */
export function isBrandQuery(q: string): boolean {
  const s = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return /jason\s*marinho|marinho|jasonmarinho/.test(s)
}

function weighted(rows: Array<{ impressions: number; position: number }>): number {
  const imp = rows.reduce((n, r) => n + r.impressions, 0)
  if (!imp) return rows.length ? rows.reduce((n, r) => n + r.position, 0) / rows.length : 0
  return rows.reduce((n, r) => n + r.position * r.impressions, 0) / imp
}

const byClicksThenImpressions = (a: { clicks: number; impressions: number }, b: { clicks: number; impressions: number }) =>
  b.clicks - a.clicks || b.impressions - a.impressions

function groupQueries(rows: QueryPageRow[]): Map<string, { clicks: number; impressions: number; position: number }> {
  const groups = new Map<string, QueryPageRow[]>()
  for (const r of rows) groups.set(r.query, [...(groups.get(r.query) ?? []), r])
  const out = new Map<string, { clicks: number; impressions: number; position: number }>()
  for (const [q, list] of groups) {
    out.set(q, {
      clicks: list.reduce((n, r) => n + r.clicks, 0),
      impressions: list.reduce((n, r) => n + r.impressions, 0),
      position: weighted(list),
    })
  }
  return out
}

function withEvolution(cur: Map<string, { clicks: number; impressions: number; position: number }>, prev: Map<string, { position: number }>): SearchStat[] {
  return [...cur.entries()].map(([query, v]) => {
    const p = prev.get(query)
    const prevPosition = p ? p.position : null
    return {
      query,
      clicks: v.clicks,
      impressions: v.impressions,
      position: v.position,
      prevPosition,
      delta: prevPosition === null ? null : placeOf(prevPosition) - placeOf(v.position),
      isNew: prevPosition === null,
    }
  }).sort(byClicksThenImpressions)
}

/** Recherches de tout le site (toutes pages confondues), avec l'évolution de place */
export function aggregateQueries(cur: QueryPageRow[], prev: QueryPageRow[]): SearchStat[] {
  return withEvolution(groupQueries(cur), groupQueries(prev))
}

/** Pages du site avec leurs recherches, leur recherche principale et l'évolution */
export function aggregatePages(cur: QueryPageRow[], prev: QueryPageRow[]): PageStat[] {
  const byPage = (rows: QueryPageRow[]) => {
    const m = new Map<string, QueryPageRow[]>()
    for (const r of rows) {
      const path = pathOf(r.page)
      m.set(path, [...(m.get(path) ?? []), r])
    }
    return m
  }
  const curPages = byPage(cur)
  const prevPages = byPage(prev)
  const out: PageStat[] = []
  for (const [path, rows] of curPages) {
    const prevRows = prevPages.get(path) ?? []
    const queries = withEvolution(groupQueries(rows), groupQueries(prevRows))
    const position = weighted(rows)
    const prevPosition = prevRows.length ? weighted(prevRows) : null
    out.push({
      path,
      kind: pageKind(path),
      clicks: rows.reduce((n, r) => n + r.clicks, 0),
      impressions: rows.reduce((n, r) => n + r.impressions, 0),
      position,
      prevPosition,
      delta: prevPosition === null ? null : placeOf(prevPosition) - placeOf(position),
      main: queries[0] ?? null,
      queries,
    })
  }
  return out.sort(byClicksThenImpressions)
}

/** À garder : recherches (hors notre nom) où l'on sort dans les 3 premiers */
export function topRanked(stats: SearchStat[], limit = 8): SearchStat[] {
  return stats.filter(s => !isBrandQuery(s.query) && placeOf(s.position) <= 3)
    .sort((a, b) => placeOf(a.position) - placeOf(b.position) || b.impressions - a.impressions)
    .slice(0, limit)
}

/** À un pas de la première page (11e à 20e), les plus vues d'abord */
export function nearlyFirstPage(stats: SearchStat[], limit = 8): SearchStat[] {
  return stats.filter(s => placeBucket(s.position) === '11-20')
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
}

// ── Visites ───────────────────────────────────────────────────────────────

export interface VisitRow {
  session_id: string
  path: string
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  created_at: string
  country?: string | null
  region?: string | null
  city?: string | null
  device?: string | null
  duration_s?: number | null
}

export type SourceKind =
  | 'google' | 'autre-moteur' | 'ia' | 'facebook' | 'instagram' | 'autre-reseau'
  | 'e-mail' | 'direct' | 'interne' | 'autre-site'

export const SOURCE_LABEL: Record<SourceKind, string> = {
  google: 'Trouvé sur Google',
  'autre-moteur': 'Autre moteur de recherche',
  ia: 'Envoyé par une IA',
  facebook: 'Depuis Facebook',
  instagram: 'Depuis Instagram',
  'autre-reseau': 'Autre réseau social',
  'e-mail': 'Depuis un e-mail',
  direct: 'Venus directement (lien partagé, favori, QR code)',
  interne: 'Depuis une autre page de jasonmarinho.com',
  'autre-site': 'Depuis un autre site',
}

export type AiName = 'ChatGPT' | 'Perplexity' | 'Gemini' | 'Copilot' | 'Claude' | 'Mistral'
export const AI_NAMES: AiName[] = ['ChatGPT', 'Perplexity', 'Gemini', 'Copilot', 'Claude', 'Mistral']

const AI_HOSTS: Array<[RegExp, AiName]> = [
  [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)openai\.com$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity'],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, 'Gemini'],
  [/(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, 'Copilot'],
  [/(^|\.)claude\.ai$/, 'Claude'],
  [/(^|\.)chat\.mistral\.ai$|(^|\.)mistral\.ai$/, 'Mistral'],
]

function hostOf(url: string | null | undefined): string {
  if (!url) return ''
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, '') } catch { return '' }
}

export interface VisitSource {
  kind: SourceKind
  /** Site d'où l'on vient (domaine), pour l'onglet « Sites » */
  site: string | null
  ai: AiName | null
}

/** D'où vient une visite (référent + paramètres utm) */
export function sourceOf(v: Pick<VisitRow, 'referrer' | 'utm_source' | 'utm_medium'>): VisitSource {
  const src = (v.utm_source ?? '').toLowerCase().trim()
  const medium = (v.utm_medium ?? '').toLowerCase().trim()
  const host = hostOf(v.referrer)
  // Les IA ajoutent souvent utm_source=chatgpt.com
  for (const [re, name] of AI_HOSTS) {
    if ((src && re.test(src.replace(/^www\./, ''))) || (host && re.test(host))) return { kind: 'ia', site: host || src, ai: name }
  }
  if (src === 'facebook' || src === 'fb' || /(^|\.)facebook\.com$|(^|\.)fb\.com$|^m\.facebook\.com$|^l\.facebook\.com$|^lm\.facebook\.com$/.test(host)) return { kind: 'facebook', site: host || 'facebook.com', ai: null }
  if (src === 'instagram' || /(^|\.)instagram\.com$/.test(host)) return { kind: 'instagram', site: host || 'instagram.com', ai: null }
  if (['linkedin', 'tiktok', 'pinterest', 'twitter', 'x', 'youtube', 'whatsapp'].includes(src) || /(^|\.)(linkedin\.com|lnkd\.in|tiktok\.com|pinterest\.[a-z.]+|twitter\.com|t\.co|x\.com|youtube\.com|whatsapp\.com)$/.test(host)) return { kind: 'autre-reseau', site: host || src, ai: null }
  if (medium === 'email' || medium === 'e-mail' || src === 'prospection' || src === 'newsletter' || /mail\.|webmail|outlook\.live\.com$/.test(host)) return { kind: 'e-mail', site: host || src || null, ai: null }
  if (/(^|\.)google\.[a-z.]+$/.test(host) || src === 'google') return { kind: 'google', site: 'google', ai: null }
  if (/(^|\.)(bing\.com|duckduckgo\.com|qwant\.com|ecosia\.org|yahoo\.[a-z.]+|yandex\.[a-z.]+|search\.brave\.com|startpage\.com)$/.test(host)) return { kind: 'autre-moteur', site: host, ai: null }
  if (/(^|\.)jasonmarinho\.com$/.test(host)) return { kind: 'interne', site: null, ai: null }
  if (src && !host) return { kind: 'autre-site', site: src, ai: null }
  if (!host) return { kind: 'direct', site: null, ai: null }
  return { kind: 'autre-site', site: host, ai: null }
}

export type DeviceKind = 'mobile' | 'desktop' | 'tablet'
export const DEVICE_LABEL: Record<DeviceKind, string> = { mobile: 'Téléphone', desktop: 'Ordinateur', tablet: 'Tablette' }

let regionNames: Intl.DisplayNames | null = null
/** « FR » → « France » (noms en français) */
export function countryName(code: string): string {
  const c = code.toUpperCase()
  try {
    regionNames ??= new Intl.DisplayNames(['fr'], { type: 'region' })
    return regionNames.of(c) ?? c
  } catch { return c }
}

/** Régions françaises (codes ISO 3166-2 que donne Vercel) */
const FR_REGIONS: Record<string, string> = {
  ARA: 'Auvergne-Rhône-Alpes', BFC: 'Bourgogne-Franche-Comté', BRE: 'Bretagne', CVL: 'Centre-Val de Loire',
  COR: 'Corse', '20R': 'Corse', GES: 'Grand Est', HDF: 'Hauts-de-France', IDF: 'Île-de-France', NOR: 'Normandie',
  NAQ: 'Nouvelle-Aquitaine', OCC: 'Occitanie', PDL: 'Pays de la Loire', PAC: "Provence-Alpes-Côte d'Azur",
  GP: 'Guadeloupe', MQ: 'Martinique', GF: 'Guyane', RE: 'La Réunion', YT: 'Mayotte',
}
const PT_REGIONS: Record<string, string> = {
  '01': 'Aveiro', '02': 'Beja', '03': 'Braga', '04': 'Bragança', '05': 'Castelo Branco', '06': 'Coimbra', '07': 'Évora',
  '08': 'Faro', '09': 'Guarda', '10': 'Leiria', '11': 'Lisbonne', '12': 'Portalegre', '13': 'Porto', '14': 'Santarém',
  '15': 'Setúbal', '16': 'Viana do Castelo', '17': 'Vila Real', '18': 'Viseu', '20': 'Açores', '30': 'Madère',
}

export function regionName(country: string | null | undefined, code: string): string {
  const c = (country ?? '').toUpperCase()
  if (c === 'FR') return FR_REGIONS[code.toUpperCase()] ?? code
  if (c === 'PT') return PT_REGIONS[code] ?? code
  return code
}

export type Granularity = 'day' | 'week' | 'month'

export function granularityFor(days: number): Granularity {
  if (days <= 31) return 'day'
  if (days <= 120) return 'week'
  return 'month'
}

/** Clé de regroupement d'une date (jour, lundi de la semaine, ou mois) */
export function bucketOf(iso: string, g: Granularity): string {
  const day = iso.slice(0, 10)
  if (g === 'day') return day
  if (g === 'month') return `${day.slice(0, 7)}-01`
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

/** Toutes les clés de la période, sans trou */
export function bucketKeys(start: string, end: string, g: Granularity): string[] {
  const keys: string[] = []
  let cur = bucketOf(start, g)
  const last = bucketOf(end, g)
  for (let i = 0; i < 500 && cur <= last; i++) {
    keys.push(cur)
    if (g === 'day') cur = addDays(cur, 1)
    else if (g === 'week') cur = addDays(cur, 7)
    else {
      const [y, m] = cur.split('-').map(Number)
      cur = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
    }
  }
  return keys
}

/** Date de Paris d'un horodatage (une visite à 23 h 30 UTC compte le lendemain en été) */
export function parisDay(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
}

export interface Share<T extends string = string> { key: T; label: string; count: number; pct: number }

function shares<T extends string>(counts: Map<T, number>, label: (k: T) => string, total: number): Share<T>[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: label(key), count, pct: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
}

function inc<T>(m: Map<T, number>, k: T) { m.set(k, (m.get(k) ?? 0) + 1) }

export interface VisitSummary {
  visitors: number
  views: number
  /** Temps moyen par visiteur (secondes), null si aucune mesure */
  avgSeconds: number | null
  series: Array<{ key: string; visitors: number; views: number }>
  sources: Share<SourceKind>[]
  sites: Share[]
  ai: Record<AiName, number>
  countries: Share[]
  regions: Share[]
  cities: Share[]
  devices: Share<DeviceKind>[]
  /** Visites qui portent pays / écran (mesurés depuis le 05/10/2026) */
  measured: number
}

/**
 * Résumé d'un ensemble de visites (une fiche, ou tout le site). Un visiteur
 * = une session ; sa provenance, son pays et son écran sont ceux de sa
 * première page vue dans l'ensemble.
 */
export function summarizeVisits(rows: VisitRow[], opts: { start: string; end: string; granularity: Granularity }): VisitSummary {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const first = new Map<string, VisitRow>()
  const sessionsByBucket = new Map<string, Set<string>>()
  const viewsByBucket = new Map<string, number>()
  const secondsBySession = new Map<string, number>()
  let measured = 0
  for (const r of sorted) {
    if (!first.has(r.session_id)) first.set(r.session_id, r)
    const key = bucketOf(parisDay(r.created_at), opts.granularity)
    if (!sessionsByBucket.has(key)) sessionsByBucket.set(key, new Set())
    sessionsByBucket.get(key)!.add(r.session_id)
    viewsByBucket.set(key, (viewsByBucket.get(key) ?? 0) + 1)
    if (r.duration_s && r.duration_s > 0) secondsBySession.set(r.session_id, (secondsBySession.get(r.session_id) ?? 0) + r.duration_s)
    if (r.device || r.country) measured++
  }

  const sources = new Map<SourceKind, number>()
  const sites = new Map<string, number>()
  const countries = new Map<string, number>()
  const regions = new Map<string, number>()
  const cities = new Map<string, number>()
  const devices = new Map<DeviceKind, number>()
  const ai = Object.fromEntries(AI_NAMES.map(n => [n, 0])) as Record<AiName, number>
  let geoTotal = 0, deviceTotal = 0
  for (const v of first.values()) {
    const s = sourceOf(v)
    inc(sources, s.kind)
    if (s.site && s.kind !== 'google') inc(sites, s.site)
    if (s.ai) ai[s.ai]++
    if (v.country) {
      geoTotal++
      inc(countries, v.country.toUpperCase())
      if (v.region) inc(regions, `${v.country.toUpperCase()}:${v.region}`)
      if (v.city) inc(cities, v.city)
    }
    if (v.device === 'mobile' || v.device === 'desktop' || v.device === 'tablet') { deviceTotal++; inc(devices, v.device) }
  }

  const durations = [...secondsBySession.values()]
  const visitors = first.size
  return {
    visitors,
    views: rows.length,
    avgSeconds: durations.length ? Math.round(durations.reduce((n, d) => n + d, 0) / durations.length) : null,
    series: bucketKeys(opts.start, opts.end, opts.granularity).map(key => ({
      key, visitors: sessionsByBucket.get(key)?.size ?? 0, views: viewsByBucket.get(key) ?? 0,
    })),
    sources: shares(sources, k => SOURCE_LABEL[k], visitors),
    sites: shares(sites, k => k, [...sites.values()].reduce((n, c) => n + c, 0)),
    ai,
    countries: shares(countries, countryName, geoTotal),
    regions: shares(regions, k => { const [c, r] = k.split(':'); return regionName(c, r) }, geoTotal),
    cities: shares(cities, k => k, geoTotal),
    devices: shares(devices, k => DEVICE_LABEL[k], deviceTotal),
    measured,
  }
}

/** « 45 s », « 2 min 05 » */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '–'
  if (seconds < 60) return `${seconds} s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m} min ${String(s).padStart(2, '0')}`
}

// ── Conseils pour les pros (« Ce qu'il faut retenir ») ───────────────────

export interface ProTakeawayInput {
  visitors: number
  demandes: number
  clicks: number
  googleImpressions: number
  googleFirstPage: number
  googleQueries: number
  bestNearly: { query: string; place: number } | null
  sources: Array<{ key: SourceKind; count: number }>
  mobilePct: number | null
  /** Jours depuis la mise en ligne de la fiche */
  ficheAgeDays: number | null
  metier: 'photographe' | 'menage'
}

export interface Takeaway { title: string; text: string; tone: 'ok' | 'tip' }

export function proTakeaways(i: ProTakeawayInput): Takeaway[] {
  const out: Takeaway[] = []
  const src = (k: SourceKind) => i.sources.find(s => s.key === k)?.count ?? 0
  const visual = i.metier === 'photographe' ? 'tes photos de portfolio' : 'ta présentation et tes zones d\'intervention'

  if (i.ficheAgeDays !== null && i.ficheAgeDays < 21 && i.visitors < 10) {
    out.push({ title: 'Ta fiche démarre', tone: 'tip', text: 'Google met souvent 2 à 4 semaines à montrer une nouvelle page. En attendant, partage le lien de ta fiche à tes clients et sur tes réseaux : chaque visite compte.' })
  }
  if (i.visitors >= 15 && i.demandes === 0) {
    out.push({ title: 'Des visites, pas encore de demande', tone: 'tip', text: `${i.visitors} personnes ont vu ta fiche sans t'écrire pour l'instant. Soigne ${visual} et indique un prix de départ : c'est ce qui décide un hôte qui hésite.` })
  }
  if (i.demandes > 0) {
    out.push({ title: 'Ta fiche t\'amène des clients', tone: 'ok', text: `${i.demandes} demande${i.demandes > 1 ? 's' : ''} sur la période. Réponds dans la journée : un hôte contacte souvent plusieurs pros.` })
  }
  if (i.bestNearly) {
    out.push({ title: 'Presque en première page', tone: 'tip', text: `Tu es ${i.bestNearly.place}e sur « ${i.bestNearly.query} ». Ajoute ce mot à ta présentation (ville, quartier, type de logement) pour passer devant.` })
  } else if (i.googleQueries > 0 && i.googleFirstPage > 0) {
    out.push({ title: 'Google te met en avant', tone: 'ok', text: `Ta fiche sort en première page sur ${i.googleFirstPage} recherche${i.googleFirstPage > 1 ? 's' : ''}. Garde-la à jour : Google favorise les pages vivantes.` })
  }
  if (i.visitors >= 5 && src('facebook') + src('instagram') + src('autre-reseau') === 0) {
    out.push({ title: 'Les groupes Facebook d\'hôtes', tone: 'tip', text: 'Aucune visite ne vient encore des réseaux sociaux. Partage ta fiche dans les groupes d\'hôtes et de conciergeries de ta région : c\'est là qu\'ils cherchent un pro.' })
  }
  if (i.mobilePct !== null && i.mobilePct >= 50) {
    out.push({ title: 'On te regarde sur téléphone', tone: 'tip', text: `${i.mobilePct} % des visiteurs sont sur téléphone : vérifie que ${visual} rendent bien sur un petit écran.` })
  }
  if (!out.length) {
    out.push({ title: 'Rien d\'alarmant', tone: 'ok', text: 'Ta fiche suit son cours. Reviens dans quelques semaines pour voir l\'évolution.' })
  }
  return out.slice(0, 4)
}
