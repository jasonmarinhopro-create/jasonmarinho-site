import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import VoyageursView, { type ContractRow } from './VoyageursView'
import OnboardingTour, { VOYAGEURS_STEPS } from '../OnboardingTour'

export default async function VoyageursPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null

  // Fetch voyageurs + contrats en parallèle. Les contrats alimentent la
  // nouvelle tab "Contrats" (vue d'ensemble filtrable, utile surtout pour
  // les réservations directes — Airbnb/Booking ont leurs propres CGU).
  const [voyageursRes, contractsRes] = await Promise.all([
    supabase
      .from('voyageurs')
      .select('id, prenom, nom, email, telephone, notes, tags, source, bloque, id_verifie, note_privee, created_at, updated_at, sejours(id, date_arrivee, date_depart, montant)')
      .eq('user_id', profile.userId)
      .order('updated_at', { ascending: false })
      .limit(500),
    supabase
      .from('contracts')
      .select('id, statut, signature_date, created_at, locataire_prenom, locataire_nom, locataire_email, logement_nom, logement_adresse, date_arrivee, date_depart, montant_loyer, montant_caution, stripe_payment_enabled, stripe_payment_status, stripe_deposit_status, sejour_id, token')
      .eq('user_id', profile.userId)
      .order('created_at', { ascending: false })
      .limit(500),
  ])
  const { data: voyageurs, error } = voyageursRes
  const { data: contracts } = contractsRes

  // Table manquante → affiche quand même la vue (état vide avec message clair)
  if (error && error.code !== '42P01') console.error('[voyageurs]', error.message)

  const list = (voyageurs ?? []) as Array<{
    id: string; prenom: string; nom: string; email: string | null
    telephone: string | null; notes: string | null
    tags: string[] | null; source: string | null; bloque: boolean | null
    id_verifie: boolean | null; note_privee: number | null
    created_at: string; updated_at: string
    sejours: Array<{ id: string; date_arrivee: string; date_depart: string; montant: number | null }>
    is_flagged: boolean
  }>

  // Croiser avec reported_guests pour badge "Signalé"
  const identifiers = list.flatMap(v =>
    [v.email?.toLowerCase(), v.telephone].filter(Boolean) as string[]
  )
  if (identifiers.length > 0) {
    const { data: reported } = await supabase
      .from('reported_guests')
      .select('identifier')
      .in('identifier', identifiers)
      .eq('is_validated', true)

    const flagged = new Set((reported ?? []).map(r => r.identifier))
    list.forEach(v => {
      v.is_flagged = !!(
        (v.email && flagged.has(v.email.toLowerCase())) ||
        (v.telephone && flagged.has(v.telephone))
      )
    })
  }

  return (
    <>
      <OnboardingTour
        userId={profile.userId}
        steps={VOYAGEURS_STEPS}
        storageScope="voyageurs"
        initiallyDone={profile.onboarding_completed_steps.includes('tour:voyageurs')}
      />
      <VoyageursView voyageurs={list} tableReady={!error} contracts={(contracts ?? []) as ContractRow[]} />
    </>
  )
}
