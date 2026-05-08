// Détection serveur de l'étape onboarding réelle.
// SERVER ONLY (importe supabase/server qui utilise next/headers).

import { createClient } from '@/lib/supabase/server'

/**
 * Détermine la STEP réelle de l'utilisateur en regardant ses données + son
 * onboarding_step persisté. Retourne la PROCHAINE étape à compléter (1..5),
 * ou 6 si tout est fait.
 *
 * `persistedStep` :
 *   - 0 ou 1 → l'utilisateur n'a pas encore cliqué "Commencer" (welcome)
 *   - 2+    → welcome déjà validé
 *
 * Si l'utilisateur a déjà des données (logement, séjour…), welcome est
 * considéré comme fait implicitement, peu importe la valeur persistée.
 */
export async function detectOnboardingStep(
  userId: string,
  persistedStep: number = 0,
): Promise<{ current: number; completed: boolean }> {
  const supabase = await createClient()

  const [logements, voyageurs, sejours, contracts] = await Promise.all([
    supabase
      .from('logements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('voyageurs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('sejours')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('statut', 'annule'),
  ])

  const hasLogement  = (logements.count ?? 0) > 0
  const hasVoyageur  = (voyageurs.count ?? 0) > 0
  const hasSejour    = (sejours.count ?? 0) > 0
  const hasContract  = (contracts.count ?? 0) > 0

  if (hasContract) return { current: 6, completed: true }
  if (hasSejour)   return { current: 5, completed: false }
  if (hasVoyageur) return { current: 4, completed: false }
  if (hasLogement) return { current: 3, completed: false }

  if (persistedStep < 2) return { current: 1, completed: false }
  return { current: 2, completed: false }
}
