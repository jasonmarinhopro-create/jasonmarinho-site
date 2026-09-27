// Contrat tel qu'affiché sur la page Contrats & paiements.
export type ContractRow = {
  id: string
  statut: 'en_attente' | 'signe' | 'annule' | string
  signature_date: string | null
  created_at: string
  locataire_prenom: string | null
  locataire_nom: string | null
  locataire_email: string | null
  logement_nom: string | null
  logement_adresse: string | null
  date_arrivee: string | null
  date_depart: string | null
  montant_loyer: number | null
  montant_caution: number | null
  stripe_payment_enabled: boolean | null
  stripe_payment_status: string | null
  stripe_deposit_status: string | null
  sejour_id: string | null
  token: string | null
  /** Fiche voyageur du séjour lié (déduit de sejour_id), pour les liens. */
  voyageur_id: string | null
}

/** Séjour à venir sans contrat, proposé par le bouton « Nouveau contrat ». */
export type ContractCandidate = {
  sejourId: string
  voyageurId: string
  guest: string
  logement: string | null
  dateArrivee: string | null
  dateDepart: string | null
}
