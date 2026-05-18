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

  // Try/catch défensif sur getDashboardPrefill + computeAccountStats : si l'une
  // jette (cache stale, schéma changé, fonction qui crashe), on rend la page
  // en mode dégradé plutôt que d'écrouler toute la route.
  let prefill: PrefillType[] = []
  let accountStats: ReturnType<typeof computeAccountStats> | undefined
  try {
    prefill = await getDashboardPrefill(profile.userId)
  } catch (e) {
    console.error('[SimulateursPage] getDashboardPrefill failed', e)
  }
  try {
    accountStats = computeAccountStats(prefill, profile)
  } catch (e) {
    console.error('[SimulateursPage] computeAccountStats failed', e)
  }

  return (
    <>
      <OnboardingTour userId={profile.userId} steps={SIMULATEURS_STEPS} storageScope="simulateurs" />
      <SimulateursUI logementsPrefill={prefill} accountStats={accountStats} />
    </>
  )
}
