import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import CreerFichePhotographe from './CreerFichePhotographe'

export const metadata = { title: 'Créer ma fiche photographe' }
export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const FOUNDER_QUOTA = 20

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?as=photographe')

  const admin = getServiceClient()
  // Si une fiche existe déjà pour ce compte (active ou pending), on ne rejoue
  // pas le formulaire d'inscription : redirige direct vers la fiche.
  const { data: existing } = await admin
    .from('photographers')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    const isOrphan = existing.status === 'pending_payment' && !existing.stripe_subscription_id
    if (!isOrphan) redirect('/dashboard/ma-fiche-photographe')
    // orphelin (paiement Stripe interrompu) : on nettoie pour permettre un retry
    await admin.from('photographers').delete().eq('id', existing.id)
  }

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
    .in('status', ['active', 'pending_payment', 'approved_pending_payment'])
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'

  return (
    <CreerFichePhotographe
      email={user.email ?? ''}
      defaultFullName={profile?.full_name ?? ''}
      tier={tier}
    />
  )
}
