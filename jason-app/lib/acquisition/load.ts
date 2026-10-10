// Chargement de la page admin « Liens & inscriptions » (service role, appelé
// après vérification du rôle admin). Tolère l'absence de la migration 126.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { isMissingRelation } from '@/lib/admin/health'
import { cleanAcquisition } from './rules'
import { buildProvenance, type CampaignVisitRow, type LinkClickRow, type LinkRow, type MemberRow, type ProvenanceReport, type SpaceKey } from './report'

export interface ProvenanceData { report: ProvenanceReport; missingMigration: boolean }

type ProfileRow = { id: string; full_name: string | null; email: string | null; created_at: string; role: string | null; is_investor: boolean | null; acquisition?: unknown }

async function allRows<T>(fetchPage: (from: number) => PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>): Promise<{ rows: T[]; error: { code?: string; message: string } | null }> {
  const rows: T[] = []
  for (let from = 0; from < 20_000; from += 1000) {
    const { data, error } = await fetchPage(from)
    if (error) return { rows, error }
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return { rows, error: null }
}

export async function loadProvenance(periodDays: number): Promise<ProvenanceData> {
  const db = getServiceClient()
  let missingMigration = false

  let profiles = await allRows<ProfileRow>(from => db.from('profiles').select('id, full_name, email, created_at, role, is_investor, acquisition').order('created_at').range(from, from + 999))
  if (profiles.error && isMissingRelation(profiles.error.code)) {
    missingMigration = true
    profiles = await allRows<ProfileRow>(from => db.from('profiles').select('id, full_name, email, created_at, role, is_investor').order('created_at').range(from, from + 999))
  }

  const [photographers, cleaners, linksRes, clicksRes] = await Promise.all([
    allRows<{ user_id: string | null }>(from => db.from('photographers').select('user_id').range(from, from + 999)),
    allRows<{ user_id: string | null }>(from => db.from('cleaners').select('user_id').range(from, from + 999)),
    db.from('tracked_links').select('id, code, label, channel, destination, archived, created_at').order('created_at', { ascending: false }),
    allRows<LinkClickRow>(from => db.from('tracked_link_clicks').select('code, created_at').order('id').range(from, from + 999)),
  ])
  if (linksRes.error && isMissingRelation(linksRes.error.code)) missingMigration = true
  const links = (linksRes.data ?? []) as LinkRow[]

  let visits: CampaignVisitRow[] = []
  if (links.length) {
    const { data } = await db.from('site_visits').select('session_id, utm_campaign').in('utm_campaign', links.map(l => l.code)).limit(20_000)
    visits = (data ?? []) as CampaignVisitRow[]
  }

  const photo = new Set(photographers.rows.map(r => r.user_id).filter(Boolean))
  const menage = new Set(cleaners.rows.map(r => r.user_id).filter(Boolean))
  const members: MemberRow[] = profiles.rows
    .filter(p => p.role !== 'admin')
    .map(p => {
      const spaces: SpaceKey[] = []
      if (photo.has(p.id)) spaces.push('photographe')
      if (menage.has(p.id)) spaces.push('menage')
      if (p.is_investor) spaces.push('investisseur')
      if (!spaces.length) spaces.push('hote')
      return { id: p.id, name: p.full_name?.trim() || p.email || 'Sans nom', created_at: p.created_at, acquisition: cleanAcquisition(p.acquisition), spaces }
    })

  const report = buildProvenance({ members, links, clicks: clicksRes.rows, visits, periodDays, now: new Date() })
  return { report, missingMigration }
}
