export const STRIPE_PRODUCTS = {
  MEMBRE_FONDATEUR: 'prod_UMfxy6jzpNEnfo',
  STANDARD:         'prod_UMfzYxk6I65MHu',
  DRIING_MEMBER:    'prod_UMg0lS8egTCzMj',
} as const

// Depuis juin 2026 le plan Standard est vendu en annuel uniquement (les
// price_id mensuels restent en DB pour les abonnés historiques mais ne
// sont plus proposés à la souscription depuis l'UI dashboard ni site
// statique). planFromPriceId reconnaît toujours les 4 variantes pour ne
// pas casser les abonnés existants au renouvellement.
export const STRIPE_PLANS = {
  // Membre Fondateur, 19,98 €/an HT (à vie tant que l'abonnement reste actif)
  STANDARD_FOUNDING_MONTHLY: process.env.STRIPE_PRICE_STANDARD_FOUNDING_MONTHLY ?? 'price_1TNwbyJ7Hsyvd5AVv0FAWhj6',
  STANDARD_FOUNDING_YEARLY:  process.env.STRIPE_PRICE_STANDARD_FOUNDING_YEARLY  ?? 'price_1TNwdLJ7Hsyvd5AVmSRYghOk',

  // Standard public (offre Fondateur épuisée), 38,98 €/an HT
  STANDARD_PUBLIC_MONTHLY:   process.env.STRIPE_PRICE_STANDARD_PUBLIC_MONTHLY   ?? 'price_1TNwdhJ7Hsyvd5AV5fY88XJ8',
  STANDARD_PUBLIC_YEARLY:    process.env.STRIPE_PRICE_STANDARD_PUBLIC_YEARLY    ?? 'price_1TNwiCJ7Hsyvd5AVu1XHPMMr',

  // Contribution Membre Driing, 9,98 €/an HT (legacy, n'est plus proposé à la souscription)
  DRIING_MEMBER_MONTHLY:     process.env.STRIPE_PRICE_DRIING_MEMBER_MONTHLY     ?? 'price_1TNweJJ7Hsyvd5AV4hnVjadk',
  DRIING_MEMBER_YEARLY:      process.env.STRIPE_PRICE_DRIING_MEMBER_YEARLY      ?? 'price_1TNwjhJ7Hsyvd5AVioj16oD0',
} as const

export type StripePlanKey = keyof typeof STRIPE_PLANS

export const ALL_VALID_PRICE_IDS = new Set(
  Object.values(STRIPE_PLANS).filter(Boolean)
)

export function planFromPriceId(priceId: string): 'standard' | 'driing' | 'decouverte' {
  if (
    priceId === STRIPE_PLANS.DRIING_MEMBER_MONTHLY ||
    priceId === STRIPE_PLANS.DRIING_MEMBER_YEARLY
  ) return 'driing'
  if (
    priceId === STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY ||
    priceId === STRIPE_PLANS.STANDARD_FOUNDING_YEARLY  ||
    priceId === STRIPE_PLANS.STANDARD_PUBLIC_MONTHLY   ||
    priceId === STRIPE_PLANS.STANDARD_PUBLIC_YEARLY
  ) return 'standard'
  return 'decouverte'
}
