// Contrats dont le loyer en ligne (Stripe) n'est pas encaissé alors que
// l'arrivée approche (7 jours ou moins) ou est passée. La source de vérité
// métier (séjour + contrat) est notre base, pas Stripe.

import { parisToday } from './deposit-window'

export interface ContractImpaye {
  id: string
  statut: string | null
  locataire_prenom: string | null
  locataire_nom: string | null
  locataire_email: string | null
  logement_nom: string | null
  montant_loyer: number | null
  /** Part du loyer demandée en ligne (acompte), en euros */
  montant_du: number | null
  acompte_percent: number
  date_arrivee: string | null
  date_depart: string | null
  /** > 0 : jours de retard depuis l'arrivée ; <= 0 : arrivée dans -n jours */
  daysOverdue: number
}

export interface ImpayeInput {
  id: string
  locataire_prenom: string | null
  locataire_nom: string | null
  locataire_email: string | null
  logement_nom: string | null
  montant_loyer: number | null
  acompte_percent?: number | null
  date_arrivee: string | null
  date_depart: string | null
  statut: string | null
  stripe_payment_status: string | null
  stripe_payment_enabled: boolean | null
}

/** Nombre de jours entre deux dates AAAA-MM-JJ (b - a), sans décalage horaire */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86400000)
}

/** @param today date du jour AAAA-MM-JJ (heure de Paris par défaut) */
export function deriveImpayes(contracts: ImpayeInput[], today: string = parisToday()): ContractImpaye[] {
  return contracts
    .filter(c => {
      if (c.statut === 'annule') return false
      if (!c.stripe_payment_enabled) return false  // pas concerné par l'encaissement Stripe
      if (c.stripe_payment_status === 'paid') return false
      if (!c.date_arrivee) return false
      return daysBetween(today, c.date_arrivee) <= 7
    })
    .map(c => {
      const pct = Number(c.acompte_percent ?? 100) || 100
      const du = c.montant_loyer != null ? Math.round(Number(c.montant_loyer) * pct) / 100 : null
      return {
        id: c.id,
        statut: c.statut,
        locataire_prenom: c.locataire_prenom,
        locataire_nom: c.locataire_nom,
        locataire_email: c.locataire_email,
        logement_nom: c.logement_nom,
        montant_loyer: c.montant_loyer,
        montant_du: du,
        acompte_percent: pct,
        date_arrivee: c.date_arrivee,
        date_depart: c.date_depart,
        daysOverdue: daysBetween(c.date_arrivee!, today),
      }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}
