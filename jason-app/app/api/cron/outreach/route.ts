// Cron Vercel de la prospection (vercel.json, du lundi au vendredi, vers
// 9 h à Paris) : réponses et rebonds, inscriptions détectées, puis envois
// dus dans la limite du plafond quotidien. Voir lib/outreach/service.ts.
// Un passage à court de temps se relance lui-même (`?hop=n`, envois
// seulement, lib/outreach/relaunch.ts).

import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { runOutreach } from '@/lib/outreach/service'
import { relaunchOutreach } from '@/lib/outreach/relaunch'
import { fixInstalledTexts } from '@/lib/outreach/playbook'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET
  if (expected && req.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const params = new URL(req.url).searchParams
  const hop = Math.max(0, parseInt(params.get('hop') ?? '0', 10) || 0)
  const force = params.get('force') === '1'
  try {
    // Premier passage du jour : textes des séquences en base remis à jour
    // (corrections, nombre de villes) avant tout envoi
    if (hop === 0) await fixInstalledTexts(getServiceClient()).catch(() => null)
    const summary = await runOutreach(getServiceClient(), { budgetMs: 45_000, sendOnly: hop > 0, force })
    const relaunched = summary.more ? await relaunchOutreach(hop + 1, force) : false
    return NextResponse.json({ ok: true, hop, relaunched, ...summary })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'erreur' }, { status: 500 })
  }
}
