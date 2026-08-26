// Vérifie le statut d'indexation Google réel de toutes les pages du sitemap
// et persiste le résultat en DB (table seo_indexation_status). Appelé par le
// cron quotidien et par le bouton "Vérifier l'indexation" de l'admin.
//
// Deux économies de quota/temps :
// - Statut HTTP de la page elle-même vérifié en premier (gratuit) : une page
//   qui répond 404 n'a aucune raison d'être interrogée sur Google.
// - Concurrence limitée (5 en parallèle) plutôt que tout séquentiel — ~500
//   URLs tiennent dans le budget de 60s d'une fonction Vercel, sans dépasser
//   les limites de débit de l'API Search Console.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { fetchSitemapEntries } from '@/lib/seo/sitemap'
import { inspectUrl, isConfigured } from '@/lib/google/search-console'
import { logger } from '@/lib/logger'

const log = logger('lib/seo/check-indexation')
const CONCURRENCY = 5

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
    return { url, http_status: httpStatus, coverage_state: null, verdict: null, indexed: false, error: null }
  }

  // 2. Statut réel côté Google.
  try {
    const result = await inspectUrl(url)
    return { url, http_status: httpStatus, coverage_state: result.coverageState, verdict: result.verdict, indexed: result.indexed, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { url, http_status: httpStatus, coverage_state: null, verdict: null, indexed: false, error: message }
  }
}

export async function checkAllUrls(): Promise<{ checked: number; error?: string }> {
  if (!isConfigured()) {
    return { checked: 0, error: 'GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY manquants' }
  }

  const entries = await fetchSitemapEntries()
  const db = serviceClient()
  let checked = 0

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(e => checkOne(e.url)))
    const { error } = await db.from('seo_indexation_status').upsert(
      results.map(r => ({ ...r, last_checked_at: new Date().toISOString() })),
      { onConflict: 'url' },
    )
    if (error) log.error('upsert seo_indexation_status', { msg: error.message })
    checked += results.length
  }

  return { checked }
}
