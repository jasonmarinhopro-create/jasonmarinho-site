import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import VoyageurDetail from './VoyageurDetail'
import { notFound } from 'next/navigation'

export default async function VoyageurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  const { data: voyageur } = await supabase
    .from('voyageurs')
    .select('*')
    .eq('id', id)
    .eq('user_id', profile.userId)
    .single()

  if (!voyageur) notFound()

  const { data: sejours } = await supabase
    .from('sejours')
    .select('*')
    .eq('voyageur_id', id)
    .eq('user_id', profile.userId)
    .order('date_arrivee', { ascending: false })

  // Vérifier si signalé
  const identifiers = [voyageur.email?.toLowerCase(), voyageur.telephone].filter(Boolean) as string[]
  let isFlagged = false
  if (identifiers.length > 0) {
    const { data: reported } = await supabase
      .from('reported_guests')
      .select('id')
      .in('identifier', identifiers)
      .eq('is_validated', true)
      .limit(1)
    isFlagged = (reported ?? []).length > 0
  }

  // Profil bailleur (depuis les métadonnées utilisateur Supabase Auth)
  const { data: { user } } = await supabase.auth.getUser()
  const meta = user?.user_metadata ?? {}
  // Découpe full_name si prenom/nom ne sont pas définis explicitement
  const fullNameParts = ((meta.full_name ?? '') as string).trim().split(' ')

  // IBAN/BIC depuis la table profiles
  const { data: profileData } = await supabase
    .from('profiles')
    .select('iban, bic')
    .eq('id', profile.userId)
    .single()

  const bailleur = {
    prenom: ((meta.prenom ?? meta.first_name ?? fullNameParts[0] ?? '') as string),
    nom:    ((meta.nom ?? meta.last_name ?? (fullNameParts.length > 1 ? fullNameParts.slice(1).join(' ') : '')) as string),
    email:  user?.email ?? '',
    iban:   profileData?.iban ?? null,
    bic:    profileData?.bic ?? null,
  }

  // Fiches logements de l'hôte (pour pré-remplir les contrats)
  const { data: logements } = await supabase
    .from('logements')
    .select('id, nom, adresse, description, capacite_max, reglement_interieur, conditions_annulation, animaux_acceptes, fumeur_accepte')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title={`${voyageur.prenom} ${voyageur.nom}`} userName={profile.full_name ?? undefined} />
      <VoyageurDetail
        voyageur={voyageur}
        sejours={sejours ?? []}
        isFlagged={isFlagged}
        bailleur={bailleur}
        logements={(logements ?? []) as any[]}
      />
    </>
  )
}
