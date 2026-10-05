// « Mes statistiques » des pros (photographes, équipes de ménage), 05/10/2026.
// Règles pures (testées, pro-stats.test.ts) : périodes, séries jour /
// semaine / mois avec la période d'avant superposée, dates depuis
// lesquelles chaque chiffre est mesuré, recherches Google par place.
// Les chargements sont dans pro-load.ts (server-only).

import {
  addDays, bucketKeys, bucketOf, granularityFor, pctChange, parisDay, placeOf,
  type Granularity, type SearchStat, type VisitRow,
} from './rules'

// ── Périodes de la page ───────────────────────────────────────────────────

export type ProPeriodKey = '28j' | '3m' | '12m'

/** Clés reprises de la page Visibilité ; « 28j » couvre bien 30 jours ici (libellé exact) */
export const PRO_PERIODS: Array<{ key: ProPeriodKey; label: string; short: string; days: number }> = [
  { key: '28j', label: '30 derniers jours', short: '30 jours', days: 30 },
  { key: '3m', label: '3 mois', short: '3 mois', days: 90 },
  { key: '12m', label: '12 mois', short: '12 mois', days: 365 },
]

export function parseProPeriod(v: string | null | undefined): ProPeriodKey {
  return PRO_PERIODS.some(p => p.key === v) ? (v as ProPeriodKey) : '28j'
}

export interface ProPeriod {
  key: ProPeriodKey
  label: string
  days: number
  start: string
  end: string
  prevStart: string
  prevEnd: string
  granularity: Granularity
}

/** Période qui finit `lagDays` avant aujourd'hui (Google : 2 jours), et celle d'avant */
export function proPeriodRange(key: ProPeriodKey, today: string, lagDays = 0): ProPeriod {
  const p = PRO_PERIODS.find(x => x.key === key) ?? PRO_PERIODS[0]
  const end = addDays(today, -lagDays)
  const start = addDays(end, -(p.days - 1))
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -(p.days - 1))
  return { key: p.key, label: p.label, days: p.days, start, end, prevStart, prevEnd, granularity: granularityFor(p.days) }
}

// ── Depuis quand chaque chiffre existe ────────────────────────────────────

/** Visites du site (table site_visits, migration 20260919_105) */
export const VISITS_SINCE = '2026-09-19'
/** Vues par jour des fiches (pro_fiche_views_daily, migration 20260927_110) */
export const VIEWS_DAILY_SINCE = '2026-09-27'
/** Pays, région, ville, écran, temps de lecture, clics par jour (migration 20261005_123) */
export const DETAILS_SINCE = '2026-10-05'

/** « 5 octobre 2026 » */
export function frenchDate(iso: string, opts: { year?: boolean } = {}): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', ...(opts.year === false ? {} : { year: 'numeric' }), timeZone: 'Europe/Paris' })
}

/**
 * Écart en % seulement si le chiffre était déjà mesuré au début de la
 * période d'avant (sinon « +400 % » ne voudrait rien dire).
 */
export function fairPct(cur: number, prev: number, since: string | null, prevStart: string): number | null {
  if (since && since > prevStart) return null
  return pctChange(cur, prev)
}

/** Le chiffre a commencé à être mesuré pendant la période affichée */
export const startedDuring = (since: string | null, start: string) => !!since && since > start

// ── Séries ────────────────────────────────────────────────────────────────

export interface SeriesPoint {
  key: string
  cur: number
  /** Même moment de la période d'avant (null si pas mesuré) */
  prev: number | null
}

/**
 * Additionne des valeurs datées (jour AAAA-MM-JJ) par jour, semaine ou mois.
 * La période d'avant est décalée de sa durée pour se superposer exactement.
 */
export function dailySeries(
  rows: Array<{ day: string; value: number }>,
  period: Pick<ProPeriod, 'start' | 'end' | 'prevStart' | 'prevEnd' | 'days' | 'granularity'>,
  opts: { withPrev: boolean },
): SeriesPoint[] {
  const keys = bucketKeys(period.start, period.end, period.granularity)
  const cur = new Map<string, number>()
  const prev = new Map<string, number>()
  for (const r of rows) {
    const day = r.day.slice(0, 10)
    if (day >= period.start && day <= period.end) {
      const k = bucketOf(day, period.granularity)
      cur.set(k, (cur.get(k) ?? 0) + r.value)
    } else if (day >= period.prevStart && day <= period.prevEnd) {
      const k = bucketOf(addDays(day, period.days), period.granularity)
      prev.set(k, (prev.get(k) ?? 0) + r.value)
    }
  }
  return keys.map(key => ({ key, cur: cur.get(key) ?? 0, prev: opts.withPrev ? (prev.get(key) ?? 0) : null }))
}

/** Somme d'une période (jours inclus) */
export function sumBetween(rows: Array<{ day: string; value: number }>, start: string, end: string): number {
  return rows.reduce((n, r) => (r.day.slice(0, 10) >= start && r.day.slice(0, 10) <= end ? n + r.value : n), 0)
}

/** Horodatages (demandes reçues) → une ligne par jour de Paris */
export function countByParisDay(timestamps: string[]): Array<{ day: string; value: number }> {
  const m = new Map<string, number>()
  for (const t of timestamps) {
    const d = parisDay(t)
    m.set(d, (m.get(d) ?? 0) + 1)
  }
  return [...m.entries()].map(([day, value]) => ({ day, value }))
}

/** Visites : jour de Paris d'une visite */
const visitDay = (v: VisitRow) => parisDay(v.created_at)

/** Visiteurs (sessions distinctes) par jour / semaine / mois, avec la période d'avant superposée */
export function visitorSeries(rows: VisitRow[], period: Pick<ProPeriod, 'start' | 'end' | 'prevStart' | 'prevEnd' | 'days' | 'granularity'>, opts: { withPrev: boolean }): SeriesPoint[] {
  const keys = bucketKeys(period.start, period.end, period.granularity)
  const cur = new Map<string, Set<string>>()
  const prev = new Map<string, Set<string>>()
  for (const v of rows) {
    const day = visitDay(v)
    let target: Map<string, Set<string>> | null = null
    let k = ''
    if (day >= period.start && day <= period.end) { target = cur; k = bucketOf(day, period.granularity) }
    else if (day >= period.prevStart && day <= period.prevEnd) { target = prev; k = bucketOf(addDays(day, period.days), period.granularity) }
    if (!target) continue
    if (!target.has(k)) target.set(k, new Set())
    target.get(k)!.add(v.session_id)
  }
  return keys.map(key => ({ key, cur: cur.get(key)?.size ?? 0, prev: opts.withPrev ? (prev.get(key)?.size ?? 0) : null }))
}

/** Temps de lecture moyen par visiteur (secondes) sur un ensemble de visites, null sans mesure */
export function avgSecondsPerVisitor(rows: VisitRow[]): number | null {
  const bySession = new Map<string, number>()
  for (const v of rows) if (v.duration_s && v.duration_s > 0) bySession.set(v.session_id, (bySession.get(v.session_id) ?? 0) + v.duration_s)
  if (!bySession.size) return null
  return Math.round([...bySession.values()].reduce((n, s) => n + s, 0) / bySession.size)
}

/** Temps moyen par visiteur, par jour / semaine / mois (0 quand rien n'est mesuré) */
export function timeSeries(rows: VisitRow[], period: Pick<ProPeriod, 'start' | 'end' | 'prevStart' | 'prevEnd' | 'days' | 'granularity'>, opts: { withPrev: boolean }): SeriesPoint[] {
  const keys = bucketKeys(period.start, period.end, period.granularity)
  const cur = new Map<string, VisitRow[]>()
  const prev = new Map<string, VisitRow[]>()
  for (const v of rows) {
    const day = visitDay(v)
    if (day >= period.start && day <= period.end) {
      const k = bucketOf(day, period.granularity)
      cur.set(k, [...(cur.get(k) ?? []), v])
    } else if (day >= period.prevStart && day <= period.prevEnd) {
      const k = bucketOf(addDays(day, period.days), period.granularity)
      prev.set(k, [...(prev.get(k) ?? []), v])
    }
  }
  return keys.map(key => ({
    key,
    cur: avgSecondsPerVisitor(cur.get(key) ?? []) ?? 0,
    prev: opts.withPrev ? (avgSecondsPerVisitor(prev.get(key) ?? []) ?? 0) : null,
  }))
}

/** Visites d'une période (jours de Paris inclus) */
export function visitsBetween(rows: VisitRow[], start: string, end: string): VisitRow[] {
  return rows.filter(v => { const d = visitDay(v); return d >= start && d <= end })
}

/**
 * Le dernier point couvre-t-il des jours pas encore passés (mois ou semaine
 * en cours) ? Il est alors tracé en pointillés.
 */
export function lastBucketIncomplete(end: string, g: Granularity): boolean {
  if (g === 'day') return false
  const next = addDays(end, 1)
  return bucketOf(next, g) === bucketOf(end, g)
}

/** Libellé court d'un point du graphique : « 5 oct. », « sem. du 6 oct. », « oct. 2026 » */
export function bucketLabel(key: string, g: Granularity, opts: { long?: boolean } = {}): string {
  const d = new Date(`${key}T12:00:00Z`)
  if (g === 'month') {
    return d.toLocaleDateString('fr-FR', { month: opts.long ? 'long' : 'short', year: opts.long ? 'numeric' : '2-digit', timeZone: 'Europe/Paris' })
  }
  const day = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })
  return g === 'week' ? (opts.long ? `semaine du ${day}` : day) : day
}

// ── Google ────────────────────────────────────────────────────────────────

export type GoogleTab = 'toutes' | 'premiere' | 'juste-apres' | 'plus-loin'

export const GOOGLE_TABS: Array<{ key: GoogleTab; label: string }> = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'premiere', label: 'En première page' },
  { key: 'juste-apres', label: 'Juste après (11e à 20e)' },
  { key: 'plus-loin', label: 'Plus loin' },
]

export function googleTabOf(position: number): Exclude<GoogleTab, 'toutes'> {
  const p = placeOf(position)
  if (p <= 10) return 'premiere'
  if (p <= 20) return 'juste-apres'
  return 'plus-loin'
}

export function filterGoogle(stats: SearchStat[], tab: GoogleTab): SearchStat[] {
  return tab === 'toutes' ? stats : stats.filter(s => googleTabOf(s.position) === tab)
}

/** Recherches classées par affichages (puis clics) : c'est ce qu'un pro regarde */
export function sortByImpressions(stats: SearchStat[]): SearchStat[] {
  return [...stats].sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.query.localeCompare(b.query))
}

/** Recherche principale : celle qui affiche le plus la fiche */
export function mainSearch(stats: SearchStat[]): SearchStat | null {
  return sortByImpressions(stats)[0] ?? null
}

/** Meilleure recherche « juste après la première page » (11e à 20e), la plus vue */
export function bestNearly(stats: SearchStat[]): { query: string; place: number } | null {
  const s = sortByImpressions(stats).find(x => googleTabOf(x.position) === 'juste-apres')
  return s ? { query: s.query, place: placeOf(s.position) } : null
}

/** Meilleure place obtenue (la plus haute), à égalité la recherche la plus vue */
export function bestPlaced(stats: SearchStat[]): SearchStat | null {
  return [...stats].sort((a, b) => placeOf(a.position) - placeOf(b.position) || b.impressions - a.impressions)[0] ?? null
}

// ── Écran ─────────────────────────────────────────────────────────────────

export function screenAdvice(metier: 'photographe' | 'menage', mobilePct: number | null): string {
  if (mobilePct === null) {
    return metier === 'photographe'
      ? 'La plupart des hôtes cherchent au téléphone : tes photos doivent y être belles.'
      : 'La plupart des hôtes cherchent au téléphone : ta présentation doit s\'y lire d\'un coup d\'œil.'
  }
  if (mobilePct >= 50) {
    return metier === 'photographe'
      ? `${mobilePct} % de tes visiteurs sont au téléphone : tes photos doivent y être belles, ouvre ta fiche sur le tien pour vérifier.`
      : `${mobilePct} % de tes visiteurs sont au téléphone : tes prix, tes zones et ton numéro doivent s'y lire d'un coup d'œil.`
  }
  return metier === 'photographe'
    ? 'Une bonne partie de tes visiteurs regarde sur ordinateur : un portfolio en grand format fait la différence.'
    : 'Une bonne partie de tes visiteurs regarde sur ordinateur : une présentation complète (prestations, délais, assurance) les rassure.'
}

/** Jours entiers entre deux dates AAAA-MM-JJ */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to.slice(0, 10)}T12:00:00Z`) - Date.parse(`${from.slice(0, 10)}T12:00:00Z`)) / 86_400_000)
}

// ── Données de la page (calculées côté serveur, passées aux vues) ─────────

export type ProMetier = 'photographe' | 'menage'
export type MetricKey = 'visitors' | 'views' | 'time' | 'clicks' | 'demandes' | 'google'

export interface ProMetric {
  key: MetricKey
  /** null : rien de mesuré sur la période */
  value: number | null
  prev: number | null
  pct: number | null
  series: SeriesPoint[] | null
  granularity: Granularity
  /** Date de début de la mesure, si elle tombe dans la période affichée */
  since: string | null
  incompleteLast: boolean
}

export interface ProFicheInfo {
  id: string
  name: string
  ville: string | null
  slug: string | null
  publicUrl: string | null
  isActive: boolean
  onlineSince: string
  ageDays: number
}

export interface ProShare { key: string; label: string; count: number; pct: number }

export interface ProStatsData {
  metier: ProMetier
  fiche: ProFicheInfo
  isAdminPreview: boolean
  today: string
  period: ProPeriod
  googlePeriod: ProPeriod
  metrics: Record<MetricKey, ProMetric>
  visits: {
    visitors: number
    sources: ProShare[]
    sites: ProShare[]
    countries: ProShare[]
    regions: ProShare[]
    cities: ProShare[]
    devices: ProShare[]
    /** Visites qui portent pays / écran */
    measured: number
    /** Pays, écran et temps mesurés depuis une date de la période */
    detailsSince: string | null
    /** Erreur de lecture (admin seulement) */
    adminError: string | null
  }
  google: {
    status: 'ok' | 'empty' | 'error'
    adminError: string | null
    clicks: number
    impressions: number
    prevImpressions: number
    pct: number | null
    queries: SearchStat[]
    firstPage: number
  }
  clicks: {
    /** Clics par jour disponibles (sinon : cumul depuis la création) */
    daily: boolean
    items: Array<{ key: 'portfolio' | 'site' | 'instagram'; label: string; value: number; pct: number | null }>
    cumulative: Array<{ key: 'portfolio' | 'site' | 'instagram'; label: string; value: number }>
    demandes: number
    demandesPct: number | null
  }
  takeaways: Array<{ title: string; text: string; tone: 'ok' | 'tip' }>
  monthlyReport: { on: boolean; canEdit: boolean }
}

/** Drapeaux du bilan mensuel (profiles.onboarding_completed_steps) */
export const MONTHLY_OFF_FLAG = 'mail:bilan-off'
export const monthlySentFlag = (month: string) => `mail:bilan-${month}`

/** Clics suivis sur une fiche selon le métier (pas de site pour les photographes : leur lien est le portfolio) */
export function clickEventsOf(metier: ProMetier): Array<{ key: 'portfolio' | 'site' | 'instagram'; label: string }> {
  return metier === 'photographe'
    ? [{ key: 'portfolio', label: 'Portfolio' }, { key: 'instagram', label: 'Instagram' }]
    : [{ key: 'site', label: 'Site internet' }, { key: 'instagram', label: 'Instagram' }]
}
