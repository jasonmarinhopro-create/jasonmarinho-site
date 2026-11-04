// Travaux de fond déclenchés par la base (pg_cron, app_jobs_ping, migration
// 178) toutes les 10 minutes, seulement quand il y a quelque chose à faire :
//   ?site=1 : reconstruction du site en attente (fiches publiées regroupées)
//   ?ical=1 : calendriers Airbnb / Booking / Vrbo pas synchronisés depuis 1 h
// Même secret que /api/cron/social-dispatch.
import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { flushPendingRebuild } from '@/lib/pros/site-rebuild'
import { syncStaleFeeds } from '@/lib/ical/background'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const valid = [process.env.CRON_SECRET, process.env.SOCIAL_CRON_SECRET].filter(Boolean)
  if (!valid.length || !valid.some(s => auth === `Bearer ${s}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const out: Record<string, unknown> = {}
  if (url.searchParams.get('site') === '1') out.site = await flushPendingRebuild()
  if (url.searchParams.get('ical') === '1') {
    out.ical = await syncStaleFeeds(getServiceClient(), { staleMinutes: 60, budgetMs: 45_000, concurrency: 6, limit: 120, skipFailing: true })
  }
  return NextResponse.json({ ok: true, ...out })
}
