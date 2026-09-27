// Contrats qui attendent une action de l'hôte. Partagé entre la page
// « Contrats & paiements » et l'accueil (« À faire »).

export interface ContractTodoInput {
  id: string
  statut: string
  date_arrivee: string | null
  date_depart: string | null
  stripe_payment_enabled: boolean | null
  stripe_payment_status: string | null
  stripe_deposit_status: string | null
}

export type ContractTodoKind = 'a_signer' | 'loyer_en_attente' | 'caution_a_liberer'

export interface ContractTodos<T> {
  /** Envoyé, pas encore signé, séjour pas terminé. */
  aSigner: T[]
  /** Signé, paiement en ligne activé, loyer pas encore encaissé (ou échec). */
  loyerEnAttente: T[]
  /** Caution bloquée sur la carte et séjour terminé : à libérer ou encaisser. */
  cautionALiberer: T[]
}

/** @param today date du jour au format AAAA-MM-JJ */
export function contractTodos<T extends ContractTodoInput>(contracts: T[], today: string): ContractTodos<T> {
  const byArrival = (a: T, b: T) => (a.date_arrivee ?? '9999').localeCompare(b.date_arrivee ?? '9999')
  const notOver = (c: T) => !c.date_depart || c.date_depart >= today

  return {
    aSigner: contracts.filter(c => c.statut === 'en_attente' && notOver(c)).sort(byArrival),
    loyerEnAttente: contracts
      .filter(c => c.statut === 'signe' && c.stripe_payment_enabled && c.stripe_payment_status !== 'paid' && notOver(c))
      .sort(byArrival),
    cautionALiberer: contracts
      .filter(c => c.statut !== 'annule' && c.stripe_deposit_status === 'held' && !!c.date_depart && c.date_depart <= today)
      .sort((a, b) => (a.date_depart ?? '').localeCompare(b.date_depart ?? '')),
  }
}

export function contractTodoCount(t: ContractTodos<unknown>): number {
  return t.aSigner.length + t.loyerEnAttente.length + t.cautionALiberer.length
}
