import { redirect } from 'next/navigation'

// Les notifications de Questions & réponses sont dans le fil commun depuis le
// 29/09/2026 (page Notifications, filtre « Questions & réponses »).
export default function ChezNousNotificationsPage() {
  redirect('/dashboard/notifications?filtre=questions')
}
