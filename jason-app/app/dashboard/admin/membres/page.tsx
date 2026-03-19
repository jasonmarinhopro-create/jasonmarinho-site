import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import MembresUI from './MembresUI'

export const metadata = { title: 'Membres — Jason Marinho' }

export default async function MembresPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: members } = await supabase
    .from('profiles')
    .select(`
      id, email, full_name, role, driing_status, plan, created_at,
      user_formations(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="Membres" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '1200px' }}>
        <MembresUI members={members ?? []} />
      </div>
    </>
  )
}
