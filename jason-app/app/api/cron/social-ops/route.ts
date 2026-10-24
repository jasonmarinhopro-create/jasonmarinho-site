// Tâches de la routine réseaux sociaux (24/10/2026), appelées par le workflow
// .github/workflows/reseaux-sociaux.yml avec SOCIAL_CRON_SECRET :
//   ?do=sync     relève les commentaires des posts récents
//   ?do=replies  publie les réponses écrites par la routine
//   ?do=stats    met à jour likes et commentaires des posts publiés
//   ?do=scopes   liste les permissions du jeton de la Page (noms seulement)
// Plusieurs tâches à la suite : ?do=sync,stats

import { NextResponse } from 'next/server'
import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { decryptToken } from '@/lib/security/crypto'
import { debugTokenScopes } from '@/lib/social/meta'
import { syncComments, sendReplies } from '@/lib/social/comments'
import { refreshAllStats } from '@/lib/social/dispatch'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.SOCIAL_CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const tasks = (new URL(req.url).searchParams.get('do') ?? '').split(',').map(t => t.trim()).filter(Boolean)
  const out: Record<string, unknown> = {}
  for (const task of tasks) {
    try {
      if (task === 'sync') out.sync = await syncComments()
      else if (task === 'replies') out.replies = await sendReplies()
      else if (task === 'stats') out.stats = await refreshAllStats()
      else if (task === 'scopes') {
        const { data } = await serviceClient().from('social_accounts').select('access_token').eq('platform', 'facebook').eq('status', 'active').limit(1).maybeSingle()
        out.scopes = data ? await debugTokenScopes(decryptToken(data.access_token)) : []
      }
    } catch (err) {
      out[task] = { error: err instanceof Error ? err.message : String(err) }
    }
  }
  return NextResponse.json({ ok: true, ...out })
}
