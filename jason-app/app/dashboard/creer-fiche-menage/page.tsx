import { getServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { founderSeatFilter } from '@/lib/pros/founder-seats'
import { getAuthIdentity } from '@/lib/supabase/auth-user'
import CreerFicheMenage from './CreerFicheMenage'

export const metadata = { title: 'Créer ma fiche équipe ménage' }
export const dynamic = 'force-dynamic'

const FOUNDER_QUOTA = 20

export default async function Page() {
  const user = await getAuthIdentity()
  if (!user) redirect('/auth/login?as=menage')

  const admin = getServiceClient()
  const { data: existing } = await admin
    .from('cleaners')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()
  // Fiche déjà enregistrée, même sans paiement : on ne la supprime plus, Ma fiche
  // propose « Finaliser mon paiement » (avant : formulaire à refaire en entier).
  if (existing) redirect('/dashboard/ma-fiche-menage')

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const { count: founderCount } = await admin
    .from('cleaners')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur')
    .or(founderSeatFilter())
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'

  return (
    <CreerFicheMenage
      email={user.email ?? ''}
      defaultFullName={profile?.full_name ?? ''}
      tier={tier}
    />
  )
}
