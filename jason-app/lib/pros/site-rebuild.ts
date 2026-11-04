// Reconstruit le site statique (jasonmarinho.com) après un changement de
// fiche pro : les fiches de l'annuaire sont des pages générées au build.
//
// Avant (04/10/2026) : `fetch(hook).catch(() => {})` sans attente. La fonction
// serverless se terminait souvent avant l'envoi : un photographe a payé à
// 0 h 28 et sa fiche n'est pas apparue. Maintenant l'appel est attendu (5 s
// maximum) et un échec ou un hook absent part dans « Erreurs de l'app ».
//
// Regroupement (04/11/2026, montée en charge : 1 000 pros visés) : si une
// reconstruction est partie il y a moins de 4 minutes, la demande est notée
// (site_rebuild_state, migration 178) et part au passage suivant de la tâche
// des 10 minutes (app_jobs_ping → /api/cron/jobs?site=1). 30 fiches publiées
// en même temps donnent une ou deux reconstructions, plus 30.

import 'server-only'
import { logger } from '@/lib/logger'
import { getServiceClient } from '@/lib/supabase/service'
import { rebuildDecision, REBUILD_GAP_MS } from './site-rebuild-rules'

const log = logger('pros/site-rebuild')

async function callHook(reason: string): Promise<boolean> {
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

async function readState(): Promise<{ requested_at: string | null; triggered_at: string | null } | null> {
  try {
    const { data, error } = await getServiceClient().from('site_rebuild_state').select('requested_at, triggered_at').eq('id', 1).maybeSingle()
    if (error) return null
    return (data as { requested_at: string | null; triggered_at: string | null } | null) ?? { requested_at: null, triggered_at: null }
  } catch { return null }
}

async function writeState(patch: { requested_at?: string | null; triggered_at?: string | null }) {
  try { await getServiceClient().from('site_rebuild_state').update(patch).eq('id', 1) } catch { /* migration 178 absente */ }
}

/** Demande une reconstruction : tout de suite, ou au passage suivant si une vient de partir */
export async function triggerSiteRebuild(reason: string): Promise<boolean> {
  const state = await readState()
  // Sans la migration 178 : comme avant, reconstruction immédiate
  if (state && rebuildDecision(state, Date.now(), 'request') === 'queue') {
    await writeState({ requested_at: new Date().toISOString() })
    return true
  }
  const ok = await callHook(reason)
  if (ok && state) await writeState({ triggered_at: new Date().toISOString(), requested_at: null })
  return ok
}

/** Reconstruction forcée (bouton de l'admin) : part tout de suite, et reste visible du garde-fou du site (scripts/ignore-build-site.sh) */
export async function forceSiteRebuild(reason: string): Promise<boolean> {
  const ok = await callHook(reason)
  if (ok) await writeState({ triggered_at: new Date().toISOString(), requested_at: null })
  return ok
}

/** Passage de la tâche des 10 minutes : envoie la reconstruction en attente */
export async function flushPendingRebuild(): Promise<'sent' | 'none' | 'wait' | 'failed'> {
  const state = await readState()
  if (!state) return 'none'
  const d = rebuildDecision(state, Date.now(), 'flush')
  if (d !== 'now') return d === 'queue' ? 'wait' : 'none'
  const ok = await callHook('regroupement')
  if (ok) await writeState({ triggered_at: new Date().toISOString(), requested_at: null })
  return ok ? 'sent' : 'failed'
}

export { REBUILD_GAP_MS }
