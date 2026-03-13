import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CommunauteView from './CommunauteView'

export default async function CommunautePage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const { data: groups } = await supabase
    .from('community_groups')
    .select('*, template:templates(*)')
    .order('members_count', { ascending: false })

  return (
    <>
      <Header title="Communauté" userName={profile?.full_name ?? undefined} />
      <CommunauteView groups={groups ?? []} />
    </>
  )
}
