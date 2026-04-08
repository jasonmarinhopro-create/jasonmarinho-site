import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ActualitesAdmin from './ActualitesAdmin'

export const metadata = { title: 'Actualités — Admin — Jason Marinho' }

export default async function AdminActualitesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: articles } = await supabase
    .from('actualites')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header title="Actualités" userName={profile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '900px' }}>
        <ActualitesAdmin articles={articles ?? []} />
      </div>
    </>
  )
}
