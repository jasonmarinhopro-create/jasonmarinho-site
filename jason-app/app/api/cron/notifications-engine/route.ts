// Cron Vercel : tourne le rules-engine pour TOUS les utilisateurs actifs.
// Configuré dans vercel.json (daily 8am UTC).
//
// Sécurité : Vercel signe les requêtes cron avec un header
// `Authorization: Bearer <CRON_SECRET>`. On vérifie ce header sinon 401.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { runNotificationRules, purgeExpiredNotifications } from '@/lib/notifications/rules'
import { syncStaleFeeds } from '@/lib/ical/background'
import { unansweredQuestions, unansweredDigestEmail, REMIND_MAX_DAYS, type QuestionRow } from '@/lib/chez-nous/unanswered'
import { sendAdminEmail } from '@/lib/email/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // 60s max (suffisant pour quelques centaines d'utilisateurs)

export async function GET(req: Request) {
  // Vérification du secret cron (Vercel injecte CRON_SECRET dans les env vars
  // si configuré via vercel.json). En dev local, on bypass si pas de secret.
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // On cible les utilisateurs actifs récemment (visite des 30 derniers jours)
  // pour éviter de tourner les règles pour des comptes dormants. Si
  // `last_seen_actualites_at` est absent, on prend tout de même (fallback).
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, last_seen_actualites_at')
    .or(`last_seen_actualites_at.gte.${cutoff},last_seen_actualites_at.is.null`)
    .limit(500)  // garde-fou : si on dépasse 500 actifs, on splitte

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Synchro iCal de fond AVANT les règles : les alertes (arrivée demain,
  // synchro échouée) portent sur des données fraîches. Budget 25 s sur les 60.
  const icalSync = await syncStaleFeeds(supabase, { staleMinutes: 360, budgetMs: 25_000, concurrency: 6 })

  const t0 = Date.now()
  let totalCreated = 0
  let usersProcessed = 0
  for (const u of users ?? []) {
    const r = await runNotificationRules(u.id as string)
    totalCreated += r.total
    usersProcessed++
  }

  const purged = await purgeExpiredNotifications()

  // Questions & réponses : rappel à Jason des questions sans réponse depuis
  // 24 h (promesse affichée : réponse sous 48 h). Un email par jour au plus,
  // seulement s'il y en a. Best-effort.
  let unanswered = 0
  try {
    const since = new Date(Date.now() - REMIND_MAX_DAYS * 24 * 3600 * 1000).toISOString()
    const [{ data: posts }, { data: admins }] = await Promise.all([
      supabase.from('chez_nous_posts').select('id, author_id, title, category, reply_count, created_at').eq('reply_count', 0).gte('created_at', since),
      supabase.from('profiles').select('id').eq('role', 'admin'),
    ])
    const due = unansweredQuestions((posts ?? []) as QuestionRow[], new Set((admins ?? []).map(a => a.id as string)))
    unanswered = due.length
    if (due.length > 0) {
      await sendAdminEmail(unansweredDigestEmail(due, process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'))
    }
  } catch (e) { console.warn('[cron] unanswered questions digest failed', e) }

  return NextResponse.json({
    ok: true,
    icalSync,
    usersProcessed,
    notificationsCreated: totalCreated,
    expiredPurged: purged,
    unansweredQuestions: unanswered,
    durationMs: Date.now() - t0,
  })
}
