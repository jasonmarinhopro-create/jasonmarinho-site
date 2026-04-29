import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import FormationsAdmin from './FormationsAdmin'

export const metadata = { title: 'Formations — Admin — Jason Marinho' }

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

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

  // Use service role to bypass RLS and see ALL formations (including drafts)
  const adminClient = getServiceClient()

  const { data: formations } = await adminClient
    .from('formations')
    .select('id, title, slug, description, level, duration, modules_count, lessons_count, is_published, created_at')
    .order('created_at', { ascending: false })

  // Get enrollment counts per formation
  const { data: enrollments } = await adminClient
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
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '900px' }}>
        <FormationsAdmin formations={formationsWithCounts} />
      </div>
    </>
  )
}
