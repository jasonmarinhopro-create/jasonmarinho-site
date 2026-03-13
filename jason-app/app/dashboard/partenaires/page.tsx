import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PartenairesView from './PartenairesView'

export default async function PartenairesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { const { redirect } = await import('next/navigation'); redirect('/auth/login') }
  const userId = session!.user.id

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', userId).single()

  const { data: partners } = await supabase
    .from('partners').select('*').eq('is_active', true).order('name')

  return (
    <>
      <Sidebar />
      <Header title="Partenaires" userName={profile?.full_name ?? undefined} />
      <PartenairesView partners={partners ?? []} />
    </>
  )
}
