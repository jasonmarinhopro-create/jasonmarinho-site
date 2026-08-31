// Publie les social_posts programmés dont l'heure est arrivée.
// Déclenché une fois par jour par un Vercel Cron natif (jason-app/vercel.json)
// — le plan Hobby limite les Vercel Cron à une exécution par jour, donc pas
// de précision à 5 min près, mais fiable et sans dépendance externe (ni
// GitHub Actions, dont le cron natif s'est montré peu fiable en pratique, ni
// compte Upstash à configurer). Accepte deux secrets : CRON_SECRET (injecté
// automatiquement par Vercel pour ses propres crons) et SOCIAL_CRON_SECRET
// (dédié, pour un déclenchement manuel/externe — ex : le workflow_dispatch
// de .github/workflows/social-dispatch.yml, gardé pour forcer un passage
// entre deux exécutions du cron Vercel).

import { NextResponse } from 'next/server'
import { dispatchDuePosts } from '@/lib/social/dispatch'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const validSecrets = [process.env.CRON_SECRET, process.env.SOCIAL_CRON_SECRET].filter(Boolean)
  if (validSecrets.length > 0 && !validSecrets.some(secret => auth === `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
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
