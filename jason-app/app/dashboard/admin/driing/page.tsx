import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import DriingAdmin from './DriingAdmin'

export const metadata = { title: 'Membres Driing, Admin' }
export const dynamic = 'force-dynamic'

// Service client : la RLS sur profiles limite à l'utilisateur courant, on
// bypasse après avoir confirmé que l'utilisateur est admin.
function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function DriingAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = getServiceClient()
  const { data: members } = await admin
    .from('profiles')
    .select('id, email, full_name, created_at, driing_status, plan, stripe_customer_id')
    .in('driing_status', ['pending', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(500)

  return <DriingAdmin initialMembers={members ?? []} />
}
