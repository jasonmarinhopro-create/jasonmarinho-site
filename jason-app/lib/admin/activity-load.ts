// Chargement de la dernière visite et de la dernière action des membres
// (service role, appelé seulement après vérification du rôle admin).
// Chaque source est indépendante : une table ou une colonne absente est ignorée.
import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'
import { buildMemberActivity, type ActivityKind, type ActivityRow, type MemberActivity } from './activity'

const SOURCES: Array<{ table: string; user: string; at: string; kind: ActivityKind }> = [
  { table: 'logements', user: 'user_id', at: 'created_at', kind: 'logement' },
  { table: 'ical_feeds', user: 'user_id', at: 'created_at', kind: 'calendrier' },
  { table: 'sejours', user: 'user_id', at: 'created_at', kind: 'sejour' },
  { table: 'voyageurs', user: 'user_id', at: 'created_at', kind: 'voyageur' },
  { table: 'contracts', user: 'user_id', at: 'created_at', kind: 'contrat' },
  { table: 'revenus_entries', user: 'user_id', at: 'created_at', kind: 'revenu' },
  { table: 'calendar_events', user: 'user_id', at: 'created_at', kind: 'evenement' },
  { table: 'chez_nous_posts', user: 'author_id', at: 'created_at', kind: 'question' },
  { table: 'chez_nous_replies', user: 'author_id', at: 'created_at', kind: 'reponse' },
  { table: 'user_formations', user: 'user_id', at: 'enrolled_at', kind: 'formation' },
  { table: 'audit_gbp_sessions', user: 'user_id', at: 'started_at', kind: 'audit' },
]

/** userIds : un seul membre (fiche) ou tous (liste) */
export async function loadMemberActivity(userIds?: string[]): Promise<Map<string, MemberActivity>> {
  const db = getServiceClient()
  const one = userIds?.length === 1 ? userIds[0] : null

  const sourceRows = SOURCES.map(async (src): Promise<ActivityRow[]> => {
    try {
      let q = db.from(src.table).select(`${src.user}, ${src.at}`).not(src.at, 'is', null)
      if (userIds) q = q.in(src.user, userIds)
      const { data, error } = await q.order(src.at, { ascending: false }).limit(one ? 1 : 5000)
      if (error) return []
      return ((data ?? []) as unknown as Array<Record<string, string>>)
        .map(r => ({ userId: r[src.user], at: r[src.at], kind: src.kind }))
    } catch { return [] }
  })

  const seenP = (async () => {
    const map = new Map<string, string | null>()
    try {
      let q = db.from('profiles').select('id, last_seen_at')
      if (userIds) q = q.in('id', userIds)
      const { data, error } = await q.limit(20_000)
      if (!error) for (const r of (data ?? []) as Array<{ id: string; last_seen_at: string | null }>) map.set(r.id, r.last_seen_at)
    } catch { /* migration 129 absente */ }
    return map
  })()

  const signInsP = (async () => {
    const map = new Map<string, string | null>()
    try {
      if (one) {
        const { data } = await db.auth.admin.getUserById(one)
        if (data?.user) map.set(one, data.user.last_sign_in_at ?? null)
        return map
      }
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
        if (error || !data) break
        for (const u of data.users) map.set(u.id, u.last_sign_in_at ?? null)
        if (data.users.length < 1000) break
      }
    } catch { /* comptes indisponibles : la visite notée par l'app suffit */ }
    return map
  })()

  const [rowsBySource, seen, signIns] = await Promise.all([Promise.all(sourceRows), seenP, signInsP])
  return buildMemberActivity({ rows: rowsBySource.flat(), seen, signIns })
}
