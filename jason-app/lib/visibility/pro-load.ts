// Chargement de « Mes statistiques » des pros (05/10/2026). Server-only.
//
// Accès (resolveProFiche) : le propriétaire voit sa fiche (lue avec son
// client, RLS « Pros read own … row »), l'admin voit n'importe quelle fiche
// avec ?id=. Les tables des pros (vues, clics, demandes) sont lues avec le
// client du propriétaire (RLS) ou le service role pour l'admin ; les visites
// du site (site_visits) ne s'ouvrent qu'au service role, d'où loadVisits,
// appelé seulement APRÈS cette vérification.
import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getAuthUser } from '@/lib/supabase/auth-user'
import { getProfile } from '@/lib/queries/profile'
import { gscQuery, safeGsc } from '@/lib/google/search-analytics'
import { loadGscQueryPages, loadVisits, SITE_ORIGIN } from './load'
import { cityLabel, cityPagePath, citySlugOf, internalReferrerPath } from './city-page'
import {
  aggregateQueries, GSC_LAG_DAYS, isFirstPage, proTakeaways, summarizeVisits,
  type VisitRow,
} from './rules'
import {
  avgSecondsPerVisitor, bestNearly, clickEventsOf, countByParisDay, dailySeries, daysBetween, DETAILS_SINCE,
  fairPct, lastBucketIncomplete, MONTHLY_OFF_FLAG, proPeriodRange, startedDuring, sumBetween, timeSeries,
  visitorSeries, visitsBetween, VIEWS_DAILY_SINCE, VISITS_SINCE,
  type MetricKey, type ProCityPage, type ProFicheInfo, type ProMetier, type ProMetric, type ProPeriod, type ProPeriodKey, type ProStatsData,
} from './pro-stats'

export const PRO_TABLE: Record<ProMetier, 'photographers' | 'cleaners'> = { photographe: 'photographers', menage: 'cleaners' }
export const PRO_DAILY_KIND: Record<ProMetier, 'photographer' | 'cleaner'> = { photographe: 'photographer', menage: 'cleaner' }
const CONTACTS: Record<ProMetier, { table: string; col: string }> = {
  photographe: { table: 'photographer_contacts', col: 'photographer_id' },
  menage: { table: 'cleaner_contacts', col: 'cleaner_id' },
}
const ANNUAIRE: Record<ProMetier, string> = { photographe: 'photographes', menage: 'menage' }

export const proStatsPath = (metier: ProMetier) => `/dashboard/ma-fiche-${metier === 'photographe' ? 'photographe' : 'menage'}/statistiques`
export const proFichePath = (metier: ProMetier, slug: string) => `/annuaires/${ANNUAIRE[metier]}/${slug}`
export const proPublicUrl = (metier: ProMetier, slug: string) => `${SITE_ORIGIN}${proFichePath(metier, slug)}`

const FICHE_COLUMNS = 'id, user_id, full_name, pseudo, ville, slug, status, is_public, created_at, validated_at, stripe_subscription_status, tier, views_count, contacts_count, instagram_clicks_count'
const EXTRA_CLICK_COLUMN: Record<ProMetier, string> = { photographe: 'portfolio_clicks_count', menage: 'site_clicks_count' }

export interface ProFicheRow {
  id: string
  user_id: string | null
  full_name: string | null
  pseudo: string | null
  ville: string | null
  slug: string | null
  status: string | null
  is_public: boolean | null
  created_at: string
  validated_at: string | null
  stripe_subscription_status: string | null
  tier: string | null
  views_count: number | null
  contacts_count: number | null
  instagram_clicks_count: number | null
  portfolio_clicks_count?: number | null
  site_clicks_count?: number | null
}

export type ResolvedFiche =
  | { status: 'login' }
  | { status: 'redirect'; to: string }
  | { status: 'none' }
  | { status: 'ok'; fiche: ProFicheRow; db: SupabaseClient; isAdminPreview: boolean; isAdmin: boolean }

/**
 * La fiche dont on montre les statistiques. `previewId` : aperçu admin
 * (refusé à un non-admin, renvoyé vers ses propres statistiques).
 */
export async function resolveProFiche(metier: ProMetier, previewId?: string | null): Promise<ResolvedFiche> {
  const user = await getAuthUser()
  if (!user) return { status: 'login' }
  const columns = `${FICHE_COLUMNS}, ${EXTRA_CLICK_COLUMN[metier]}`
  if (previewId) {
    const isAdmin = (await getProfile())?.role === 'admin'
    if (!isAdmin || !/^[0-9a-f-]{36}$/i.test(previewId)) return { status: 'redirect', to: proStatsPath(metier) }
    const db = getServiceClient()
    const { data } = await db.from(PRO_TABLE[metier]).select(columns).eq('id', previewId).maybeSingle()
    if (!data) return { status: 'none' }
    return { status: 'ok', fiche: data as unknown as ProFicheRow, db, isAdminPreview: true, isAdmin: true }
  }
  const db = await createClient()
  const { data } = await db.from(PRO_TABLE[metier]).select(columns).eq('user_id', user.id).maybeSingle()
  if (!data) return { status: 'none' }
  return { status: 'ok', fiche: data as unknown as ProFicheRow, db: db as unknown as SupabaseClient, isAdminPreview: false, isAdmin: false }
}

/** Fiche par son id, au service role : seulement après avoir vérifié l'admin */
export async function loadProFicheById(metier: ProMetier, id: string): Promise<ProFicheRow | null> {
  const { data } = await getServiceClient().from(PRO_TABLE[metier]).select(`${FICHE_COLUMNS}, ${EXTRA_CLICK_COLUMN[metier]}`).eq('id', id).maybeSingle()
  return (data as unknown as ProFicheRow | null) ?? null
}

export function ficheInfo(metier: ProMetier, f: ProFicheRow, today: string): ProFicheInfo {
  const onlineSince = (f.validated_at ?? f.created_at).slice(0, 10)
  const isActive = f.status === 'active'
  return {
    id: f.id,
    name: (f.pseudo || f.full_name || '').trim() || (metier === 'photographe' ? 'Ta fiche photographe' : 'Ta fiche ménage'),
    ville: f.ville,
    slug: f.slug,
    publicUrl: isActive && f.slug ? proPublicUrl(metier, f.slug) : null,
    isActive,
    onlineSince,
    ageDays: Math.max(0, daysBetween(onlineSince, today)),
  }
}

/** Promesse coupée au bout de `ms` (Google peut traîner : la page ne l'attend pas indéfiniment) */
export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} : pas de réponse en ${Math.round(ms / 1000)} s`)), ms)),
  ])
}

const sortByImpressionsDesc = <T extends { impressions: number }>(l: T[]) => [...l].sort((a, b) => b.impressions - a.impressions)

/** Totaux de Google jour par jour sur la période et celle d'avant (mêmes requêtes que loadGscDaily, donc même cache) */
async function gscDailyBoth(period: ProPeriod, url: string) {
  const page = { op: 'equals' as const, value: url }
  const [cur, prev] = await Promise.all([
    gscQuery({ startDate: period.start, endDate: period.end, dimensions: ['date'], page }),
    gscQuery({ startDate: period.prevStart, endDate: period.prevEnd, dimensions: ['date'], page }),
  ])
  return [...cur, ...prev].map(r => ({ day: r.keys[0], impressions: r.impressions, clicks: r.clicks }))
}

export interface LoadOptions {
  metier: ProMetier
  fiche: ProFicheRow
  db: SupabaseClient
  periodKey: ProPeriodKey
  today: string
  isAdminPreview: boolean
  isAdmin: boolean
  /** Période imposée (bilan mensuel : le mois civil écoulé) */
  period?: ProPeriod
  /** Période Google différente (fiche membre de l'admin : 28 jours) */
  googlePeriod?: ProPeriod
  /** Délai accordé à Google */
  googleTimeoutMs?: number
  /** Ne pas lire l'état du bilan mensuel (aperçus) */
  skipReport?: boolean
}

/** Toutes les statistiques d'une fiche pour une période */
export async function loadProStats(o: LoadOptions): Promise<ProStatsData> {
  const { metier, fiche: f, db, today } = o
  const period = o.period ?? proPeriodRange(o.periodKey, today)
  const gp = o.googlePeriod ?? proPeriodRange(o.periodKey, today, GSC_LAG_DAYS)
  const info = ficheInfo(metier, f, today)
  const kind = PRO_DAILY_KIND[metier]
  const path = f.slug ? proFichePath(metier, f.slug) : null
  const url = f.slug ? proPublicUrl(metier, f.slug) : null
  const contacts = CONTACTS[metier]
  const service = getServiceClient()
  // Page de la ville du pro (06/10/2026)
  const citySlug = citySlugOf(f.ville)
  const cityPath = citySlug ? cityPagePath(metier, citySlug) : null
  const cityUrl = cityPath ? `${SITE_ORIGIN}${cityPath}` : null

  const [visitsRes, viewsRes, clicksRes, contactsRes, googleRes, reportRes, cityVisitsRes, cityGoogleRes] = await Promise.all([
    path
      ? loadVisits({ start: period.prevStart, end: period.end, path }).then(rows => ({ rows, error: null as string | null }), e => ({ rows: [] as VisitRow[], error: String((e as Error)?.message ?? e).slice(0, 200) }))
      : Promise.resolve({ rows: [] as VisitRow[], error: null as string | null }),
    db.from('pro_fiche_views_daily').select('day, views').eq('kind', kind).eq('pro_id', f.id).gte('day', period.prevStart).lte('day', period.end),
    db.from('pro_fiche_clicks_daily').select('day, event, clicks').eq('kind', kind).eq('pro_id', f.id).gte('day', period.prevStart).lte('day', period.end),
    db.from(contacts.table).select('created_at').eq(contacts.col, f.id).gte('created_at', `${period.prevStart}T00:00:00+02:00`).limit(5000),
    url
      ? safeGsc(() => withTimeout(Promise.all([loadGscQueryPages(gp, { op: 'equals', value: url }), gscDailyBoth(gp, url)]), o.googleTimeoutMs ?? 12_000, 'Google'))
      : Promise.resolve(null),
    o.skipReport || !f.user_id
      ? Promise.resolve({ data: null })
      : service.from('profiles').select('onboarding_completed_steps').eq('id', f.user_id).maybeSingle(),
    cityPath ? loadVisits({ start: period.prevStart, end: period.end, path: cityPath }).catch(() => null) : Promise.resolve(null),
    cityUrl
      ? safeGsc(() => withTimeout(Promise.all([loadGscQueryPages(gp, { op: 'equals', value: cityUrl }), gscDailyBoth(gp, cityUrl)]), o.googleTimeoutMs ?? 12_000, 'Google'))
      : Promise.resolve(null),
  ])

  // ── Visites ──
  const visits = visitsRes.rows
  const curVisits = visitsBetween(visits, period.start, period.end)
  const prevVisits = visitsBetween(visits, period.prevStart, period.prevEnd)
  const summary = summarizeVisits(curVisits, { start: period.start, end: period.end, granularity: period.granularity })
  const prevVisitors = new Set(prevVisits.map(v => v.session_id)).size
  const g = period.granularity
  const incomplete = lastBucketIncomplete(period.end, g)
  const visitsPrevOk = VISITS_SINCE <= period.prevStart
  const detailsPrevOk = DETAILS_SINCE <= period.prevStart

  // ── Vues (table par jour, sinon rien) ──
  const viewRows = (viewsRes.error ? [] : (viewsRes.data ?? []) as Array<{ day: string; views: number }>).map(r => ({ day: r.day, value: r.views }))
  const viewsPrevOk = VIEWS_DAILY_SINCE <= period.prevStart

  // ── Clics (table de la migration 123, sinon cumul) ──
  const clicksDaily = !clicksRes.error
  const clickRows = (clicksDaily ? (clicksRes.data ?? []) : []) as Array<{ day: string; event: string; clicks: number }>
  const events = clickEventsOf(metier)
  const clickAll = clickRows.filter(r => events.some(e => e.key === r.event)).map(r => ({ day: r.day, value: r.clicks }))

  // ── Demandes ──
  // Demandes connues depuis la création de la fiche : l'écart est toujours juste
  const contactRows = countByParisDay(((contactsRes.data ?? []) as Array<{ created_at: string }>).map(r => r.created_at))

  // ── Google ──
  let google: ProStatsData['google'] = { status: 'empty', adminError: null, clicks: 0, impressions: 0, prevImpressions: 0, pct: null, queries: [], firstPage: 0 }
  let googleSeries: ProMetric['series'] = null
  if (googleRes && googleRes.ok) {
    const [qp, daily] = googleRes.data
    const queries = aggregateQueries(qp.cur, qp.prev)
    const impressions = sumBetween(daily.map(d => ({ day: d.day, value: d.impressions })), gp.start, gp.end)
    const prevImpressions = sumBetween(daily.map(d => ({ day: d.day, value: d.impressions })), gp.prevStart, gp.prevEnd)
    const clicks = sumBetween(daily.map(d => ({ day: d.day, value: d.clicks })), gp.start, gp.end)
    google = {
      status: impressions > 0 || queries.length > 0 ? 'ok' : 'empty',
      adminError: null,
      clicks,
      impressions,
      prevImpressions,
      pct: fairPct(impressions, prevImpressions, null, gp.prevStart),
      queries,
      firstPage: queries.filter(q => isFirstPage(q.position)).length,
    }
    googleSeries = dailySeries(daily.map(d => ({ day: d.day, value: d.impressions })), gp, { withPrev: true })
  } else if (googleRes && !googleRes.ok) {
    google = { ...google, status: 'error', adminError: o.isAdmin ? googleRes.error : null }
  }

  const metric = (key: MetricKey, m: Omit<ProMetric, 'key' | 'granularity' | 'incompleteLast'> & { granularity?: ProMetric['granularity']; incompleteLast?: boolean }): ProMetric => ({
    key, granularity: m.granularity ?? g, incompleteLast: m.incompleteLast ?? incomplete, ...m,
  })

  const viewsCur = sumBetween(viewRows, period.start, period.end)
  const viewsPrev = sumBetween(viewRows, period.prevStart, period.prevEnd)
  const clicksCur = sumBetween(clickAll, period.start, period.end)
  const clicksPrev = sumBetween(clickAll, period.prevStart, period.prevEnd)
  const demCur = sumBetween(contactRows, period.start, period.end)
  const demPrev = sumBetween(contactRows, period.prevStart, period.prevEnd)
  const timeCur = avgSecondsPerVisitor(curVisits)
  const timePrev = avgSecondsPerVisitor(prevVisits)

  const metrics: Record<MetricKey, ProMetric> = {
    visitors: metric('visitors', {
      value: summary.visitors, prev: visitsPrevOk ? prevVisitors : null, pct: fairPct(summary.visitors, prevVisitors, VISITS_SINCE, period.prevStart),
      series: visitorSeries(visits, period, { withPrev: visitsPrevOk }), since: startedDuring(VISITS_SINCE, period.start) ? VISITS_SINCE : null,
    }),
    views: metric('views', {
      value: viewsCur, prev: viewsPrevOk ? viewsPrev : null, pct: fairPct(viewsCur, viewsPrev, VIEWS_DAILY_SINCE, period.prevStart),
      series: dailySeries(viewRows, period, { withPrev: viewsPrevOk }), since: startedDuring(VIEWS_DAILY_SINCE, period.start) ? VIEWS_DAILY_SINCE : null,
    }),
    time: metric('time', {
      value: timeCur, prev: detailsPrevOk ? timePrev : null,
      pct: timeCur !== null && timePrev !== null ? fairPct(timeCur, timePrev, DETAILS_SINCE, period.prevStart) : null,
      series: timeSeries(visits, period, { withPrev: detailsPrevOk }), since: startedDuring(DETAILS_SINCE, period.start) ? DETAILS_SINCE : null,
    }),
    clicks: metric('clicks', {
      value: clicksDaily ? clicksCur : null, prev: clicksDaily && detailsPrevOk ? clicksPrev : null,
      pct: clicksDaily ? fairPct(clicksCur, clicksPrev, DETAILS_SINCE, period.prevStart) : null,
      series: clicksDaily ? dailySeries(clickAll, period, { withPrev: detailsPrevOk }) : null,
      since: startedDuring(DETAILS_SINCE, period.start) ? DETAILS_SINCE : null,
    }),
    demandes: metric('demandes', {
      value: demCur, prev: demPrev, pct: fairPct(demCur, demPrev, null, period.prevStart),
      series: dailySeries(contactRows, period, { withPrev: true }), since: null,
    }),
    google: metric('google', {
      value: google.status === 'error' ? null : google.impressions, prev: google.status === 'error' ? null : google.prevImpressions, pct: google.pct,
      series: googleSeries, since: null, granularity: gp.granularity, incompleteLast: lastBucketIncomplete(gp.end, gp.granularity),
    }),
  }

  const mobile = summary.devices.find(d => d.key === 'mobile')
  const deviceTotal = summary.devices.reduce((n, d) => n + d.count, 0)
  const takeaways = proTakeaways({
    visitors: summary.visitors,
    demandes: demCur,
    clicks: clicksCur,
    googleImpressions: google.impressions,
    googleFirstPage: google.firstPage,
    googleQueries: google.queries.length,
    bestNearly: bestNearly(google.queries),
    sources: summary.sources.map(s => ({ key: s.key, count: s.count })),
    mobilePct: deviceTotal >= 5 ? (mobile?.pct ?? 0) : null,
    ficheAgeDays: info.ageDays,
    metier,
  })

  const clickCum = (key: 'portfolio' | 'site' | 'instagram') =>
    key === 'instagram' ? (f.instagram_clicks_count ?? 0) : key === 'portfolio' ? (f.portfolio_clicks_count ?? 0) : (f.site_clicks_count ?? 0)
  const steps = ((reportRes.data as { onboarding_completed_steps?: string[] | null } | null)?.onboarding_completed_steps) ?? []

  // ── Page de la ville ──
  let cityPage: ProCityPage | null = null
  if (citySlug && cityPath && cityUrl) {
    const rows = cityVisitsRes ?? []
    const cur = visitsBetween(rows, period.start, period.end)
    const prevRows = visitsBetween(rows, period.prevStart, period.prevEnd)
    const cityVisitors = new Set(cur.map(v => v.session_id)).size
    const cityPrev = new Set(prevRows.map(v => v.session_id)).size
    let cg: ProCityPage['google'] = { status: 'empty', clicks: 0, impressions: 0, position: null, queries: [] }
    if (cityGoogleRes && cityGoogleRes.ok) {
      const [qp, daily] = cityGoogleRes.data
      const inPeriod = daily.filter(d => d.day >= gp.start && d.day <= gp.end)
      const impressions = inPeriod.reduce((n, d) => n + d.impressions, 0)
      const queries = sortByImpressionsDesc(aggregateQueries(qp.cur, qp.prev))
      const weighted = queries.reduce((n, q) => n + q.position * q.impressions, 0)
      const qImp = queries.reduce((n, q) => n + q.impressions, 0)
      cg = {
        status: impressions > 0 || queries.length > 0 ? 'ok' : 'empty',
        clicks: inPeriod.reduce((n, d) => n + d.clicks, 0),
        impressions,
        position: qImp ? Math.round((weighted / qImp) * 10) / 10 : null,
        queries: queries.slice(0, 8),
      }
    } else if (cityGoogleRes && !cityGoogleRes.ok) {
      cg = { ...cg, status: 'error' }
    }
    cityPage = {
      slug: citySlug,
      label: cityLabel(citySlug),
      path: cityPath,
      url: cityUrl,
      listed: info.isActive,
      visitors: cityVisitors,
      prevVisitors: visitsPrevOk ? cityPrev : null,
      pct: fairPct(cityVisitors, cityPrev, VISITS_SINCE, period.prevStart),
      pageViews: cur.length,
      toFiche: new Set(curVisits.filter(v => internalReferrerPath(v.referrer) === cityPath).map(v => v.session_id)).size,
      google: cg,
    }
  }

  return {
    metier,
    fiche: info,
    isAdminPreview: o.isAdminPreview,
    today,
    period,
    googlePeriod: gp,
    metrics,
    visits: {
      visitors: summary.visitors,
      sources: summary.sources,
      sites: summary.sites,
      countries: summary.countries,
      regions: summary.regions,
      cities: summary.cities,
      devices: summary.devices,
      measured: summary.measured,
      detailsSince: startedDuring(DETAILS_SINCE, period.start) ? DETAILS_SINCE : null,
      adminError: o.isAdmin ? visitsRes.error : null,
    },
    google,
    clicks: {
      daily: clicksDaily,
      items: events.map(e => {
        const rows = clickRows.filter(r => r.event === e.key).map(r => ({ day: r.day, value: r.clicks }))
        const cur = sumBetween(rows, period.start, period.end)
        return { ...e, value: cur, pct: fairPct(cur, sumBetween(rows, period.prevStart, period.prevEnd), DETAILS_SINCE, period.prevStart) }
      }),
      cumulative: events.map(e => ({ ...e, value: clickCum(e.key) })),
      demandes: demCur,
      demandesPct: metrics.demandes.pct,
    },
    takeaways,
    monthlyReport: { on: !steps.includes(MONTHLY_OFF_FLAG), canEdit: !o.isAdminPreview },
    cityPage,
  }
}
