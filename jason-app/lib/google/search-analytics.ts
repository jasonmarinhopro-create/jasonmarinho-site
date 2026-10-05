// Statistiques de recherche Google (Search Console → Performances) pour la
// page « Visibilité » de l'admin et les statistiques des fiches pros
// (05/10/2026). Même connexion OAuth que l'indexation (droit
// webmasters.readonly, qui couvre aussi ces chiffres).
//
// Google publie les chiffres avec 2 à 3 jours de retard, garde 16 mois, et
// masque les recherches trop rares (« recherches masquées »).
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getAccessToken, SEARCH_CONSOLE_SITE_URL, SearchConsoleAuthError } from './search-console'

export type GscDimension = 'date' | 'query' | 'page' | 'device' | 'country'

export interface GscRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscQuery {
  startDate: string
  endDate: string
  dimensions: GscDimension[]
  /** Filtre sur la page : égale à (exact) ou contient (contains) */
  page?: { op: 'equals' | 'contains'; value: string }
  rowLimit?: number
}

const ENDPOINT = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEARCH_CONSOLE_SITE_URL)}/searchAnalytics/query`

async function queryOnce(q: GscQuery): Promise<GscRow[]> {
  const token = await getAccessToken()
  const out: GscRow[] = []
  const limit = Math.min(q.rowLimit ?? 25_000, 25_000)
  for (let startRow = 0; startRow < 100_000; startRow += limit) {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      // Toujours une réponse fraîche (le cache de données de Next a déjà resservi des jetons périmés, 29/09/2026)
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: q.startDate,
        endDate: q.endDate,
        dimensions: q.dimensions,
        type: 'web',
        dataState: 'final',
        rowLimit: limit,
        startRow,
        ...(q.page ? { dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: q.page.op, expression: q.page.value }] }] } : {}),
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (r.status === 401 || r.status === 403) throw new SearchConsoleAuthError(`accès refusé (${r.status})`)
    if (!r.ok) {
      const text = await r.text().catch(() => '')
      throw new Error(`Search Console ${r.status} : ${text.slice(0, 160)}`)
    }
    const j = await r.json() as { rows?: GscRow[] }
    const rows = j.rows ?? []
    out.push(...rows)
    if (rows.length < limit || (q.rowLimit && out.length >= q.rowLimit)) break
  }
  return q.rowLimit ? out.slice(0, q.rowLimit) : out
}

/**
 * Requête gardée 6 h en cache (les chiffres de Google ne changent qu'une
 * fois par jour). Une erreur n'est jamais mise en cache.
 */
export async function gscQuery(q: GscQuery): Promise<GscRow[]> {
  const key = JSON.stringify(q)
  return unstable_cache(() => queryOnce(q), ['gsc-v1', key], { revalidate: 6 * 3600, tags: ['gsc'] })()
}

export type GscResult<T> = { ok: true; data: T } | { ok: false; error: string; auth: boolean }

/** Même chose, sans lancer d'exception : la page affiche un message à la place du bloc. */
export async function safeGsc<T>(fn: () => Promise<T>): Promise<GscResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    const auth = e instanceof SearchConsoleAuthError || /non connecté/.test(String((e as Error)?.message))
    return { ok: false, auth, error: auth ? 'Connexion à Google Search Console à refaire (Admin → Référencement).' : String((e as Error)?.message ?? e).slice(0, 200) }
  }
}
