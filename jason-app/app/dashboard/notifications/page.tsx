import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getNotifications } from '@/lib/notifications/queries'
import { runNotificationRules } from '@/lib/notifications/rules'
import NotificationsView from './NotificationsView'

// Force le rendu dynamique : la page doit toujours afficher l'état réel,
// pas une version cachée.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  // À chaque visite, on (re-)trigger les règles pour rafraîchir les alertes
  // contextuelles. Best-effort, dédupliqué côté DB par unique constraint sur
  // (recipient_id, dedup_key), donc safe à appeler souvent.
  await runNotificationRules(profile.userId)

  const notifications = await getNotifications({ limit: 100 })

  return <NotificationsView initialNotifications={notifications} />
}
