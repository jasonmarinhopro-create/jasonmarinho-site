import { cache } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'djason.marinho@gmail.com'

// cache() deduplicates calls within the same request — layout + page both call this
// but only 1 DB round-trip happens. noStore() inside still prevents Next.js page caching.
export const getProfile = cache(async () => {
  noStore()
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Admin detection by email — independent of DB columns, always reliable
  const isAdmin = session.user.email === ADMIN_EMAIL

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, driing_status, stripe_subscription_id, stripe_subscription_status, stripe_customer_id, is_contributor')
    .eq('id', session.user.id)
    .maybeSingle()

  const isDriingMember = profile?.plan === 'driing' || profile?.driing_status === 'confirmed'
  const resolvedPlan = isAdmin ? 'driing' : (isDriingMember ? 'driing' : (profile?.plan ?? 'decouverte'))

  return {
    userId: session.user.id,
    full_name: profile?.full_name ?? (session.user.user_metadata?.full_name as string | undefined) ?? null,
    role: (isAdmin ? 'admin' : 'user') as 'user' | 'driing' | 'admin',
    driing_status: (profile?.driing_status ?? 'none') as 'none' | 'pending' | 'confirmed',
    plan: resolvedPlan as 'decouverte' | 'standard' | 'driing',
    stripe_subscription_id: profile?.stripe_subscription_id ?? null,
    stripe_subscription_status: profile?.stripe_subscription_status ?? null,
    stripe_customer_id: profile?.stripe_customer_id ?? null,
    is_contributor: (isAdmin ? true : (profile?.is_contributor ?? false)),
  }
})
