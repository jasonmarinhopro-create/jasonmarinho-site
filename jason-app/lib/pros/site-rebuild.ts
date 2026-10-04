// Reconstruit le site statique (jasonmarinho.com) après un changement de
// fiche pro : les fiches de l'annuaire sont des pages générées au build.
//
// Avant (04/10/2026) : `fetch(hook).catch(() => {})` sans attente. La fonction
// serverless se terminait souvent avant l'envoi : un photographe a payé à
// 0 h 28 et sa fiche n'est pas apparue. Maintenant l'appel est attendu (5 s
// maximum) et un échec ou un hook absent part dans « Erreurs de l'app ».

import 'server-only'
import { logger } from '@/lib/logger'

const log = logger('pros/site-rebuild')

export async function triggerSiteRebuild(reason: string): Promise<boolean> {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!url) {
    log.error('VERCEL_DEPLOY_HOOK_URL absent : site statique non reconstruit', { reason })
    return false
  }
  try {
    const res = await fetch(url, { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(5_000) })
    if (!res.ok) {
      log.error('Reconstruction du site refusée', { reason, status: res.status })
      return false
    }
    return true
  } catch (e) {
    log.error('Reconstruction du site : appel échoué', { reason, err: e instanceof Error ? e.message : String(e) })
    return false
  }
}
