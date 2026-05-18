import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { computeAccountStats } from '@/lib/lcd/account-stats'
import { getDashboardPrefill, type LogementPrefill as PrefillType } from '@/lib/lcd/dashboard-prefill'
import CalculateursUI from './CalculateursUI'
import OnboardingTour, { CALCULATEURS_STEPS } from '../OnboardingTour'

export const metadata = { title: 'Calculateurs marché, Jason Marinho' }
export const dynamic = 'force-dynamic'

// Réutilisé depuis le module partagé pour cache et préfilage cohérents
export type LogementPrefill = PrefillType

export default async function CalculateursPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')

  // Try/catch défensif — voir simulateurs/page.tsx.
  let prefill: PrefillType[] = []
  let accountStats: ReturnType<typeof computeAccountStats> | undefined
  try {
    prefill = await getDashboardPrefill(profile.userId)
  } catch (e) {
    console.error('[CalculateursPage] getDashboardPrefill failed', e)
  }
  try {
    accountStats = computeAccountStats(prefill, profile)
  } catch (e) {
    console.error('[CalculateursPage] computeAccountStats failed', e)
  }

  return (
    <>
      <OnboardingTour userId={profile.userId} steps={CALCULATEURS_STEPS} storageScope="calculateurs" />
      <CalculateursUI logementsPrefill={prefill} accountStats={accountStats} />
    </>
  )
}
