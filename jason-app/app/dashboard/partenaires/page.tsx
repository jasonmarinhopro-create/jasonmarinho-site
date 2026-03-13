import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import PartenairesView from './PartenairesView'

export default async function PartenairesPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const { data: partners } = await supabase
    .from('partners').select('*').eq('is_active', true).order('name')

  return (
    <>
      <Header title="Partenaires" userName={profile?.full_name ?? undefined} />
      <PartenairesView partners={partners ?? []} />
    </>
  )
}
