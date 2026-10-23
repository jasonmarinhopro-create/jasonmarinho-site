import { getServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { founderSeatFilter } from '@/lib/pros/founder-seats'
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import CreerFichePhotographe from './CreerFichePhotographe'

export const metadata = { title: 'Créer ma fiche photographe' }
export const dynamic = 'force-dynamic'

const FOUNDER_QUOTA = 20

export default async function Page() {
  const user = await getAuthIdentity()
  if (!user) redirect('/auth/login?as=photographe')

  const admin = getServiceClient()
  // Si une fiche existe déjà pour ce compte (active ou pending), on ne rejoue
  // pas le formulaire d'inscription : redirige direct vers la fiche.
  const { data: existing } = await admin
    .from('photographers')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()
  // Fiche déjà enregistrée, même sans paiement : on ne la supprime plus, Ma fiche
  // propose « Finaliser mon paiement » (avant : formulaire à refaire en entier).
  if (existing) redirect('/dashboard/ma-fiche-photographe')

  // Pré-remplit le nom complet depuis le profile
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  // Determine le tier qui sera attribué (juste pour l'affichage du tarif)
  const { count: founderCount } = await admin
    .from('photographers')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur')
    .or(founderSeatFilter())
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'

  return (
    <CreerFichePhotographe
      email={user.email ?? ''}
      defaultFullName={profile?.full_name ?? ''}
      tier={tier}
    />
  )
}
