// Définition des 5 étapes d'onboarding.
// Ce fichier est SAFE pour les client components (pas d'import server-only).
// La fonction de détection vit dans `detect.ts` (server-only).

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
 * Renvoie la liste des étapes avec leur état (done | current | upcoming).
 * Utile pour rendre la checklist côté client.
 */
export function buildStepsState(currentStep: number) {
  return ONBOARDING_STEPS.map(step => ({
    ...step,
    state: step.id < currentStep ? 'done' : step.id === currentStep ? 'current' : 'upcoming' as const,
  }))
}
