// Définition des 5 étapes d'onboarding.
// L'auto-détection regarde les données réelles de l'utilisateur (logements,
// voyageurs, séjours, contrats) — pas besoin de "marquer comme fait" manuellement.

import { createClient } from '@/lib/supabase/server'

export interface OnboardingStep {
  id: number               // 1..5
  key: string              // identifiant stable
  title: string            // titre affiché
  description: string      // sous-titre court
  ctaLabel: string         // texte du bouton
  ctaHref: string          // route à ouvrir
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    key: 'welcome',
    title: 'Bienvenue dans ton espace',
    description: 'Lis le message de Jason et découvre ce que tu peux faire ici.',
    ctaLabel: 'Commencer',
    ctaHref: '/dashboard/aide/demarrer',
  },
  {
    id: 2,
    key: 'logement',
    title: 'Ajoute ton premier logement',
    description: 'Le point de départ de tout le reste : 4 champs, 2 minutes.',
    ctaLabel: 'Ajouter un logement',
    ctaHref: '/dashboard/logements',
  },
  {
    id: 3,
    key: 'voyageur',
    title: 'Crée ta première fiche voyageur',
    description: 'Ton carnet de contacts pour les séjours et les contrats.',
    ctaLabel: 'Ajouter un voyageur',
    ctaHref: '/dashboard/voyageurs',
  },
  {
    id: 4,
    key: 'sejour',
    title: 'Crée ton premier séjour',
    description: 'Lie un logement, un voyageur et des dates.',
    ctaLabel: 'Créer un séjour',
    ctaHref: '/dashboard/calendrier',
  },
  {
    id: 5,
    key: 'contrat',
    title: 'Envoie ton premier contrat',
    description: 'Génère et envoie un contrat signé électroniquement en 5 min.',
    ctaLabel: 'Voir mes séjours',
    ctaHref: '/dashboard/calendrier',
  },
]

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

  // Aucune donnée : welcome ou step 2 selon la persistence
  if (persistedStep < 2) return { current: 1, completed: false } // welcome non validé
  return { current: 2, completed: false }
}

/**
 * Renvoie la liste des étapes avec leur état (done | current | upcoming).
 * Utile pour rendre la checklist côté client.
 */
export function buildStepsState(currentStep: number) {
  return ONBOARDING_STEPS.map(step => ({
    ...step,
    state: step.id < currentStep ? 'done' : step.id === currentStep ? 'current' : 'upcoming' as const,
  }))
}
