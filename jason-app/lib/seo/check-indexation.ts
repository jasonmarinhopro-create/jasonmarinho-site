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

import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { fetchSitemapEntries } from '@/lib/seo/sitemap'
import { inspectUrl, isConfigured, SearchConsoleAuthError } from '@/lib/google/search-console'
import { logger } from '@/lib/logger'

const log = logger('lib/seo/check-indexation')
const CONCURRENCY = 5
const BUDGET_MS = 50_000 // le cron et l'action serveur ont maxDuration=60

type CheckResult =
  | { kind: 'ok'; row: { url: string; http_status: number | null; coverage_state: string | null; verdict: string | null; indexed: boolean; inspection_link: string | null; error: null } }
  // Échec ponctuel : on n'écrit que l'erreur, le dernier statut connu reste
  // (avant : indexed=false + coverage_state=null écrasaient une page indexée).
  | { kind: 'error'; row: { url: string; http_status: number | null; error: string } }
  | { kind: 'auth'; message: string }

async function checkOne(url: string): Promise<CheckResult> {
  // 1. La page répond-elle ? Pas la peine d'interroger Google sur un 404.
  let httpStatus: number | null = null
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    httpStatus = res.status
  } catch {
    httpStatus = null // réseau indisponible — on tente quand même Google, au pire ça échoue aussi
  }

  if (httpStatus && httpStatus >= 400) {
    return { kind: 'ok', row: { url, http_status: httpStatus, coverage_state: null, verdict: null, indexed: false, inspection_link: null, error: null } }
  }

  // 2. Statut réel côté Google.
  try {
    const result = await inspectUrl(url)
    return { kind: 'ok', row: { url, http_status: httpStatus, coverage_state: result.coverageState, verdict: result.verdict, indexed: result.indexed, inspection_link: result.inspectionLink, error: null } }
  } catch (e) {
    if (e instanceof SearchConsoleAuthError) return { kind: 'auth', message: e.message }
    const message = e instanceof Error ? e.message : String(e)
    return { kind: 'error', row: { url, http_status: httpStatus, error: message } }
  }
}

// Quota Google : 2000 inspections/jour par site. Pas de compteur exact côté
// client (Google ne le renvoie pas), donc on détecte le 429/RESOURCE_EXHAUSTED
// sur un checkOne et on arrête la passe immédiatement plutôt que de continuer
// à cramer des requêtes vouées à échouer une par une.
function isQuotaError(message: string): boolean {
  return /429|RESOURCE_EXHAUSTED|quota/i.test(message)
}

export async function checkAllUrls(): Promise<{ checked: number; remaining: number; error?: string; authExpired?: boolean }> {
  if (!(await isConfigured())) {
    return { checked: 0, remaining: 0, error: 'Google Search Console non connecté (Admin → Indexation)', authExpired: true }
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

    const { data: statusRows } = await db.from('seo_indexation_status').select('url, last_checked_at, error')
    const byUrl = new Map((statusRows ?? []).map(r => [r.url as string, r as { last_checked_at: string | null; error: string | null }]))

    // À faire en priorité : jamais vérifiées ou en erreur à la dernière
    // vérification. Puis les plus anciennes (le cron quotidien repasse ainsi
    // sur tout le sitemap au fil des jours).
    const needsCheck = (url: string) => { const r = byUrl.get(url); return !r?.last_checked_at || !!r.error }
    const ordered = [...entries].sort((a, b) => {
      const na = needsCheck(a.url) ? 0 : 1
      const nb = needsCheck(b.url) ? 0 : 1
      if (na !== nb) return na - nb
      return (byUrl.get(a.url)?.last_checked_at ?? '').localeCompare(byUrl.get(b.url)?.last_checked_at ?? '')
    })
    const todo = ordered.filter(e => needsCheck(e.url)).length

    let checked = 0
    let todoDone = 0
    for (let i = 0; i < ordered.length; i += CONCURRENCY) {
      if (Date.now() - t0 > BUDGET_MS) break

      const batch = ordered.slice(i, i + CONCURRENCY)
      const results = await Promise.all(batch.map(e => checkOne(e.url)))

      const auth = results.find(r => r.kind === 'auth')
      if (auth && auth.kind === 'auth') {
        // Rien n'est écrit pour ce lot : les statuts connus restent intacts.
        log.error('Search Console : connexion expirée', { msg: auth.message })
        return { checked, remaining: Math.max(0, todo - todoDone), error: auth.message, authExpired: true }
      }

      const now = new Date().toISOString()
      const ok = results.flatMap(r => r.kind === 'ok' ? [{ ...r.row, last_checked_at: now }] : [])
      const failed = results.flatMap(r => r.kind === 'error' ? [r.row] : [])
      if (ok.length) {
        const { error } = await db.from('seo_indexation_status').upsert(ok, { onConflict: 'url' })
        if (error) log.error('upsert seo_indexation_status', { msg: error.message })
      }
      if (failed.length) {
        const { error } = await db.from('seo_indexation_status').upsert(failed, { onConflict: 'url' })
        if (error) log.error('upsert seo_indexation_status (erreurs)', { msg: error.message })
      }
      checked += results.length
      todoDone += batch.filter(e => needsCheck(e.url)).length

      const quotaHit = failed.find(r => isQuotaError(r.error))
      if (quotaHit) {
        return { checked, remaining: Math.max(0, todo - todoDone), error: 'Quota Google Search Console atteint (2000 vérifications/jour) — réessaie demain, ou laisse le cron quotidien continuer tout seul.' }
      }
    }

    return { checked, remaining: Math.max(0, todo - todoDone) }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    log.error('checkAllUrls', { msg: message })
    return { checked: 0, remaining: 0, error: `Vérification interrompue (${message}) — réessaie.` }
  }
}

export type SingleCheck = {
  url: string
  httpStatus: number | null
  coverageState: string | null
  indexed: boolean
  inspectionLink: string | null
  lastCheckedAt: string
  error: string | null
}

// Une seule page (bouton « Vérifier » d'une ligne de l'admin, 30/09/2026 :
// Jason ne voulait pas relancer tout le sitemap pour deux nouvelles pages).
// Mêmes règles d'écriture que checkAllUrls : une erreur d'accès Google
// n'écrit rien, une erreur ponctuelle n'efface pas le dernier statut connu.
export async function checkSingleUrl(url: string): Promise<{ result?: SingleCheck; error?: string; authExpired?: boolean }> {
  let parsed: URL
  try { parsed = new URL(url) } catch { return { error: 'Adresse invalide.' } }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'jasonmarinho.com') return { error: 'Seules les pages de jasonmarinho.com se vérifient ici.' }
  if (!(await isConfigured())) return { error: 'Google Search Console non connecté.', authExpired: true }

  const r = await checkOne(parsed.href)
  if (r.kind === 'auth') {
    log.error('Search Console : connexion expirée', { msg: r.message })
    return { error: r.message, authExpired: true }
  }
  const db = serviceClient()
  const now = new Date().toISOString()
  if (r.kind === 'ok') {
    const { error } = await db.from('seo_indexation_status').upsert({ ...r.row, last_checked_at: now }, { onConflict: 'url' })
    if (error) log.error('upsert seo_indexation_status (une page)', { msg: error.message })
    return { result: { url: r.row.url, httpStatus: r.row.http_status, coverageState: r.row.coverage_state, indexed: r.row.indexed, inspectionLink: r.row.inspection_link, lastCheckedAt: now, error: null } }
  }
  await db.from('seo_indexation_status').upsert(r.row, { onConflict: 'url' })
  return { error: isQuotaError(r.row.error) ? 'Quota Google atteint (2000 vérifications par jour) : réessaie demain.' : r.row.error }
}
