import { redirect } from 'next/navigation'

// Ancienne adresse : l'onglet Performances de Mes finances (refonte sept. 2026).
export default function PerformancesRedirect() {
  redirect('/dashboard/finances/performances')
}
