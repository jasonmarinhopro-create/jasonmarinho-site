// Ordre de passage de la vérification d'indexation (23/11/2026).
// Avant : jamais vérifiées et erreurs d'abord, puis les plus anciennes. Avec
// environ 30 pages par passe quotidienne, une page non indexée n'était
// revérifiée qu'une fois toutes les 3 semaines : le tableau de bord gardait
// « inconnue de Google » longtemps après l'indexation (Jason : « 30 pages qui
// ne veulent jamais s'indexer »). Désormais les pages non indexées passent
// chaque jour, juste après les jamais vérifiées et les erreurs ; les pages
// déjà indexées tournent ensuite, les plus anciennes d'abord.

export type EtatConnu = { last_checked_at: string | null; error: string | null; indexed: boolean | null }

/** 0 : jamais vérifiée ou en erreur ; 1 : pas encore indexée ; 2 : indexée */
export function prioriteVerification(r: EtatConnu | undefined): 0 | 1 | 2 {
  if (!r?.last_checked_at || r.error) return 0
  return r.indexed ? 2 : 1
}

export function ordonnerVerification<T extends { url: string }>(entries: T[], byUrl: Map<string, EtatConnu>): T[] {
  return [...entries].sort((a, b) => {
    const ra = byUrl.get(a.url), rb = byUrl.get(b.url)
    const pa = prioriteVerification(ra), pb = prioriteVerification(rb)
    if (pa !== pb) return pa - pb
    return (ra?.last_checked_at ?? '').localeCompare(rb?.last_checked_at ?? '')
  })
}
