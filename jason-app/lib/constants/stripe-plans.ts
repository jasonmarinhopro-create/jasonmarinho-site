// Produits Stripe (prod_*)
export const STRIPE_PRODUCTS = {
  MEMBRE_FONDATEUR: 'prod_UMfxy6jzpNEnfo', // Membre Fondateur — 4,98€/mois + 48€/an
  STANDARD:         'prod_UMfzYxk6I65MHu', // Standard public — 8,98€/mois + 86€/an (futur)
  DRIING_MEMBER:    'prod_UMg0lS8egTCzMj', // Contribution Membre Driing — 2,98€/mois + 29€/an
} as const

// Prix Stripe (price_*) — à renseigner depuis le Stripe Dashboard
// Cliquer sur chaque tarif dans le produit pour obtenir l'ID price_xxx
export const STRIPE_PLANS = {
  // Membre Fondateur (née en 98 🎂)
  STANDARD_FOUNDING_MONTHLY: process.env.STRIPE_PRICE_STANDARD_FOUNDING_MONTHLY ?? '', // 1,98 €/mois
  STANDARD_FOUNDING_YEARLY:  process.env.STRIPE_PRICE_STANDARD_FOUNDING_YEARLY  ?? '', // 19,98 €/an

  // Standard public (tarif futur — ne pas activer avant la fin de la phase lancement)
  STANDARD_PUBLIC_MONTHLY:   process.env.STRIPE_PRICE_STANDARD_PUBLIC_MONTHLY   ?? '', // 3,98 €/mois
  STANDARD_PUBLIC_YEARLY:    process.env.STRIPE_PRICE_STANDARD_PUBLIC_YEARLY    ?? '', // 38,98 €/an

  // Contribution Membre Driing
  DRIING_MEMBER_MONTHLY:     process.env.STRIPE_PRICE_DRIING_MEMBER_MONTHLY     ?? '', // 0,98 €/mois
  DRIING_MEMBER_YEARLY:      process.env.STRIPE_PRICE_DRIING_MEMBER_YEARLY      ?? '', // 9,98 €/an
} as const

export type StripePlanKey = keyof typeof STRIPE_PLANS

// Tous les price_id valides (filtrés si vides)
export const ALL_VALID_PRICE_IDS = new Set(
  Object.values(STRIPE_PLANS).filter(Boolean)
)

export function planFromPriceId(priceId: string): 'standard' | 'driing' | 'decouverte' {
  const { DRIING_MEMBER_MONTHLY, DRIING_MEMBER_YEARLY } = STRIPE_PLANS
  if (priceId === DRIING_MEMBER_MONTHLY || priceId === DRIING_MEMBER_YEARLY) return 'driing'
  if (
    priceId === STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY ||
    priceId === STRIPE_PLANS.STANDARD_FOUNDING_YEARLY  ||
    priceId === STRIPE_PLANS.STANDARD_PUBLIC_MONTHLY   ||
    priceId === STRIPE_PLANS.STANDARD_PUBLIC_YEARLY
  ) return 'standard'
  return 'decouverte'
}
