// Un séjour relié à un contrat actif (contracts.sejour_id) est une seule et
// même réservation : ne la compter qu'une fois dans les revenus. Avant (sept.
// 2026), le journal Encaissements et l'accueil additionnaient le loyer du
// contrat ET le montant du séjour (ex. 350 € affichés deux fois pour Casa Do
// Pedreiro). La ligne du contrat est gardée : elle porte le statut de paiement
// et le nom du locataire. Les contrats annulés doivent être exclus en amont
// (leur séjour redevient alors la seule ligne).

export function sejoursSansContrat<S extends { id: string }>(
  sejours: S[],
  contracts: Array<{ sejour_id?: string | null; statut?: string | null }>,
): S[] {
  const lies = new Set(
    contracts.filter(c => c.statut !== 'annule' && c.sejour_id).map(c => c.sejour_id as string),
  )
  return sejours.filter(s => !lies.has(s.id))
}
