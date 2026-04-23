import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CommunauteView from './CommunauteView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CommunautePage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])

  const [{ data: groups }, { data: mems }] = await Promise.all([
    supabase.from('community_groups')
      .select('id, name, platform, description, members_count, url, category, tag')
      .order('category')
      .order('sort_order')
      .order('name'),
    profile?.userId
      ? supabase.from('user_community_memberships').select('group_id, status').eq('user_id', profile.userId)
      : Promise.resolve({ data: [] as { group_id: string; status: string }[] }),
  ])

  const memberships: Record<string, 'joined' | 'dismissed'> = {}
  ;(mems ?? []).forEach(m => {
    memberships[m.group_id] = m.status as 'joined' | 'dismissed'
  })

  return (
    <>
      <Header title="Communauté" userName={profile?.full_name ?? undefined} />
      <CommunauteView
        groups={groups ?? []}
        userId={profile?.userId ?? null}
        initialMemberships={memberships}
      />
    </>
  )
}
