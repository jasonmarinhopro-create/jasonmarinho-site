// IDs des prix Stripe — à renseigner depuis le Stripe Dashboard après création des produits
// Produit : "Standard Founding Member" → 4,98 €/mois HT
// Produit : "Standard Founding Member Annuel" → 48 €/an HT
// Produit : "Standard Public" → 8,98 €/mois HT
// Produit : "Contribution Membre Driing" → 2,98 €/mois HT
export const STRIPE_PLANS = {
  STANDARD_FOUNDING_MONTHLY: process.env.STRIPE_PRICE_STANDARD_FOUNDING_MONTHLY ?? '',
  STANDARD_FOUNDING_YEARLY:  process.env.STRIPE_PRICE_STANDARD_FOUNDING_YEARLY  ?? '',
  STANDARD_PUBLIC_MONTHLY:   process.env.STRIPE_PRICE_STANDARD_PUBLIC_MONTHLY   ?? '',
  DRIING_MEMBER_MONTHLY:     process.env.STRIPE_PRICE_DRIING_MEMBER_MONTHLY     ?? '',
} as const

export type StripePlanKey = keyof typeof STRIPE_PLANS

export function planFromPriceId(priceId: string): 'standard' | 'driing' | 'decouverte' {
  if (priceId === STRIPE_PLANS.DRIING_MEMBER_MONTHLY) return 'driing'
  if (
    priceId === STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY ||
    priceId === STRIPE_PLANS.STANDARD_FOUNDING_YEARLY  ||
    priceId === STRIPE_PLANS.STANDARD_PUBLIC_MONTHLY
  ) return 'standard'
  return 'decouverte'
}
