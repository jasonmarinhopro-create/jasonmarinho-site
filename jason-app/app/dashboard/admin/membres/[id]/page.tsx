import { redirect, notFound } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadMemberProfile } from '@/lib/admin/member-profile'
import MembreDetailUI from './MembreDetailUI'
import { perfTimer } from '@/lib/perf/server-timing'

export const metadata = { title: 'Fiche membre, Jason Marinho' }

export default async function MembreDetailPage({ params }: { params: { id: string } }) {
  // getProfile : session et profil déjà lus par le layout (dédupliqués)
  const timer = perfTimer('page /dashboard/admin/membres/[id]')
  const me = await getProfile()
  if (!me) redirect('/auth/login')
  if (me.role !== 'admin') redirect('/dashboard')
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound()

  timer.mark('session')
  const result = await loadMemberProfile(params.id)
  timer.mark('fiche membre')
  timer.done()

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
          investorProjects={result.investorProjects}
          pros={result.pros}
          host={result.host}
        />
      </div>
    </>
  )
}
