import { cache } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export const getProfile = cache(async () => {
  noStore() // empêche Next.js de mettre en cache la requête Supabase entre les requêtes
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, driing_status, plan, stripe_subscription_id, stripe_subscription_status, stripe_customer_id')
    .eq('id', session.user.id)
    .single()

  const resolvedPlan = profile?.role === 'admin'
    ? 'driing'
    : (profile?.plan ?? 'decouverte')

  return {
    userId: session.user.id,
    full_name: profile?.full_name ?? null,
    role: (profile?.role ?? 'user') as 'user' | 'driing' | 'admin',
    driing_status: (profile?.driing_status ?? 'none') as 'none' | 'pending' | 'confirmed',
    plan: resolvedPlan as 'decouverte' | 'standard' | 'driing',
    stripe_subscription_id: profile?.stripe_subscription_id ?? null,
    stripe_subscription_status: profile?.stripe_subscription_status ?? null,
    stripe_customer_id: profile?.stripe_customer_id ?? null,
  }
})
