import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadFeed } from '@/lib/notifications/feed'
import NotificationsView from './NotificationsView'

// Toujours l'état réel. Les règles (arrivée demain, contrat à signer…) ne
// bloquent plus l'affichage : la vue les lance en tâche de fond (au plus
// toutes les 15 min) et se rafraîchit s'il y a du nouveau.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notifications' }

export default async function NotificationsPage({ searchParams }: { searchParams: { filtre?: string } }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  const feed = await loadFeed({ limit: 100 })
  return <NotificationsView items={feed.items} today={feed.today} initialFilter={searchParams.filtre ?? null} />
}
