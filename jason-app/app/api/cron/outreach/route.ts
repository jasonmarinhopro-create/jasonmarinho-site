// Cron Vercel de la prospection (vercel.json, du lundi au vendredi, vers
// 9 h à Paris) : réponses et rebonds, inscriptions détectées, puis envois
// dus dans la limite du plafond quotidien. Voir lib/outreach/service.ts.

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { runOutreach } from '@/lib/outreach/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET
  if (expected && req.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const summary = await runOutreach(getServiceClient(), { budgetMs: 45_000 })
    return NextResponse.json({ ok: true, ...summary })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'erreur' }, { status: 500 })
  }
}
