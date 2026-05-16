import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignalementsAdmin from './SignalementsAdmin'

export const metadata = { title: 'Signalements, Admin' }
export const dynamic = 'force-dynamic'

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

  const { data: reports } = await supabase
    .from('reported_guests')
    .select('id, identifier, identifier_type, name, incident_type, is_validated, reporter_city, reporter_id, reported_at, description, created_at')
    .order('reported_at', { ascending: false })
    .limit(500)

  return <SignalementsAdmin initialReports={reports ?? []} />
}
