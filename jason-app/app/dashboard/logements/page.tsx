import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import LogementsPage from './LogementsPage'

export default async function LogementsServerPage() {
  const [profile, supabase] = await Promise.all([getProfile(), createClient()])
  if (!profile) return null

  const { data: logements } = await supabase
    .from('logements')
    .select('id, nom, adresse')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="Mes Logements" userName={profile.full_name ?? undefined} />
      <LogementsPage logements={(logements ?? []) as any[]} />
    </>
  )
}
