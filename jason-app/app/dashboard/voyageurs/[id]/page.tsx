import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import dynamic from 'next/dynamic'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { notFound } from 'next/navigation'

const VoyageurDetail = dynamic(() => import('./VoyageurDetail'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
})

export default async function VoyageurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()

  // Phase A : toutes les queries indépendantes en parallèle
  const [voyageurRes, sejoursRes, authRes, profileDataRes, logementsRes] = await Promise.all([
    supabase
      .from('voyageurs')
      .select('id, prenom, nom, email, telephone, notes, created_at')
      .eq('id', id)
      .eq('user_id', profile.userId)
      .single(),
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, contrat_statut, contrat_date_signature, contrat_lien')
      .eq('voyageur_id', id)
      .eq('user_id', profile.userId)
      .order('date_arrivee', { ascending: false }),
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('iban, bic, adresse, stripe_account_id, stripe_onboarding_complete')
      .eq('id', profile.userId)
      .single(),
    supabase
      .from('logements')
      .select('id, nom, adresse, telephone, description, capacite_max, reglement_interieur, conditions_annulation, animaux_acceptes, fumeur_accepte, methodes_paiement')
      .eq('user_id', profile.userId)
      .order('created_at', { ascending: false }),
  ])

  const voyageur = voyageurRes.data
  if (!voyageur) notFound()

  const sejours = sejoursRes.data
  const user = authRes.data.user
  const profileData = profileDataRes.data
  const logements = logementsRes.data

  // Phase B : reported query dépend de voyageur.email / voyageur.telephone
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
  const meta = user?.user_metadata ?? {}
  const fullNameParts = ((meta.full_name ?? '') as string).trim().split(' ')

  const bailleur = {
    prenom:      ((meta.prenom ?? meta.first_name ?? fullNameParts[0] ?? '') as string),
    nom:         ((meta.nom ?? meta.last_name ?? (fullNameParts.length > 1 ? fullNameParts.slice(1).join(' ') : '')) as string),
    email:       user?.email ?? '',
    iban:        profileData?.iban ?? null,
    bic:         profileData?.bic ?? null,
    adresse:     profileData?.adresse ?? null,
    stripeReady: !!(profileData?.stripe_account_id && profileData?.stripe_onboarding_complete),
  }

  return (
    <>
      <Header title={`${voyageur.prenom} ${voyageur.nom}`} userName={profile.full_name ?? undefined} />
      <VoyageurDetail
        voyageur={voyageur}
        sejours={sejours ?? []}
        isFlagged={isFlagged}
        bailleur={bailleur}
        logements={(logements ?? []) as any[]}
        plan={profile.plan ?? 'decouverte'}
      />
    </>
  )
}
