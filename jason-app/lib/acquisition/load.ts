// Chargement de la page admin « Provenance » (liens suivis, inscriptions,
// acquisition par canal) et du résumé de la Vue d'ensemble. Service role,
// appelé après vérification du rôle admin. Tolère l'absence de la migration 126
// et une panne de Google Search Console (bloc remplacé par un message).
import 'server-only'
import { revalidateTag, unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'
import { isMissingRelation } from '@/lib/admin/health'
import { isPaidPro } from '@/lib/admin/revenue'
import { gscQuery, safeGsc } from '@/lib/google/search-analytics'
import { addDays, parisDay } from '@/lib/visibility/rules'
import { BUILTIN_LINKS, cleanAcquisition } from './rules'
import { buildProvenance, type LinkClickRow, type LinkRow, type MemberRow, type ProvenanceReport, type SpaceKey } from './report'
import { buildChannelCards, buildToday, buildSnapshot, type ChannelCard, type GscDay, type TodayData, type TrafficVisit } from './traffic'

import { allRows } from '@/lib/supabase/all-rows'
type ProfileRow = { id: string; full_name: string | null; email: string | null; created_at: string; role: string | null; is_investor: boolean | null; plan: string | null; acquisition?: unknown }
type ProRow = { user_id: string | null; stripe_subscription_status: string | null }


interface Base {
  members: Array<MemberRow & { paid: boolean }>
  links: LinkRow[]
  clicks: LinkClickRow[]
  visits: TrafficVisit[]
  gsc: GscDay[] | null
  gscError: string | null
  missingMigration: boolean
}

// 10/11/2026 (Jason : « la page Provenance consomme énormément ») :
// - une seule lecture (fonction SQL acquisition_base, migration 183) au lieu
//   de 6 tables dont les visites par pages de 1 000 ;
// - toujours 100 jours de visites, partagés par toutes les périodes et par la
//   carte de la Vue d'ensemble, puis filtrés ici à la fenêtre demandée (mêmes
//   chiffres qu'avant : une visite plus ancienne que la fenêtre n'est jamais vue) ;
// - gardée 2 minutes pour tous les rendus (cache Next partagé entre les
//   instances) et 60 s en mémoire ; vidée par invalidateAcquisitionCache()
//   quand un lien suivi est créé ou archivé.
// Google Search Console est lu à part (déjà gardé 6 h par gscQuery).
const MAX_VISIT_DAYS = 100
const RAW_TTL_MS = 60_000
let rawMemo: { at: number; p: Promise<Raw> } | null = null
export function invalidateAcquisitionCache() {
  rawMemo = null
  try { revalidateTag('acquisition-base') } catch { /* hors d'une action : rien à vider */ }
}

interface Raw {
  members: Array<MemberRow & { paid: boolean }>
  links: LinkRow[]
  clicks: LinkClickRow[]
  visits: TrafficVisit[]
  missingMigration: boolean
}

function loadRaw(): Promise<Raw> {
  if (rawMemo && Date.now() - rawMemo.at < RAW_TTL_MS) return rawMemo.p
  const p = loadRawShared()
  rawMemo = { at: Date.now(), p }
  // Un échec ne reste pas en mémoire
  p.catch(() => { if (rawMemo?.p === p) rawMemo = null })
  return p
}

async function loadRawShared(): Promise<Raw> {
  const today = parisDay(new Date().toISOString())
  const since = `${addDays(today, -MAX_VISIT_DAYS)}T00:00:00Z`
  return (await loadRawFast(since)) ?? loadRawLegacy(since)
}

// Réponse compacte de la base gardée telle quelle (≈1 Mo au 10/11/2026 ; le
// cache Next refuse au-delà de 2 Mo sans rien casser : on relit alors à chaque fois)
const compactBase = unstable_cache(async (since: string) => {
  const { data, error } = await getServiceClient().rpc('acquisition_base', { p_since: since })
  if (error || !data) throw new Error(error?.message ?? 'acquisition_base vide')
  return data as unknown
}, ['acquisition-base-v1'], { revalidate: 120, tags: ['acquisition-base'] })

async function loadBase(opts: { visitDays: number; gscDays: number }): Promise<Base> {
  const today = parisDay(new Date().toISOString())
  const gscEnd = addDays(today, -1)
  const [raw, gscRes] = await Promise.all([
    loadRaw(),
    safeGsc(() => gscQuery({ startDate: addDays(gscEnd, -opts.gscDays), endDate: gscEnd, dimensions: ['date'] })),
  ])
  const since = `${addDays(today, -Math.min(opts.visitDays, MAX_VISIT_DAYS))}T00:00:00Z`
  const gsc = gscRes.ok ? gscRes.data.map(r => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })) : null
  return {
    members: raw.members,
    links: raw.links,
    clicks: raw.clicks,
    visits: raw.visits.filter(v => v.created_at >= since),
    gsc,
    gscError: gscRes.ok ? null : gscRes.error,
    missingMigration: raw.missingMigration,
  }
}

function membersFrom(profiles: ProfileRow[], photographers: ProRow[], cleaners: ProRow[]): Array<MemberRow & { paid: boolean }> {
  const photo = new Map<string, boolean>()
  const menage = new Map<string, boolean>()
  for (const r of photographers) if (r.user_id) photo.set(r.user_id, (photo.get(r.user_id) ?? false) || isPaidPro(r))
  for (const r of cleaners) if (r.user_id) menage.set(r.user_id, (menage.get(r.user_id) ?? false) || isPaidPro(r))
  return profiles
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
}

/** Liens d'office (fiche Google, Instagram, prospection…) : ajoutés s'ils manquent */
async function withBuiltinLinks(linkRows: LinkRow[]): Promise<LinkRow[]> {
  const have = new Set(linkRows.map(l => l.code))
  const missing = BUILTIN_LINKS.filter(l => !have.has(l.code))
  if (!missing.length) return linkRows
  const { data: added } = await getServiceClient().from('tracked_links')
    .upsert(missing.map(({ code, label, channel, destination }) => ({ code, label, channel, destination })), { onConflict: 'code', ignoreDuplicates: true })
    .select('id, code, label, channel, destination, archived, created_at')
  return [...linkRows, ...((added ?? []) as LinkRow[])]
}

/** Un seul appel (migration 183). null si la fonction n'existe pas encore. */
async function loadRawFast(since: string): Promise<Raw | null> {
  let data: unknown
  try { data = await compactBase(since) } catch { return null }
  type S = string | null
  const r = data as {
    profiles: ProfileRow[]
    photographers: Array<[string, S]>
    cleaners: Array<[string, S]>
    links: LinkRow[]
    clicks: Array<[string, string]>
    visits: Array<[string, string, S, S, S, S, string]>
  }
  const pro = (rows: Array<[string, S]>): ProRow[] => rows.map(([user_id, stripe_subscription_status]) => ({ user_id, stripe_subscription_status }))
  return {
    members: membersFrom(r.profiles, pro(r.photographers), pro(r.cleaners)),
    links: await withBuiltinLinks(r.links),
    clicks: r.clicks.map(([code, created_at]) => ({ code, created_at })),
    visits: r.visits.map(([session_id, path, referrer, utm_source, utm_medium, utm_campaign, created_at]) => ({ session_id, path, referrer, utm_source, utm_medium, utm_campaign, created_at })),
    missingMigration: false,
  }
}

/** Ancien chargement, table par table (migration 183 pas encore appliquée). */
async function loadRawLegacy(since: string): Promise<Raw> {
  const db = getServiceClient()
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
  const visitsP = allRows<TrafficVisit>(from => db.from('site_visits')
    .select('session_id, path, referrer, utm_source, utm_medium, utm_campaign, created_at')
    .gte('created_at', since).order('created_at').range(from, from + 999))

  const [profiles, photographers, cleaners, linksRes, clicksRes, visitsRes] = await Promise.all([
    profilesP,
    allRows<ProRow>(from => db.from('photographers').select('user_id, stripe_subscription_status').range(from, from + 999)),
    allRows<ProRow>(from => db.from('cleaners').select('user_id, stripe_subscription_status').range(from, from + 999)),
    db.from('tracked_links').select('id, code, label, channel, destination, archived, created_at').order('created_at', { ascending: false }),
    allRows<LinkClickRow>(from => db.from('tracked_link_clicks').select('code, created_at').order('id').range(from, from + 999)),
    visitsP,
  ])
  if (linksRes.error && isMissingRelation(linksRes.error.code)) missingMigration = true
  const links = linksRes.error ? ((linksRes.data ?? []) as LinkRow[]) : await withBuiltinLinks((linksRes.data ?? []) as LinkRow[])
  return {
    members: membersFrom(profiles, photographers.rows, cleaners.rows),
    links,
    clicks: clicksRes.rows,
    visits: visitsRes.rows,
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
