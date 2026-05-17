import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { computeAccountStats } from '@/lib/lcd/account-stats'
import { getDashboardPrefill, type LogementPrefill as PrefillType } from '@/lib/lcd/dashboard-prefill'
import SimulateursUI from './SimulateursUI'
import OnboardingTour, { SIMULATEURS_STEPS } from '../OnboardingTour'

export const metadata = { title: 'Simulateurs LCD, Jason Marinho' }
export const dynamic = 'force-dynamic'

// Re-export pour compatibilité avec les composants enfants qui importaient
// `LogementPrefill` depuis ce fichier (path historique).
export type LogementPrefill = PrefillType

export default async function SimulateursPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  const prefill = await getDashboardPrefill(profile.userId)
  return (
    <>
      <OnboardingTour userId={profile.userId} steps={SIMULATEURS_STEPS} storageScope="simulateurs" />
      <SimulateursUI logementsPrefill={prefill} accountStats={computeAccountStats(prefill, profile)} />
    </>
  )
}
