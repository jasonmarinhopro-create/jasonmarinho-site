// Frais de paiement en ligne facturés aux hôtes (05/10/2026). Les comptes
// Express sont créés avec controller.fees.payer = 'application' : Stripe
// facture ses frais à la plateforme. Jason les répercute par l'outil de
// tarification de Connect (Stripe → Paramètres → Connect → Tarification),
// rien dans le code ne prélève de commission. Ces chiffres doivent rester
// identiques à la règle active dans Stripe (et aux pages du site :
// services/contrats, aide configurer-stripe-connect).
export const PAYMENT_FEES = {
  pct: 2,
  fixed: 0.3,
  /** Suppléments de la règle Stripe */
  ukCard: 1,
  nonEuropeCard: 1.75,
  currencyConversion: 2,
} as const

const fr = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })

/** « 2 % + 0,30 € » */
export const PAYMENT_FEES_LABEL = `${fr(PAYMENT_FEES.pct)} % + ${fr(PAYMENT_FEES.fixed)} €`

/** Frais pour un montant payé avec une carte européenne */
export function paymentFee(amount: number): number {
  return Math.round((amount * PAYMENT_FEES.pct / 100 + PAYMENT_FEES.fixed) * 100) / 100
}
