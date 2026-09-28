import { redirect } from 'next/navigation'

// Ancienne adresse : « Mes finances » vit sous /dashboard/finances (refonte sept. 2026)
export default function RevenusRedirect() {
  redirect('/dashboard/finances/revenus')
}
