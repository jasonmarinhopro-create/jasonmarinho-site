// Compte partenaire PartnerStack de Jason (Brevo, 06/10/2026) : récompenses
// et clients amenés, pour l'onglet Partenaires de Visibilité. SERVER ONLY,
// clé PARTNERSTACK_API_KEY (Vercel ; PartnerStack → Settings → API).
// Seuls des nombres et des montants sortent de ce fichier : les e-mails des
// clients renvoyés par l'API ne sont jamais lus ni gardés.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { listItems, hasMore, summarizePartnerStack, type PartnerStackSummary } from './partnerstack-parse'

const BASE = 'https://api.partnerstack.com/api/v2'
const TIMEOUT_MS = 10_000
const MAX_PAGES = 5

export type PartnerStackOverview =
  | { state: 'absent' }
  | { state: 'erreur'; message: string }
  | { state: 'ok'; summary: PartnerStackSummary; fetchedAt: string; missing: string[] }

async function call(path: string, key: string, what: string): Promise<unknown> {
  let r: Response
  try {
    r = await fetch(BASE + path, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (e) {
    const name = e instanceof Error ? e.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') throw new Error(`PartnerStack n'a pas répondu à temps (${what}). Réessaie dans quelques minutes.`)
    throw new Error(`PartnerStack est injoignable pour le moment (${what}).`)
  }
  if (r.status === 401 || r.status === 403) throw new Error('Clé PartnerStack refusée : recopie-la depuis PartnerStack (Settings, API) dans PARTNERSTACK_API_KEY sur Vercel.')
  if (r.status === 429) throw new Error('PartnerStack limite le nombre d\'appels : réessaie dans une minute.')
  if (!r.ok) throw new Error(`PartnerStack a répondu ${r.status} (${what}).`)
  return r.json()
}

/** Toutes les pages d'une liste (5 × 100 au plus) */
async function all(route: string, key: string, what: string): Promise<unknown[]> {
  const out: unknown[] = []
  let after = ''
  for (let i = 0; i < MAX_PAGES; i++) {
    const json = await call(`${route}?limit=100${after ? `&starting_after=${encodeURIComponent(after)}` : ''}`, key, what)
    const items = listItems(json)
    out.push(...items)
    const last = items[items.length - 1]?.key
    if (!hasMore(json) || typeof last !== 'string') break
    after = last
  }
  return out
}

// Lève en cas d'échec : unstable_cache ne garde que les réussites.
const load = unstable_cache(async (): Promise<PartnerStackOverview> => {
  const key = process.env.PARTNERSTACK_API_KEY
  if (!key) return { state: 'absent' }
  const rewards = await all('/rewards', key, 'récompenses')
  const missing: string[] = []
  let customers: unknown[] = []
  try { customers = await all('/customers', key, 'clients') } catch { missing.push('clients') }
  if (missing.length) throw Object.assign(new Error('partiel'), { partial: { rewards, customers, missing } })
  return { state: 'ok', summary: summarizePartnerStack({ rewards, customers }), fetchedAt: new Date().toISOString(), missing: [] }
}, ['partnerstack-overview-v1'], { revalidate: 600, tags: ['partnerstack'] })

/** Vue d'ensemble PartnerStack, relue au plus toutes les 10 minutes (réussites seulement) */
export async function getPartnerStackOverview(): Promise<PartnerStackOverview> {
  try {
    return await load()
  } catch (e) {
    const partial = (e as { partial?: { rewards: unknown[]; customers: unknown[]; missing: string[] } }).partial
    if (partial) return { state: 'ok', summary: summarizePartnerStack(partial), fetchedAt: new Date().toISOString(), missing: partial.missing }
    return { state: 'erreur', message: e instanceof Error ? e.message : 'PartnerStack injoignable.' }
  }
}
