import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { computeAccountStats } from '@/lib/lcd/account-stats'
import { getDashboardPrefill, type LogementPrefill as PrefillType } from '@/lib/lcd/dashboard-prefill'
import CalculateursUI from './CalculateursUI'

export const metadata = { title: 'Calculateurs marché, Jason Marinho' }
export const dynamic = 'force-dynamic'

// Réutilisé depuis le module partagé pour cache et préfilage cohérents
export type LogementPrefill = PrefillType

export default async function CalculateursPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const prefill = await getDashboardPrefill(profile.userId)
  return <CalculateursUI logementsPrefill={prefill} accountStats={computeAccountStats(prefill, profile)} />
}
