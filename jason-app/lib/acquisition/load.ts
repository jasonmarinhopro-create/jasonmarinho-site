// Chargement de la page admin « Provenance » (liens suivis, inscriptions,
// acquisition par canal) et du résumé de la Vue d'ensemble. Service role,
// appelé après vérification du rôle admin. Tolère l'absence de la migration 126
// et une panne de Google Search Console (bloc remplacé par un message).
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { isMissingRelation } from '@/lib/admin/health'
import { isPaidPro } from '@/lib/admin/revenue'
import { gscQuery, safeGsc } from '@/lib/google/search-analytics'
import { addDays, parisDay } from '@/lib/visibility/rules'
import { BUILTIN_LINKS, cleanAcquisition } from './rules'
import { buildProvenance, type LinkClickRow, type LinkRow, type MemberRow, type ProvenanceReport, type SpaceKey } from './report'
import { buildChannelCards, buildToday, buildSnapshot, type ChannelCard, type GscDay, type TodayData, type TrafficVisit } from './traffic'

type DbError = { code?: string; message: string }
type ProfileRow = { id: string; full_name: string | null; email: string | null; created_at: string; role: string | null; is_investor: boolean | null; plan: string | null; acquisition?: unknown }
type ProRow = { user_id: string | null; stripe_subscription_status: string | null }

async function allRows<T>(fetchPage: (from: number) => PromiseLike<{ data: T[] | null; error: DbError | null }>, max = 50_000): Promise<{ rows: T[]; error: DbError | null }> {
  const rows: T[] = []
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await fetchPage(from)
    if (error) return { rows, error }
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return { rows, error: null }
}

interface Base {
  members: Array<MemberRow & { paid: boolean }>
  links: LinkRow[]
  clicks: LinkClickRow[]
  visits: TrafficVisit[]
  gsc: GscDay[] | null
  gscError: string | null
  missingMigration: boolean
}

async function loadBase(opts: { visitDays: number; gscDays: number }): Promise<Base> {
  const db = getServiceClient()
  const today = parisDay(new Date().toISOString())
  let missingMigration = false

  const cols = 'id, full_name, email, created_at, role, is_investor, plan'
  const profilesP = (async () => {
    let r = await allRows<ProfileRow>(from => db.from('profiles').select(`${cols}, acquisition`).order('created_at').range(from, from + 999), 20_000)
    if (r.error && isMissingRelation(r.error.code)) {
      missingMigration = true
      r = await allRows<ProfileRow>(from => db.from('profiles').select(cols).order('created_at').range(from, from + 999), 20_000)
    }
    return r.rows
  })()
  const since = `${addDays(today, -opts.visitDays)}T00:00:00Z`
  const visitsP = allRows<TrafficVisit>(from => db.from('site_visits')
    .select('session_id, path, referrer, utm_source, utm_medium, utm_campaign, created_at')
    .gte('created_at', since).order('created_at').range(from, from + 999))
  const gscEnd = addDays(today, -1)
  const gscP = safeGsc(() => gscQuery({ startDate: addDays(gscEnd, -opts.gscDays), endDate: gscEnd, dimensions: ['date'] }))

  const [profiles, photographers, cleaners, linksRes, clicksRes, visitsRes, gscRes] = await Promise.all([
    profilesP,
    allRows<ProRow>(from => db.from('photographers').select('user_id, stripe_subscription_status').range(from, from + 999)),
    allRows<ProRow>(from => db.from('cleaners').select('user_id, stripe_subscription_status').range(from, from + 999)),
    db.from('tracked_links').select('id, code, label, channel, destination, archived, created_at').order('created_at', { ascending: false }),
    allRows<LinkClickRow>(from => db.from('tracked_link_clicks').select('code, created_at').order('id').range(from, from + 999)),
    visitsP,
    gscP,
  ])
  if (linksRes.error && isMissingRelation(linksRes.error.code)) missingMigration = true
  // Liens d'office (fiche Google, Instagram, prospection…) : ajoutés s'ils manquent
  let linkRows = (linksRes.data ?? []) as LinkRow[]
  if (!linksRes.error) {
    const have = new Set(linkRows.map(l => l.code))
    const missing = BUILTIN_LINKS.filter(l => !have.has(l.code))
    if (missing.length) {
      const { data: added } = await db.from('tracked_links')
        .upsert(missing.map(({ code, label, channel, destination }) => ({ code, label, channel, destination })), { onConflict: 'code', ignoreDuplicates: true })
        .select('id, code, label, channel, destination, archived, created_at')
      linkRows = [...linkRows, ...((added ?? []) as LinkRow[])]
    }
  }

  const photo = new Map<string, boolean>()
  const menage = new Map<string, boolean>()
  for (const r of photographers.rows) if (r.user_id) photo.set(r.user_id, (photo.get(r.user_id) ?? false) || isPaidPro(r))
  for (const r of cleaners.rows) if (r.user_id) menage.set(r.user_id, (menage.get(r.user_id) ?? false) || isPaidPro(r))

  const members = profiles
    .filter(p => p.role !== 'admin')
    .map(p => {
      const spaces: SpaceKey[] = []
      if (photo.has(p.id)) spaces.push('photographe')
      if (menage.has(p.id)) spaces.push('menage')
      if (p.is_investor) spaces.push('investisseur')
      if (!spaces.length) spaces.push('hote')
      const paid = p.plan === 'standard' || photo.get(p.id) === true || menage.get(p.id) === true
      return { id: p.id, name: p.full_name?.trim() || p.email || 'Sans nom', created_at: p.created_at, acquisition: cleanAcquisition(p.acquisition), spaces, paid }
    })

  const gsc = gscRes.ok ? gscRes.data.map(r => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })) : null
  return {
    members,
    links: linkRows,
    clicks: clicksRes.rows,
    visits: visitsRes.rows,
    gsc,
    gscError: gscRes.ok ? null : gscRes.error,
    missingMigration,
  }
}

export interface ProvenanceData {
  report: ProvenanceReport
  cards: ChannelCard[]
  today: TodayData
  period: { start: string; end: string; visitsFrom: string }
  gscError: string | null
  missingMigration: boolean
}

/** periodDays : 7, 30, 90, ou 0 pour « depuis le début » */
export async function loadProvenance(periodDays: number): Promise<ProvenanceData> {
  const today = parisDay(new Date().toISOString())
  // Visites gardées 100 jours : au-delà, seules les inscriptions et Google remontent plus loin
  const visitDays = Math.min(Math.max(periodDays || 100, 2), 100)
  const base = await loadBase({ visitDays, gscDays: periodDays ? periodDays + 16 : 480 })
  const start = periodDays ? addDays(today, -(periodDays - 1)) : '2020-01-01'
  const report = buildProvenance({ members: base.members, links: base.links, clicks: base.clicks, visits: base.visits, periodDays: periodDays || 36500, now: new Date() })
  const cards = buildChannelCards({ visits: base.visits, members: base.members, links: base.links, clicks: base.clicks, gsc: base.gsc, start, end: today })
  const todayData = buildToday({ visits: base.visits, members: base.members, links: base.links, clicks: base.clicks, gsc: base.gsc, now: new Date() })
  return {
    report, cards, today: todayData,
    period: { start, end: today, visitsFrom: addDays(today, -visitDays) },
    gscError: base.gscError, missingMigration: base.missingMigration,
  }
}

export type AcquisitionSnapshot = ReturnType<typeof buildSnapshot> & { gscError: string | null }

/** Résumé de la Vue d'ensemble admin : aujourd'hui et 7 jours */
export async function loadAcquisitionSnapshot(): Promise<AcquisitionSnapshot> {
  const base = await loadBase({ visitDays: 14, gscDays: 20 })
  return { ...buildSnapshot({ visits: base.visits, members: base.members, links: base.links, clicks: base.clicks, gsc: base.gsc, now: new Date() }), gscError: base.gscError }
}
