import { redirect } from 'next/navigation'

// Ancienne adresse : l'onglet Performances de Mes finances (refonte sept. 2026).
// Types conservés pour l'ancien PerformancesView.

export type SejourRow = {
  id: string
  voyageur_id: string | null
  logement: string | null
  date_arrivee: string
  date_depart: string
  montant: number | null
  commission_montant?: number | null
  contrat_plateforme?: string | null
  created_at: string | null
}

export type ChargeRow = {
  logement_nom: string | null
  montant: number
  date_charge: string
  categorie: string | null
  deductible: boolean | null
}

export type LogementRow = {
  id: string
  nom: string
  adresse: string | null
  ville: string | null      // dérivé depuis adresse côté serveur
  pays: string | null
  tarif_nuitee_moyen: number | null
}

export type VoyageurMin = {
  id: string
  source: string | null
}

export default function PerformancesRedirect() {
  redirect('/dashboard/finances/performances')
}
