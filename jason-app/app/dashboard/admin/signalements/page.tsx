import { redirect } from 'next/navigation'

// La page /dashboard/admin/signalements a été fusionnée dans le QG admin
// pour centraliser tout l'admin (Driing / Signalements / Suggestions) au
// même endroit. On redirect proprement pour les anciens bookmarks +
// les liens dans les emails de notification (qu'on a aussi mis à jour
// vers /admin/qg). Code 308 (permanent) → meilleur SEO interne.

export default function SignalementsAdminRedirect() {
  redirect('/dashboard/admin/qg')
}
