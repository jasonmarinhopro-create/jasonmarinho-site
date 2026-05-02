import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFullMemberProfile } from '../../actions'
import MembreDetailUI from './MembreDetailUI'

export const metadata = { title: 'Fiche membre, Jason Marinho' }

export default async function MembreDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
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
      <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
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
