import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import LogementsPage from './LogementsPage'

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
      <LogementsPage logements={(logements ?? []) as any[]} />
    </>
  )
}
