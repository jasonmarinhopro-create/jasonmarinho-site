import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadFeed } from '@/lib/notifications/feed'
import { createClient } from '@/lib/supabase/server'
import NotificationsView from './NotificationsView'

// Toujours l'état réel. Les règles (arrivée demain, contrat à signer…) ne
// bloquent plus l'affichage : la vue les lance en tâche de fond (au plus
// toutes les 15 min) et se rafraîchit s'il y a du nouveau.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notifications' }

export default async function NotificationsPage({ searchParams }: { searchParams: { filtre?: string } }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  const supabase = await createClient()
  const [feed, devicesRes] = await Promise.all([
    loadFeed({ limit: 100 }),
    // Appareils abonnés aux notifications sur le téléphone (migration 119, tolérée absente)
    supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', profile.userId),
  ])
  return <NotificationsView items={feed.items} today={feed.today} initialFilter={searchParams.filtre ?? null} pushDevices={devicesRes.count ?? 0} />
}
