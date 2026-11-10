// Cadre du dashboard en une lecture (10/11/2026, migration 186) : espaces de
// l'utilisateur et liste de ses logements, partagés par getUserSpaces et
// getActiveProperty. Avant : jusqu'à 9 lectures à chaque expiration du cache.
// Même durée (5 min) et mêmes étiquettes d'invalidation qu'avant
// (spaces:<id> et logements:<id>). null si la fonction manque : chaque
// appelant garde alors son ancien chargement.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getServiceClient } from '@/lib/supabase/service'

type Fiche = { full_name: string | null; pseudo: string | null; slug: string | null; status: string | null } | null
export interface UserShell {
  logements_count: number
  ph: Fiche
  cl: Fiche
  dp: Fiche
  is_investor: boolean
  projects_count: number
  owned: Array<{ id: string; nom: string | null }>
  names: string[]
  matched: Array<{ id: string; nom: string | null }>
}

export async function fetchUserShell(userId: string): Promise<UserShell | null> {
  try {
    return await unstable_cache(
      async () => {
        const { data, error } = await getServiceClient().rpc('user_shell', { p_user: userId })
        // Une erreur n'est pas gardée en cache (exception)
        if (error || !data) throw new Error(error?.message ?? 'user_shell vide')
        return data as UserShell
      },
      ['user-shell-v1', userId],
      { revalidate: 300, tags: [`spaces:${userId}`, `logements:${userId}`] },
    )()
  } catch {
    return null
  }
}
