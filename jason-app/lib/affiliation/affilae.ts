// Compte éditeur Affilae de Jason (Indy, et les autres programmes qui passent
// par Affilae) : partenariats, clics et conversions pour la carte
// « Affiliation » de l'admin. SERVER ONLY, clé AFFILAE_API_KEY (Vercel).
// API : https://rest.affilae.com, jeton en Bearer, montants en centimes.
// publishers.me renvoie aussi l'IBAN et l'adresse de Jason : on n'en lit
// que l'identifiant du profil, rien d'autre ne sort de ce fichier.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { summarizeAffilae, type AffilaeSummary } from './affilae-parse'

const BASE = 'https://rest.affilae.com'

export type AffilaeOverview =
  | { state: 'absent' }
  | { state: 'erreur'; message: string }
  | { state: 'ok'; summary: AffilaeSummary; fetchedAt: string; missing: string[] }

// Affilae répond parfois très lentement (30/09/2026 : « The operation was
// aborted due to timeout » affiché tel quel dans l'admin, et gardé 10 min
// en cache). Messages en français, erreurs jamais mises en cache, et les
// conversions ou les clics qui tardent n'empêchent plus d'afficher le reste.
const TIMEOUT_MS = 10_000

function frenchError(e: unknown, what: string): Error {
  const name = e instanceof Error ? e.name : ''
  if (name === 'TimeoutError' || name === 'AbortError') {
    return new Error(`Affilae n'a pas répondu à temps (${what}, plus de ${TIMEOUT_MS / 1000} s). Ça arrive quand leur service est lent : réessaie dans quelques minutes.`)
  }
  if (e instanceof Error && /fetch failed|ENOTFOUND|ECONNRESET/i.test(e.message)) {
    return new Error(`Affilae est injoignable pour le moment (${what}). Réessaie dans quelques minutes.`)
  }
  return e instanceof Error ? e : new Error('Affilae injoignable.')
}

async function call(path: string, key: string, what: string): Promise<unknown> {
  let r: Response
  try {
    r = await fetch(BASE + path, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (e) {
    throw frenchError(e, what)
  }
  if (r.status === 401 || r.status === 403) throw new Error('Clé Affilae refusée : régénère-la dans Affilae (Mon compte, Clé API) et remplace AFFILAE_API_KEY dans Vercel.')
  if (r.status === 429) throw new Error('Affilae limite le nombre d\'appels : réessaie dans une minute.')
  if (!r.ok) throw new Error(`Affilae a répondu ${r.status} (${what}).`)
  try { return await r.json() } catch (e) { throw frenchError(e, what) }
}

const pause = (ms: number) => new Promise(res => setTimeout(res, ms))

// Lève en cas d'échec : unstable_cache ne garde que les réussites.
const load = unstable_cache(async (): Promise<AffilaeOverview> => {
  const key = process.env.AFFILAE_API_KEY
  if (!key) return { state: 'absent' }
  const me = await call('/publisher/publishers.me', key, 'profil') as { affiliateProfiles?: { data?: Array<{ id?: string }> } }
  const profileId = me?.affiliateProfiles?.data?.[0]?.id
  // Appels espacés : Affilae renvoie 429 au-delà de quelques appels rapprochés
  await pause(250)
  const partnerships = await call('/publisher/partnerships.list', key, 'partenariats')
  const missing: string[] = []
  await pause(250)
  let conversions: unknown = null
  if (profileId) {
    try { conversions = await call(`/publisher/conversions.list?affiliateProfile=${encodeURIComponent(profileId)}`, key, 'conversions') }
    catch { missing.push('conversions') }
  }
  await pause(250)
  let clicks: unknown = null
  try { clicks = await call('/publisher/clicks.list', key, 'clics') }
  catch { missing.push('clics') }
  // Réponse incomplète : pas gardée en cache, le prochain affichage réessaie
  if (missing.length) throw Object.assign(new Error('partiel'), { partial: { partnerships, conversions, clicks, missing } })
  return { state: 'ok', summary: summarizeAffilae({ partnerships, conversions, clicks }), fetchedAt: new Date().toISOString(), missing: [] }
}, ['affilae-overview-v2'], { revalidate: 600, tags: ['affilae'] })

/** Vue d'ensemble Affilae, relue au plus toutes les 10 minutes (réussites seulement) */
export async function getAffilaeOverview(): Promise<AffilaeOverview> {
  try {
    return await load()
  } catch (e) {
    const partial = (e as { partial?: { partnerships: unknown; conversions: unknown; clicks: unknown; missing: string[] } }).partial
    if (partial) {
      return { state: 'ok', summary: summarizeAffilae(partial), fetchedAt: new Date().toISOString(), missing: partial.missing }
    }
    return { state: 'erreur', message: e instanceof Error ? e.message : 'Affilae injoignable.' }
  }
}
