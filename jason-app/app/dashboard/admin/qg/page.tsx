import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import AdminQG from './AdminQG'
import { getModerationQueue } from '../signalements/moderation-actions'

export const metadata = { title: 'QG Admin, Jason Marinho' }
export const dynamic = 'force-dynamic'

function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function AdminQGPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // 4 fetchs en parallèle (service role bypass RLS) + getModerationQueue
  // pour la file de modération des signalements publics anonymisés.
  const admin = getServiceClient()
  const [
    { data: driingMembers },
    { data: reports },
    { data: suggestions },
    moderation,
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id, email, full_name, created_at, driing_status, plan, stripe_customer_id')
      .in('driing_status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('reported_guests')
      .select('id, identifier, identifier_type, name, incident_type, is_validated, reporter_city, reporter_id, reported_at, description')
      .order('reported_at', { ascending: false })
      .limit(500),
    admin
      .from('suggestions')
      .select('id, type, message, user_email, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    getModerationQueue(),
  ])

  return (
    <AdminQG
      initialDriing={driingMembers ?? []}
      initialReports={reports ?? []}
      initialSuggestions={suggestions ?? []}
      moderation={moderation}
    />
  )
}
