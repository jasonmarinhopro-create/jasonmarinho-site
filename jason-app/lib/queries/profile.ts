import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getProfile() {
  noStore()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, driing_status, plan, stripe_subscription_id, stripe_subscription_status, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  const resolvedPlan = profile?.role === 'admin'
    ? 'driing'
    : (profile?.plan ?? 'decouverte')

  return {
    userId: user.id,
    full_name: profile?.full_name ?? null,
    role: (profile?.role ?? 'user') as 'user' | 'driing' | 'admin',
    driing_status: (profile?.driing_status ?? 'none') as 'none' | 'pending' | 'confirmed',
    plan: resolvedPlan as 'decouverte' | 'standard' | 'driing',
    stripe_subscription_id: profile?.stripe_subscription_id ?? null,
    stripe_subscription_status: profile?.stripe_subscription_status ?? null,
    stripe_customer_id: profile?.stripe_customer_id ?? null,
  }
}
