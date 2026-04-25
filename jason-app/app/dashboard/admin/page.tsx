import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import AdminUI from './AdminUI'

export const metadata = { title: 'Administration — Jason Marinho' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Début du mois courant
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: driingMembers },
    { count: standardMembers },
    { count: newThisMonth },
    { count: templatesCount },
    { count: formationsCount },
    { count: groupsCount },
    { count: totalVoyageurs },
    { count: totalSejours },
    { data: pendingDriing },
    { data: reports },
    { data: suggestions },
    { data: formationEnrollments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'driing'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'standard'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('formations').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('community_groups').select('*', { count: 'exact', head: true }),
    supabase.from('voyageurs').select('*', { count: 'exact', head: true }),
    supabase.from('sejours').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, email, full_name, created_at, driing_status').eq('driing_status', 'pending').order('created_at', { ascending: false }).limit(100),
    supabase.from('reported_guests').select('id, identifier, identifier_type, name, incident_type, is_validated, reporter_city, reported_at, description').order('reported_at', { ascending: false }).limit(100),
    supabase.from('suggestions').select('id, type, message, user_email, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('user_formations').select('formation_id, formations(title)'),
  ])

  // Formation la plus commencée
  const formationCounts: Record<string, { title: string; count: number }> = {}
  for (const uf of formationEnrollments ?? []) {
    const fid = uf.formation_id as string
    const formation = uf.formations as unknown as { title: string } | { title: string }[] | null
    const title = Array.isArray(formation) ? (formation[0]?.title ?? 'Inconnue') : (formation?.title ?? 'Inconnue')
    if (!formationCounts[fid]) formationCounts[fid] = { title, count: 0 }
    formationCounts[fid].count++
  }
  const topFormation = Object.values(formationCounts).sort((a, b) => b.count - a.count)[0] ?? null

  return (
    <>
      <Header title="Administration" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '1200px' }}>
        <AdminUI
          pendingDriing={pendingDriing ?? []}
          reports={reports ?? []}
          suggestions={suggestions ?? []}
          stats={{
            totalUsers: totalUsers ?? 0,
            driingMembers: driingMembers ?? 0,
            standardMembers: standardMembers ?? 0,
            newThisMonth: newThisMonth ?? 0,
            pendingDriing: pendingDriing?.length ?? 0,
            pendingReports: reports?.filter(r => !r.is_validated).length ?? 0,
            suggestions: suggestions?.length ?? 0,
            templatesCount: templatesCount ?? 0,
            formationsCount: formationsCount ?? 0,
            groupsCount: groupsCount ?? 0,
            totalVoyageurs: totalVoyageurs ?? 0,
            totalSejours: totalSejours ?? 0,
            topFormation: topFormation,
          }}
        />
      </div>
    </>
  )
}
