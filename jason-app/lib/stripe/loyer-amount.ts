// Montant encaissé en ligne pour le loyer : la part d'acompte seulement
// (acompte_percent, 50 ou 100), en centimes. Partagé par toutes les routes
// de paiement (avant le 04/10/2026, le lien de l'e-mail encaissait 100 %).
export function loyerChargeCents(loyer: number, acomptePercent: number): number {
  const pct = Number.isFinite(acomptePercent) && acomptePercent > 0 && acomptePercent <= 100 ? acomptePercent : 100
  return Math.round(loyer * pct / 100 * 100)
}
