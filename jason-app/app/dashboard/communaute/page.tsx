import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import CommunauteView from './CommunauteView'

export default async function CommunautePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { const { redirect } = await import('next/navigation'); redirect('/auth/login') }
  const userId = session!.user.id

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', userId).single()

  const { data: groups } = await supabase
    .from('community_groups')
    .select('*, template:templates(*)')
    .order('members_count', { ascending: false })

  return (
    <>
      <Sidebar />
      <Header title="Communauté" userName={profile?.full_name ?? undefined} />
      <CommunauteView groups={groups ?? []} />
    </>
  )
}
