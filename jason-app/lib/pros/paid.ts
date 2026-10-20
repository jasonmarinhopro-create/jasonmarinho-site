// Fiche pro payée ou non (20/10/2026 : une fiche photographe dont l'abonnement
// Stripe était resté « incomplete » est passée « active », a été publiée sur le
// site et l'admin ne proposait plus de la supprimer). Règles pures, testées.

export const LIVE_SUB = new Set(['active', 'trialing'])
/** Abonnements jamais payés : Stripe attend (incomplete) ou a abandonné (incomplete_expired) */
export const NEVER_PAID_SUB = new Set(['incomplete', 'incomplete_expired'])
const PENDING_STATUS = new Set(['pending_payment', 'approved_pending_payment'])

export const isLiveSub = (status: string | null | undefined) => LIVE_SUB.has(status ?? '')

interface FicheState { status: string | null; stripe_subscription_status?: string | null }

/** En attente de paiement : jamais payée (statut en attente, ou passée « active » par erreur avec un abonnement jamais payé) */
export function isUnpaidFiche(f: FicheState): boolean {
  if (PENDING_STATUS.has(f.status ?? '')) return !isLiveSub(f.stripe_subscription_status)
  return f.status === 'active' && NEVER_PAID_SUB.has(f.stripe_subscription_status ?? '')
}

/** Ce que doit faire le webhook ou la synchro quand on apprend le statut de l'abonnement */
export function subscriptionAction(ficheStatus: string | null, subStatus: string): 'activer' | 'remettre_en_attente' | 'suivre' | 'ignorer' {
  if (PENDING_STATUS.has(ficheStatus ?? '')) return isLiveSub(subStatus) ? 'activer' : 'ignorer'
  if (ficheStatus === 'active') return NEVER_PAID_SUB.has(subStatus) ? 'remettre_en_attente' : 'suivre'
  return 'ignorer'
}
