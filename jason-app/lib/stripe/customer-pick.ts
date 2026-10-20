// Choix du client Stripe à réutiliser parmi ceux qui ont la même adresse (règle pure, testée)
export interface CustomerLite { id: string; created: number; hasPaymentMethod: boolean }

/** Celui qui a une carte enregistrée d'abord, sinon le plus ancien (le premier créé pour cette personne) */
export function pickCustomer(list: CustomerLite[]): string | undefined {
  const uniq = [...new Map(list.map(c => [c.id, c])).values()]
  uniq.sort((a, b) => Number(b.hasPaymentMethod) - Number(a.hasPaymentMethod) || a.created - b.created)
  return uniq[0]?.id
}
