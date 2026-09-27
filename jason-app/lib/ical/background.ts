// Synchro iCal « en tâche de fond » : sans elle, les réservations Airbnb /
// Booking n'arrivaient en base que quand l'hôte ouvrait sa page Calendrier, et
// le planning ménage (flux iCal de l'équipe) pouvait rater une réservation.
//
// Appelée par :
//   - le cron quotidien /api/cron/notifications-engine (tous les flux dont la
//     dernière synchro date de plus de 6 h),
//   - /api/calendar/menage-feed et /api/calendar/feed à chaque lecture par
//     l'agenda abonné (flux de l'hôte, > 1 h), ce qui donne une synchro
//     quasi horaire sans cron supplémentaire.
//
// Budget de temps : on s'arrête avant `budgetMs` (fonctions Vercel limitées),
// les flux restants passent au tour suivant (les plus anciens d'abord).

import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchAndUpsertIcalFeed } from './sync'

export interface BackgroundSyncResult {
  attempted: number
  synced: number
  failed: number
  skippedForBudget: number
}

export async function syncStaleFeeds(
  supabase: SupabaseClient,
  opts: { userId?: string; staleMinutes: number; budgetMs: number; concurrency?: number; limit?: number },
): Promise<BackgroundSyncResult> {
  const t0 = Date.now()
  const cutoff = new Date(Date.now() - opts.staleMinutes * 60_000).toISOString()

  let q = supabase
    .from('ical_feeds')
    .select('id, url, user_id, last_synced')
    .or(`last_synced.is.null,last_synced.lt.${cutoff}`)
    .order('last_synced', { ascending: true, nullsFirst: true })
    .limit(opts.limit ?? 200)
  if (opts.userId) q = q.eq('user_id', opts.userId)

  const { data: feeds, error } = await q
  const res: BackgroundSyncResult = { attempted: 0, synced: 0, failed: 0, skippedForBudget: 0 }
  if (error || !feeds?.length) return res

  const queue = [...feeds] as Array<{ id: string; url: string; user_id: string }>
  const worker = async () => {
    while (queue.length) {
      // Un flux peut prendre jusqu'à ~12 s (timeout fetch) : on n'en démarre
      // plus un nouveau s'il reste moins de 12 s de budget.
      if (Date.now() - t0 > opts.budgetMs - 12_000) { res.skippedForBudget = queue.length; return }
      const f = queue.shift()!
      if (!f.url) continue
      res.attempted++
      const r = await fetchAndUpsertIcalFeed(supabase, f.id, f.url, f.user_id)
      if (r.synced != null) res.synced++
      else res.failed++
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, opts.concurrency ?? 4) }, worker))
  return res
}

/** Synchro rapide des flux d'un hôte, plafonnée en temps (lecture d'un flux par un agenda). */
export async function syncUserFeedsQuick(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    await Promise.race([
      syncStaleFeeds(supabase, { userId, staleMinutes: 60, budgetMs: 20_000, concurrency: 4, limit: 12 }),
      new Promise(r => setTimeout(r, 9_000)),
    ])
  } catch { /* best-effort : l'agenda reçoit les données déjà en base */ }
}
