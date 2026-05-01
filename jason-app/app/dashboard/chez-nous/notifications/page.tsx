import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import NotificationsView from './NotificationsView'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Notifications Chez Nous, Jason Marinho' }

export default async function NotificationsPage() {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  const supabase = await createClient()

  const { data: notifsRaw } = await supabase
    .from('chez_nous_notifications')
    .select('id, actor_id, type, post_id, reply_id, read_at, created_at')
    .eq('recipient_id', profile.userId)
    .order('created_at', { ascending: false })
    .limit(100)

  const notifs = notifsRaw ?? []

  // Récup posts + actors en bulk
  const postIds  = Array.from(new Set(notifs.map(n => n.post_id).filter((x): x is string => !!x)))
  const actorIds = Array.from(new Set(notifs.map(n => n.actor_id)))

  const [{ data: postsData }, { data: actorsData }] = await Promise.all([
    postIds.length  ? supabase.from('chez_nous_posts').select('id, title, category').in('id', postIds) : Promise.resolve({ data: [] }),
    actorIds.length ? supabase.from('profiles').select('id, full_name, pseudo').in('id', actorIds) : Promise.resolve({ data: [] }),
  ])

  const postsMap: Record<string, { title: string; category: string }> = {}
  ;(postsData ?? []).forEach(p => { postsMap[p.id] = { title: p.title, category: p.category } })

  const actorsMap: Record<string, { full_name: string | null; pseudo: string | null }> = {}
  ;(actorsData ?? []).forEach(a => { actorsMap[a.id] = { full_name: a.full_name, pseudo: a.pseudo } })

  const unreadCount = notifs.filter(n => !n.read_at).length

  return (
    <>
      <NotificationsView
        notifs={notifs.map(n => ({
          id: n.id,
          actor_id: n.actor_id,
          type: n.type,
          post_id: n.post_id,
          read_at: n.read_at,
          created_at: n.created_at,
        }))}
        postsMap={postsMap}
        actorsMap={actorsMap}
        unreadCount={unreadCount}
      />
    </>
  )
}
