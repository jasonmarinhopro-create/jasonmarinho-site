import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import CreerFicheMenage from './CreerFicheMenage'

export const metadata = { title: 'Créer ma fiche équipe ménage' }
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
  if (!user) redirect('/auth/login?as=menage')

  const admin = getServiceClient()
  const { data: existing } = await admin
    .from('cleaners')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    const isOrphan = existing.status === 'pending_payment' && !existing.stripe_subscription_id
    if (!isOrphan) redirect('/dashboard/ma-fiche-menage')
    await admin.from('cleaners').delete().eq('id', existing.id)
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const { count: founderCount } = await admin
    .from('cleaners')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'fondateur')
    .in('status', ['active', 'pending_payment', 'approved_pending_payment'])
  const tier: 'fondateur' | 'standard' = (founderCount ?? 0) < FOUNDER_QUOTA ? 'fondateur' : 'standard'

  return (
    <CreerFicheMenage
      email={user.email ?? ''}
      defaultFullName={profile?.full_name ?? ''}
      tier={tier}
    />
  )
}
