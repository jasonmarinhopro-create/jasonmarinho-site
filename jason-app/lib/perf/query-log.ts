// Durée de chaque appel à Supabase pendant un rendu (30/09/2026 : 4 à 11 s
// de requêtes à l'ouverture, sans savoir lesquelles). Branché comme `fetch`
// des clients Supabase serveur ; lu par perfTimer (lib/perf/server-timing.ts)
// qui ajoute les appels les plus lents au message. Tables et durées seulement.
import { cache } from 'react'
import { supabaseCallLabel, delaiPour } from './format'

const store = cache((): Array<[string, number]> => [])

/** Appels Supabase de la requête en cours (null hors d'un rendu serveur). */
export function queryLog(): Array<[string, number]> | null {
  try { return store() } catch { return null }
}

// Jamais de cache Next.js sur les lectures Supabase (26/10/2026) : sans
// `cache: 'no-store'`, Next gardait la réponse d'une lecture et la resservait
// aux passages suivants. La publication des réseaux sociaux relisait ainsi
// l'état de 17 h 40 à chaque passage (ancien conteneur Instagram repris, post
// Facebook « republié »). Les caches voulus passent par unstable_cache.
//
// Délai par appel (16/11/2026) : sans lui, quand la base Supabase ne répondait
// plus, chaque page attendait jusqu'à la coupure de Vercel (60 s) avant
// d'afficher une erreur. Désormais une lecture abandonne à 15 s et une
// écriture ou une fonction SQL à 25 s : la page d'erreur arrive vite et dit ce
// qui se passe. Les envois de fichiers (/storage/) ne sont pas limités.
export const timedFetch: typeof fetch = async (input, init) => {
  const t0 = Date.now()
  const adresse = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const delai = delaiPour(adresse, init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : undefined))
  const limite = delai === null ? null : AbortSignal.timeout(delai)
  const signal = limite && init?.signal ? AbortSignal.any([init.signal, limite]) : (limite ?? init?.signal ?? undefined)
  try {
    return await fetch(input, { ...init, cache: init?.cache ?? 'no-store', signal })
  } finally {
    const url = adresse
    try { queryLog()?.push([supabaseCallLabel(url), Date.now() - t0]) } catch { /* ignore */ }
  }
}
