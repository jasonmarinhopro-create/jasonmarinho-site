import { getServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/require-admin'
import { createClient } from '@/lib/supabase/server'
import AdminQG, { type QGTab } from './AdminQG'
import { loadDemandesQG } from './demandes-load'

export const metadata = { title: 'QG Admin, Jason Marinho' }
export const dynamic = 'force-dynamic'

const TABS: QGTab[] = ['hotes', 'driing', 'reports', 'suggestions']

export default async function AdminQGPage({ searchParams }: { searchParams: { onglet?: string; demande?: string } }) {
  const supabase = await createClient()
  await requireAdmin()

  // Fetchs en parallèle (service role bypass RLS).
  const admin = getServiceClient()
  const [
    { data: driingMembers },
    { data: reports },
    { data: suggestions },
    demandes,
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
      .select('id, type, message, user_email, user_id, created_at, treated_at')
      .order('created_at', { ascending: false })
      .limit(500),
    loadDemandesQG(),
  ])
  const onglet = TABS.includes(searchParams.onglet as QGTab) ? searchParams.onglet as QGTab : (searchParams.demande ? 'hotes' : null)
  const demandeId = typeof searchParams.demande === 'string' && /^[0-9a-f-]{36}$/i.test(searchParams.demande) ? searchParams.demande : null

  return (
    <AdminQG
      initialDriing={driingMembers ?? []}
      initialReports={reports ?? []}
      initialSuggestions={suggestions ?? []}
      demandes={demandes}
      initialTab={onglet}
      initialDemandeId={demandeId}
    />
  )
}
