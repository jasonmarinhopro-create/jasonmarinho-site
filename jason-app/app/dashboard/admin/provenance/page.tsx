import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadProvenance } from '@/lib/acquisition/load'
import { perfTimer } from '@/lib/perf/server-timing'
import ProvenanceView from './ProvenanceView'

export const metadata = { title: 'Liens & inscriptions, Admin' }
export const dynamic = 'force-dynamic'

const PERIODS: Record<string, number> = { '30j': 30, '3m': 90, '12m': 365 }

export default async function ProvenancePage({ searchParams }: { searchParams: { periode?: string } }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const periode = searchParams.periode && PERIODS[searchParams.periode] ? searchParams.periode : '30j'
  const t = perfTimer('/dashboard/admin/provenance')
  const data = await loadProvenance(PERIODS[periode])
  t.done()

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <ProvenanceView data={data} periode={periode} />
    </div>
  )
}
