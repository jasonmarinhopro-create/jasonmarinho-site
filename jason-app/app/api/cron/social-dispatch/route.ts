// Publie les social_posts programmés dont l'heure est arrivée.
// Déclenché toutes les 5 minutes par un GitHub Actions scheduled workflow
// (.github/workflows/social-dispatch.yml), PAS par un Vercel Cron : le plan
// Hobby limite les Vercel Cron à une exécution par jour, incompatible avec
// une programmation à 5 min près. Sécurisé par SOCIAL_CRON_SECRET (dédié,
// distinct du CRON_SECRET auto-injecté par Vercel pour ses propres crons).

import { NextResponse } from 'next/server'
import { dispatchDuePosts } from '@/lib/social/dispatch'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const expectedSecret = process.env.SOCIAL_CRON_SECRET
  if (expectedSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  // dispatchDuePosts() s'arrête proprement avant son propre budget interne
  // (DUE_POSTS_BUDGET_MS, dispatch.ts) plutôt que de risquer le timeout de
  // 60s de cette fonction sur un gros backlog. On ne boucle PAS ici pour
  // épuiser le reste dans la même invocation (ça empilerait deux budgets et
  // recréerait le même risque de timeout) — un backlog résiduel est repris
  // naturellement au prochain passage du cron (QStash, 5 min).
  const { processed, remaining } = await dispatchDuePosts()
  return NextResponse.json({ ok: true, processed, remaining })
}
