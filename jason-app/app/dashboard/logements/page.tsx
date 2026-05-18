import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import LogementsPage from './LogementsPage'
import OnboardingTour, { LOGEMENTS_STEPS } from '../OnboardingTour'

export default async function LogementsServerPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null

  const { data: logements } = await supabase
    .from('logements')
    .select('*')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  return (
    <>
      <OnboardingTour userId={profile.userId} steps={LOGEMENTS_STEPS} storageScope="logements" />
      <LogementsPage logements={(logements ?? []) as any[]} />
    </>
  )
}
