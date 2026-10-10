import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadProvenance } from '@/lib/acquisition/load'
import { perfTimer } from '@/lib/perf/server-timing'
import ProvenanceView, { type ProvTab } from './ProvenanceView'

export const metadata = { title: 'Provenance, Admin' }
export const dynamic = 'force-dynamic'

const PERIODS: Record<string, number> = { '7j': 7, '30j': 30, '90j': 90, tout: 0 }
const TABS: ProvTab[] = ['resultats', 'liens', 'inscriptions']

export default async function ProvenancePage({ searchParams }: { searchParams: { periode?: string; onglet?: string } }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const periode = searchParams.periode && searchParams.periode in PERIODS ? searchParams.periode : '7j'
  const onglet = (TABS as string[]).includes(searchParams.onglet ?? '') ? (searchParams.onglet as ProvTab) : 'resultats'
  const t = perfTimer('/dashboard/admin/provenance')
  const data = await loadProvenance(PERIODS[periode])
  t.done()

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <ProvenanceView data={data} periode={periode} onglet={onglet} />
    </div>
  )
}
