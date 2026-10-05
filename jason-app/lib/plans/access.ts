// Accès aux fonctions payantes (05/10/2026). Les contrats signés en ligne
// (avec paiement Stripe et caution par empreinte) font partie de la formule
// Standard, comme l'annoncent /tarifs et Mon abonnement. Avant, seule la
// fiche voyageur les bloquait : « Nouveau contrat » de Contrats & paiements et
// le serveur laissaient passer un compte gratuit.
export type PlanName = 'decouverte' | 'standard' | 'driing' | string | null | undefined

/** Standard, Driing (Standard inclus) et admin : contrats et fonctions payantes. */
export function hasStandardAccess(plan: PlanName, role?: string | null, driingStatus?: string | null): boolean {
  if (role === 'admin') return true
  // Même règle que getProfile (lib/queries/profile.ts) : un membre Driing
  // confirmé a le Standard même si son plan en base n'a pas été mis à jour.
  if (driingStatus === 'confirmed') return true
  return plan === 'standard' || plan === 'driing'
}

export const CONTRACTS_STANDARD_ONLY_MESSAGE =
  'Les contrats signés en ligne (avec paiement et caution) font partie de la formule Standard. Passe en Standard depuis Mon abonnement pour en créer.'
