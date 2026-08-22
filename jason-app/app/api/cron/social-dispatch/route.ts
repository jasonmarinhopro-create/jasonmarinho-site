// Cron Vercel : publie les social_posts programmés dont l'heure est arrivée.
// Programmé toutes les 5 minutes via vercel.json. Sécurisé par CRON_SECRET
// (même convention que /api/cron/ping-db).

import { NextResponse } from 'next/server'
import { dispatchDuePosts } from '@/lib/social/dispatch'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const { processed } = await dispatchDuePosts()
  return NextResponse.json({ ok: true, processed })
}
