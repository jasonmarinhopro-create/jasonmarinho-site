import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LogementDetail from './LogementDetail'
import TitleSetter from '@/components/layout/TitleSetter'
import { getLogementIcalStatus } from '../actions'

export default async function LogementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  // Logement + contracts en parallèle : tous deux n'ont besoin que de `id`.
  // sejours doit attendre logement.nom (pas encore de logement_id sur sejours).
  const [
    { data: logement, error: logementError },
    { data: contractsByLogementId },
  ] = await Promise.all([
    supabase
      .from('logements')
      .select('*')
      .eq('id', id)
      .eq('user_id', profile.userId)
      .single(),
    supabase
      .from('contracts')
      .select('id, statut, date_arrivee, date_depart, montant_loyer, locataire_prenom, locataire_nom')
      .eq('user_id', profile.userId)
      .eq('logement_id', id),
  ])

  if (logementError || !logement) notFound()

  // Séjours rattachés (matching par nom, logement_id n'existe pas encore sur sejours)
  // + statut iCal pour la section sync (en parallèle car indépendants)
  const [{ data: sejours }, icalStatus] = await Promise.all([
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, contrat_statut, contrat_date_signature, contrat_lien, voyageurs(id, prenom, nom, email, telephone)')
      .eq('user_id', profile.userId)
      .eq('logement', logement.nom)
      .order('date_arrivee', { ascending: false }),
    getLogementIcalStatus(id),
  ])

  // Supabase retourne voyageurs sous forme d'array (relation 1-1), on aplatit
  const sejoursList = ((sejours ?? []) as any[]).map(s => ({
    ...s,
    voyageurs: Array.isArray(s.voyageurs) ? (s.voyageurs[0] ?? null) : (s.voyageurs ?? null),
  })) as Array<{
    id: string
    voyageur_id: string
    logement: string | null
    date_arrivee: string
    date_depart: string
    montant: number | null
    contrat_statut: string | null
    contrat_date_signature: string | null
    contrat_lien: string | null
    voyageurs: { id: string; prenom: string; nom: string; email: string | null; telephone: string | null } | null
  }>

  return (
    <>
      <TitleSetter title={logement.nom ?? 'Logement'} />
      <LogementDetail
        logement={logement as any}
        sejours={sejoursList}
        contractsCount={contractsByLogementId?.length ?? 0}
        icalStatus={icalStatus}
      />
    </>
  )
}
