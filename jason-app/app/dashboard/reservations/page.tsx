import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ReservationsView from './ReservationsView'
import type { Reservation, LogementLite } from './types'

export const metadata = { title: 'Mes réservations' }
export const revalidate = 30

/**
 * Page "Mes réservations" (Étape 7bis du refactor dashboard).
 * Detachee du /calendrier — page dediee au pilotage des reservations
 * avec stats, filtres, tri, vues cartes/tableau et drawer de detail.
 *
 * Fusionne contracts + sejours en un modele unique de Reservation. Les
 * contracts prevalent : si un sejour est deja rattache a un contrat via
 * sejour_id, on garde uniquement le contract (evite les doublons).
 */
export default async function ReservationsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  const supabase = await createClient()
  const userId = profile.userId

  const [
    { data: contracts },
    { data: sejoursRaw },
    { data: logementsRaw },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, logement_nom, logement_id, date_arrivee, date_depart, statut, checklist_status, sejour_id, montant_loyer, locataire_prenom, locataire_nom, locataire_email, locataire_telephone, source, stripe_payment_status, stripe_payment_enabled, nb_voyageurs')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, logement_id, date_arrivee, date_depart, montant, contrat_statut, contrat_plateforme, nb_voyageurs, voyageurs(prenom, nom, email, telephone)')
      .eq('user_id', userId)
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    supabase
      .from('logements')
      .select('id, nom')
      .eq('user_id', userId)
      .order('nom'),
  ])

  // Contracts qui pointent sur un sejour → on skip le sejour pour ne pas dupliquer
  const sejourIdsWithContract = new Set(
    (contracts ?? [])
      .map(c => (c as any).sejour_id as string | null)
      .filter((v): v is string => !!v),
  )

  const reservations: Reservation[] = []

  // Contracts d'abord (plus riche : contrat signe, paiement, etc.)
  ;(contracts ?? []).forEach(c => {
    const nom = [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ').trim() || 'Voyageur'
    reservations.push({
      id: `contract-${c.id}`,
      source: 'contract',
      sourceId: c.id,
      voyageur_id: null,
      voyageur_name: nom,
      voyageur_email: c.locataire_email ?? null,
      voyageur_phone: c.locataire_telephone ?? null,
      logement_id: c.logement_id ?? null,
      logement_name: c.logement_nom ?? 'Logement',
      date_arrivee: c.date_arrivee,
      date_depart: c.date_depart,
      montant: c.montant_loyer ?? null,
      nb_voyageurs: (c as any).nb_voyageurs ?? null,
      platform: normalizePlatform(c.source),
      contract_status: c.statut ?? null,
      payment_status: (c as any).stripe_payment_enabled ? (c.stripe_payment_status ?? null) : null,
      checklist_status: (c.checklist_status as Record<string, boolean>) ?? null,
    })
  })

  // Puis les sejours (uniquement ceux sans contract lie)
  ;(sejoursRaw ?? [])
    .filter((s: any) => !sejourIdsWithContract.has(s.id))
    .forEach((s: any) => {
      const v = s.voyageurs as { prenom?: string; nom?: string; email?: string; telephone?: string } | null
      const nom = v ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || 'Voyageur' : 'Voyageur'
      reservations.push({
        id: `sejour-${s.id}`,
        source: 'sejour',
        sourceId: s.id,
        voyageur_id: s.voyageur_id ?? null,
        voyageur_name: nom,
        voyageur_email: v?.email ?? null,
        voyageur_phone: v?.telephone ?? null,
        logement_id: s.logement_id ?? null,
        logement_name: s.logement ?? 'Logement',
        date_arrivee: s.date_arrivee,
        date_depart: s.date_depart,
        montant: s.montant ?? null,
        nb_voyageurs: s.nb_voyageurs ?? null,
        platform: normalizePlatform(s.contrat_plateforme),
        contract_status: s.contrat_statut ?? null,
        payment_status: null,
        checklist_status: null,
      })
    })

  const logements: LogementLite[] = (logementsRaw ?? []).map((l: any) => ({
    id: l.id, nom: l.nom ?? 'Logement',
  }))

  return <ReservationsView reservations={reservations} logements={logements} />
}

/** Normalise n'importe quel champ source/plateforme vers un identifiant clair. */
function normalizePlatform(raw: string | null | undefined): Reservation['platform'] {
  if (!raw) return 'direct'
  const s = String(raw).toLowerCase()
  if (s.includes('airbnb')) return 'airbnb'
  if (s.includes('booking')) return 'booking'
  if (s.includes('driing')) return 'driing'
  if (s.includes('vrbo') || s.includes('abritel')) return 'vrbo'
  return 'direct'
}
