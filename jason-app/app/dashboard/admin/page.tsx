import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import AdminUI from './AdminUI'

export const metadata = { title: 'Administration — Jason Marinho' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  // Vérification du rôle admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Stats globales
  const [
    { count: totalUsers },
    { count: driingMembers },
    { data: pendingDriing },
    { data: reports },
    { data: suggestions },
    { data: allMembers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driing'),
    supabase
      .from('profiles')
      .select('id, email, full_name, created_at, driing_status')
      .eq('driing_status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('reported_guests')
      .select('*')
      .eq('is_validated', false)
      .order('reported_at', { ascending: false }),
    supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, email, full_name, role, driing_status, plan, created_at')
      .order('created_at', { ascending: false }),
  ])

  return (
    <>
      <Header title="Administration" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '1200px' }}>
        <AdminUI
          pendingDriing={pendingDriing ?? []}
          reports={reports ?? []}
          suggestions={suggestions ?? []}
          allMembers={allMembers ?? []}
          stats={{
            totalUsers: totalUsers ?? 0,
            driingMembers: driingMembers ?? 0,
            pendingDriing: pendingDriing?.length ?? 0,
            pendingReports: reports?.length ?? 0,
            suggestions: suggestions?.length ?? 0,
          }}
        />
      </div>
    </>
  )
}
