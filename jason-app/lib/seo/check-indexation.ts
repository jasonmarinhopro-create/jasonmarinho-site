// Vérifie le statut d'indexation Google réel des pages du sitemap et
// persiste le résultat en DB (table seo_indexation_status). Appelé par le
// cron quotidien et par le bouton "Vérifier l'indexation" de l'admin.
//
// ~500 URLs ne tiennent pas dans le budget de 60s d'une fonction Vercel
// (latence réseau réelle vers Google, même à 5 en parallèle) — plutôt que de
// se faire tuer en plein milieu par le timeout et perdre le fil, on
// s'arrête proprement avant la limite (BUDGET_MS) et on renvoie le nombre
// de pages qui restent à faire. Les jamais-vérifiées passent en premier
// (order by last_checked_at, nulls first) pour que les runs successifs
// avancent sur du nouveau plutôt que de re-vérifier en boucle les mêmes
// pages déjà faites. Le bouton "Vérifier l'indexation" ré-appelle
// automatiquement tant qu'il reste des pages (cf. actions.ts / IndexationUI).

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { fetchSitemapEntries } from '@/lib/seo/sitemap'
import { inspectUrl, isConfigured } from '@/lib/google/search-console'
import { logger } from '@/lib/logger'

const log = logger('lib/seo/check-indexation')
const CONCURRENCY = 5
const BUDGET_MS = 50_000 // le cron et l'action serveur ont maxDuration=60

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function checkOne(url: string): Promise<{
  url: string
  http_status: number | null
  coverage_state: string | null
  verdict: string | null
  indexed: boolean
  inspection_link: string | null
  error: string | null
}> {
  // 1. La page répond-elle ? Pas la peine d'interroger Google sur un 404.
  let httpStatus: number | null = null
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    httpStatus = res.status
  } catch {
    httpStatus = null // réseau indisponible — on tente quand même Google, au pire ça échoue aussi
  }

  if (httpStatus && httpStatus >= 400) {
    return { url, http_status: httpStatus, coverage_state: null, verdict: null, indexed: false, inspection_link: null, error: null }
  }

  // 2. Statut réel côté Google.
  try {
    const result = await inspectUrl(url)
    return { url, http_status: httpStatus, coverage_state: result.coverageState, verdict: result.verdict, indexed: result.indexed, inspection_link: result.inspectionLink, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { url, http_status: httpStatus, coverage_state: null, verdict: null, indexed: false, inspection_link: null, error: message }
  }
}

// Quota Google : 2000 inspections/jour par site. Pas de compteur exact côté
// client (Google ne le renvoie pas), donc on détecte le 429/RESOURCE_EXHAUSTED
// sur un checkOne et on arrête la passe immédiatement plutôt que de continuer
// à cramer des requêtes vouées à échouer une par une.
function isQuotaError(message: string): boolean {
  return /429|RESOURCE_EXHAUSTED|quota/i.test(message)
}

export async function checkAllUrls(): Promise<{ checked: number; remaining: number; error?: string }> {
  if (!(await isConfigured())) {
    return { checked: 0, remaining: 0, error: 'Google Search Console non connecté (Admin → Indexation)' }
  }

  // Tout le corps est protégé : un pépin réseau (sitemap, Supabase, Google)
  // ne doit jamais faire planter la server action en pleine boucle du bouton
  // "Vérifier l'indexation" (ça affichait l'écran d'erreur générique
  // Next.js) — on renvoie un message clair à la place, la boucle client
  // s'arrête proprement et l'utilisateur peut réessayer.
  try {
    const t0 = Date.now()
    const entries = await fetchSitemapEntries()
    const db = serviceClient()

    const { data: statusRows } = await db.from('seo_indexation_status').select('url, last_checked_at')
    const lastCheckedByUrl = new Map((statusRows ?? []).map(r => [r.url, r.last_checked_at as string | null]))
    const alreadyCheckedBefore = entries.filter(e => lastCheckedByUrl.get(e.url)).length

    // Jamais vérifiées d'abord (last_checked_at absent → tri en tête).
    const ordered = [...entries].sort((a, b) => {
      const aChecked = lastCheckedByUrl.get(a.url) ?? ''
      const bChecked = lastCheckedByUrl.get(b.url) ?? ''
      return aChecked.localeCompare(bChecked)
    })

    let checked = 0
    for (let i = 0; i < ordered.length; i += CONCURRENCY) {
      if (Date.now() - t0 > BUDGET_MS) break

      const batch = ordered.slice(i, i + CONCURRENCY)
      const results = await Promise.all(batch.map(e => checkOne(e.url)))
      const { error } = await db.from('seo_indexation_status').upsert(
        results.map(r => ({ ...r, last_checked_at: new Date().toISOString() })),
        { onConflict: 'url' },
      )
      if (error) log.error('upsert seo_indexation_status', { msg: error.message })
      checked += results.length

      const quotaHit = results.find(r => r.error && isQuotaError(r.error))
      if (quotaHit) {
        const remaining = Math.max(0, ordered.length - alreadyCheckedBefore - checked)
        return { checked, remaining, error: 'Quota Google Search Console atteint (2000 vérifications/jour) — réessaie demain, ou laisse le cron quotidien continuer tout seul.' }
      }
    }

    const remaining = Math.max(0, ordered.length - alreadyCheckedBefore - checked)
    return { checked, remaining }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    log.error('checkAllUrls', { msg: message })
    return { checked: 0, remaining: 0, error: `Vérification interrompue (${message}) — réessaie.` }
  }
}
