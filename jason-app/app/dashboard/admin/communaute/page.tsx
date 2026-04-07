import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CommunauteAdmin from './CommunauteAdmin'

export const metadata = { title: 'Communauté — Admin — Jason Marinho' }

export default async function AdminCommunautePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: groups } = await supabase
    .from('community_groups')
    .select('id, name, description, platform, members_count, url, category, tag, sort_order')
    .order('category')
    .order('sort_order')
    .order('name')

  return (
    <>
      <Header title="Communauté" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '900px' }}>
        <CommunauteAdmin groups={groups ?? []} />
      </div>
    </>
  )
}
