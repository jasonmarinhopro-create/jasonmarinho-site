import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import VoyageursView from './VoyageursView'
import { parisToday } from '@/lib/stripe/deposit-window'
import OnboardingTour, { VOYAGEURS_STEPS } from '../OnboardingTour'
import { flaggedVoyageurs } from '@/lib/securite/lookup'
import { isPositive } from '@/lib/securite/identifiers'

// Cette page et ses server actions (addVoyageur, checkVoyageurSignale…)
// n'avaient aucun maxDuration explicite, donc soumis à la limite Vercel par
// défaut (10s sur Hobby) — un simple insert d'une ligne est normalement
// instantané, mais un cold start (fonction ou pool de connexions Supabase
// réveillés après inactivité) peut suffire à la dépasser, provoquant un
// vrai 504 côté client alors que l'écriture elle-même n'a rien de lent.
export const maxDuration = 60

export default async function VoyageursPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null

  // Les contrats ont leur page dédiée (/dashboard/contrats).
  const [voyageursRes, declRes] = await Promise.all([
    supabase
      .from('voyageurs')
      .select('id, prenom, nom, email, telephone, notes, tags, source, bloque, id_verifie, note_privee, checkin_expected_count, nationalite, created_at, updated_at, sejours(id, date_arrivee, date_depart, montant)')
      .eq('user_id', profile.userId)
      // Filtre la relation IMBRIQUÉE : les séjours annulés sortent des
      // compteurs de la liste (nb séjours, CA cumulé, filtre « À venir »)
      .is('sejours.annule_at', null)
      .order('updated_at', { ascending: false })
      .limit(500),
    // Déclarations obligatoires en attente (badge du lien « Déclarations »)
    supabase
      .from('guest_declarations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.userId)
      .eq('statut', 'a_faire'),
  ])
  const { data: voyageurs, error } = voyageursRes

  // Table manquante → affiche quand même la vue (état vide avec message clair)
  if (error && error.code !== '42P01') console.error('[voyageurs]', error.message)

  const list = (voyageurs ?? []) as Array<{
    id: string; prenom: string; nom: string; email: string | null
    telephone: string | null; notes: string | null
    tags: string[] | null; source: string | null; bloque: boolean | null
    id_verifie: boolean | null; note_privee: number | null
    checkin_expected_count: number | null
    nationalite: string | null
    created_at: string; updated_at: string
    sejours: Array<{ id: string; date_arrivee: string; date_depart: string; montant: number | null }>
    is_flagged: boolean
  }>

  // Badge « Signalé » : signalements négatifs validés de TOUTE la communauté,
  // téléphone comparé sous toutes ses formes (06…, +33…). Avant sept. 2026 :
  // numéro comparé tel quel et témoignages positifs comptés comme signalements.
  const flagged = await flaggedVoyageurs(list, t => !isPositive(t))
  list.forEach(v => { v.is_flagged = flagged.has(v.id) })

  return (
    <>
      <OnboardingTour
        userId={profile.userId}
        steps={VOYAGEURS_STEPS}
        storageScope="voyageurs"
        initiallyDone={profile.onboarding_completed_steps.includes('tour:voyageurs')}
      />
      <VoyageursView voyageurs={list} tableReady={!error} pendingDeclarations={declRes.count ?? 0} today={parisToday()} />
    </>
  )
}
