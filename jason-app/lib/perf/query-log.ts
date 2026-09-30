// Durée de chaque appel à Supabase pendant un rendu (30/09/2026 : 4 à 11 s
// de requêtes à l'ouverture, sans savoir lesquelles). Branché comme `fetch`
// des clients Supabase serveur ; lu par perfTimer (lib/perf/server-timing.ts)
// qui ajoute les appels les plus lents au message. Tables et durées seulement.
import { cache } from 'react'
import { supabaseCallLabel } from './format'

const store = cache((): Array<[string, number]> => [])

/** Appels Supabase de la requête en cours (null hors d'un rendu serveur). */
export function queryLog(): Array<[string, number]> | null {
  try { return store() } catch { return null }
}

export const timedFetch: typeof fetch = async (input, init) => {
  const t0 = Date.now()
  try {
    return await fetch(input, init)
  } finally {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    try { queryLog()?.push([supabaseCallLabel(url), Date.now() - t0]) } catch { /* ignore */ }
  }
}
