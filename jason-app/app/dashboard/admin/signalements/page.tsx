import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import SignalementsAdmin from './SignalementsAdmin'

export const metadata = { title: 'Signalements, Admin' }
export const dynamic = 'force-dynamic'

// Service client pour lire TOUS les signalements (la RLS sur reported_guests
// limite à l'utilisateur courant pour les hôtes, ce qui rendait la vue admin
// vide). Le check du rôle 'admin' est effectué juste au-dessus avant d'appeler.
function getServiceClient(): SupabaseClient<any, 'public', any> {
  return createServiceClient<any, 'public', any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function SignalementsAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Ici on est admin authentifié → service role pour bypasser RLS et voir tous les reports.
  const admin = getServiceClient()
  const { data: reports } = await admin
    .from('reported_guests')
    .select('id, identifier, identifier_type, name, incident_type, is_validated, reporter_city, reporter_id, reported_at, description, created_at')
    .order('reported_at', { ascending: false })
    .limit(500)

  return <SignalementsAdmin initialReports={reports ?? []} />
}
