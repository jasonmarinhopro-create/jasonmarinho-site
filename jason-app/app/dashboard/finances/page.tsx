import { redirect } from 'next/navigation'

// /dashboard/finances → redirige vers l'onglet Revenus (défaut)
export default function FinancesIndexPage() {
  redirect('/dashboard/finances/revenus')
}
