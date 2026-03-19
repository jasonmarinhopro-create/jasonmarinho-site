import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import FormationsAdmin from './FormationsAdmin'

export const metadata = { title: 'Formations — Admin — Jason Marinho' }

export default async function AdminFormationsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: formations } = await supabase
    .from('formations')
    .select('*')
    .order('created_at', { ascending: false })

  // Get enrollment counts per formation
  const { data: enrollments } = await supabase
    .from('user_formations')
    .select('formation_id')

  const enrollmentMap: Record<string, number> = {}
  enrollments?.forEach(e => {
    enrollmentMap[e.formation_id] = (enrollmentMap[e.formation_id] ?? 0) + 1
  })

  const formationsWithCounts = (formations ?? []).map(f => ({
    ...f,
    enrolled_count: enrollmentMap[f.id] ?? 0,
  }))

  return (
    <>
      <Header title="Formations" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '900px' }}>
        <FormationsAdmin formations={formationsWithCounts} />
      </div>
    </>
  )
}
