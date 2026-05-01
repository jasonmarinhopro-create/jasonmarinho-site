export const STRIPE_PRODUCTS = {
  MEMBRE_FONDATEUR: 'prod_UMfxy6jzpNEnfo',
  STANDARD:         'prod_UMfzYxk6I65MHu',
  DRIING_MEMBER:    'prod_UMg0lS8egTCzMj',
} as const

export const STRIPE_PLANS = {
  // Membre Fondateur, 1,98 €/mois · 19,98 €/an
  STANDARD_FOUNDING_MONTHLY: process.env.STRIPE_PRICE_STANDARD_FOUNDING_MONTHLY ?? 'price_1TNwbyJ7Hsyvd5AVv0FAWhj6',
  STANDARD_FOUNDING_YEARLY:  process.env.STRIPE_PRICE_STANDARD_FOUNDING_YEARLY  ?? 'price_1TNwdLJ7Hsyvd5AVmSRYghOk',

  // Standard public (futur), 3,98 €/mois · 38,98 €/an
  STANDARD_PUBLIC_MONTHLY:   process.env.STRIPE_PRICE_STANDARD_PUBLIC_MONTHLY   ?? 'price_1TNwdhJ7Hsyvd5AV5fY88XJ8',
  STANDARD_PUBLIC_YEARLY:    process.env.STRIPE_PRICE_STANDARD_PUBLIC_YEARLY    ?? 'price_1TNwiCJ7Hsyvd5AVu1XHPMMr',

  // Contribution Membre Driing, 0,98 €/mois · 9,98 €/an
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
