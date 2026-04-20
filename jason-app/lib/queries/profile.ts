import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function getProfile() {
  noStore()
  const supabase = await createClient()

  // getSession() reads the JWT cookie locally — no network call, always works
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  // Service role client bypasses RLS — safe here (server-only, user ID from session cookie)
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role, driing_status, plan, stripe_subscription_id, stripe_subscription_status, stripe_customer_id')
    .eq('id', session.user.id)
    .maybeSingle()

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
}
