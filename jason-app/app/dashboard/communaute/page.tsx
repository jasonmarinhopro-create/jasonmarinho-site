import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getCachedCommunityGroups } from '@/lib/queries/cache'
import Header from '@/components/layout/Header'
import CommunauteView from './CommunauteView'

export const dynamic = 'force-dynamic'

export default async function CommunautePage() {
  const [profile, supabase, groups] = await Promise.all([
    getProfile(),
    createClient(),
    getCachedCommunityGroups(),
  ])

  const { data: mems } = profile?.userId
    ? await supabase.from('user_community_memberships').select('group_id, status').eq('user_id', profile.userId)
    : { data: [] as { group_id: string; status: string }[] }

  const memberships: Record<string, 'joined' | 'dismissed'> = {}
  ;(mems ?? []).forEach(m => {
    memberships[m.group_id] = m.status as 'joined' | 'dismissed'
  })

  return (
    <>
      <Header title="Communauté" userName={profile?.full_name ?? undefined} />
      <CommunauteView
        groups={groups}
        userId={profile?.userId ?? null}
        initialMemberships={memberships}
      />
    </>
  )
}
