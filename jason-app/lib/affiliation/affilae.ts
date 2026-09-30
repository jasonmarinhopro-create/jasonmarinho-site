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
  | { state: 'ok'; summary: AffilaeSummary; fetchedAt: string }

async function call(path: string, key: string): Promise<unknown> {
  const r = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (r.status === 401 || r.status === 403) throw new Error('Clé Affilae refusée : régénère-la dans Affilae (Mon compte, Clé API) et remplace AFFILAE_API_KEY dans Vercel.')
  if (r.status === 429) throw new Error('Affilae limite le nombre d\'appels : réessaie dans une minute.')
  if (!r.ok) throw new Error(`Affilae a répondu ${r.status} sur ${path.split('?')[0]}.`)
  return r.json()
}

const pause = (ms: number) => new Promise(res => setTimeout(res, ms))

const load = unstable_cache(async (): Promise<AffilaeOverview> => {
  const key = process.env.AFFILAE_API_KEY
  if (!key) return { state: 'absent' }
  try {
    const me = await call('/publisher/publishers.me', key) as { affiliateProfiles?: { data?: Array<{ id?: string }> } }
    const profileId = me?.affiliateProfiles?.data?.[0]?.id
    // Appels espacés : Affilae renvoie 429 au-delà de quelques appels rapprochés
    await pause(250)
    const partnerships = await call('/publisher/partnerships.list', key)
    await pause(250)
    const conversions = profileId ? await call(`/publisher/conversions.list?affiliateProfile=${encodeURIComponent(profileId)}`, key) : null
    await pause(250)
    const clicks = await call('/publisher/clicks.list', key)
    return { state: 'ok', summary: summarizeAffilae({ partnerships, conversions, clicks }), fetchedAt: new Date().toISOString() }
  } catch (e) {
    return { state: 'erreur', message: e instanceof Error ? e.message : 'Affilae injoignable.' }
  }
}, ['affilae-overview-v1'], { revalidate: 600, tags: ['affilae'] })

/** Vue d'ensemble Affilae, relue au plus toutes les 10 minutes */
export function getAffilaeOverview(): Promise<AffilaeOverview> {
  return load()
}
