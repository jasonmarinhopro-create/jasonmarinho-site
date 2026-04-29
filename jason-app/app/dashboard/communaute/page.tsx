import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { getCachedCommunityGroups } from '@/lib/queries/cache'
import CommunauteView from './CommunauteView'

export const dynamic = 'force-dynamic'

export default async function CommunautePage() {
  const [profile, supabase, groups] = await Promise.all([
    getProfile(),
    createClient(),
    getCachedCommunityGroups(),
  ])

  const [{ data: mems }, { data: userLogements }] = profile?.userId
    ? await Promise.all([
        supabase.from('user_community_memberships').select('group_id, status').eq('user_id', profile.userId),
        supabase.from('logements').select('adresse').eq('user_id', profile.userId),
      ])
    : [{ data: [] as { group_id: string; status: string }[] }, { data: [] as { adresse: string | null }[] }]

  const memberships: Record<string, 'joined' | 'dismissed'> = {}
  ;(mems ?? []).forEach(m => {
    memberships[m.group_id] = m.status as 'joined' | 'dismissed'
  })

  const userAdresses = (userLogements ?? []).map(l => (l.adresse ?? '').toLowerCase()).filter(Boolean)

  return (
    <>
      <CommunauteView
        groups={groups}
        userId={profile?.userId ?? null}
        initialMemberships={memberships}
        userAdresses={userAdresses}
      />
    </>
  )
}
