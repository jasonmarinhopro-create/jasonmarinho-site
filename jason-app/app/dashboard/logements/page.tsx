import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import LogementsPage from './LogementsPage'

export default async function LogementsServerPage() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()
  const { data: logements } = await supabase
    .from('logements')
    .select('*')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="Mes Logements" userName={profile.full_name ?? undefined} />
      <LogementsPage logements={(logements ?? []) as any[]} />
    </>
  )
}
