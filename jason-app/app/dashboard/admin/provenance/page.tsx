import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadProvenance } from '@/lib/acquisition/load'
import { perfTimer } from '@/lib/perf/server-timing'
import ProvenanceView, { type ProvTab } from './ProvenanceView'
import { loadNewsletterTab } from '@/lib/newsletter/stats'
import { loadGroupStats } from '@/lib/acquisition/groupes-load'
import { EDITIONS, type Edition } from '@/lib/newsletter/editions'

export const metadata = { title: 'Provenance, Admin' }
export const dynamic = 'force-dynamic'
// Onglet Newsletter : statistiques Brevo et composition de la prochaine lettre
export const maxDuration = 60

const PERIODS: Record<string, number> = { '7j': 7, '30j': 30, '90j': 90, tout: 0 }
const TABS: ProvTab[] = ['resultats', 'groupes', 'messages', 'liens', 'inscriptions', 'newsletter']

export default async function ProvenancePage({ searchParams }: { searchParams: { periode?: string; onglet?: string; edition?: string; voir?: string } }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const periode = searchParams.periode && searchParams.periode in PERIODS ? searchParams.periode : '7j'
  const onglet = (TABS as string[]).includes(searchParams.onglet ?? '') ? (searchParams.onglet as ProvTab) : 'resultats'
  const t = perfTimer('/dashboard/admin/provenance')
  const edition: Edition = (EDITIONS as string[]).includes(searchParams.edition ?? '') ? (searchParams.edition as Edition) : 'hote'
  const [data, newsletter, groupes] = await Promise.all([
    loadProvenance(PERIODS[periode]),
    onglet === 'newsletter' ? loadNewsletterTab({ edition, voir: searchParams.voir ?? null }) : Promise.resolve(null),
    onglet === 'groupes' ? loadGroupStats() : Promise.resolve(null),
  ])
  t.done()

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <ProvenanceView data={data} periode={periode} onglet={onglet} newsletter={newsletter} edition={edition} groupes={groupes} />
    </div>
  )
}
