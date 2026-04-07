import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CommunauteView from './CommunauteView'

export default async function CommunautePage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const { data: groups } = await supabase
    .from('community_groups')
    .select('id, name, platform, description, members_count, url, category, tag')
    .order('category')
    .order('sort_order')
    .order('name')

  return (
    <>
      <Header title="Communauté" userName={profile?.full_name ?? undefined} />
      <CommunauteView groups={groups ?? []} />
    </>
  )
}
