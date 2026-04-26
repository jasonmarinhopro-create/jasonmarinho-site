import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { getFullMemberProfile } from '../../actions'
import MembreDetailUI from './MembreDetailUI'

export const metadata = { title: 'Fiche membre — Jason Marinho' }

export default async function MembreDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/dashboard')

  const result = await getFullMemberProfile(params.id)

  if ('error' in result) notFound()

  // Normalize Supabase join result: formation relation comes as array from generic client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formations = (result.formations ?? []).map((f: any) => ({
    ...f,
    formation: Array.isArray(f.formation) ? (f.formation[0] ?? null) : f.formation,
  }))

  return (
    <>
      <Header title="Fiche membre" userName={adminProfile?.full_name ?? ''} currentPlan="Administrateur" />
      <div style={{ padding: 'clamp(20px,3vw,44px)', maxWidth: '860px' }}>
        <MembreDetailUI
          profile={result.profile}
          formations={formations}
          stats={result.stats}
          community={result.community}
          audits={result.audits}
        />
      </div>
    </>
  )
}
