import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadVisibility } from '@/lib/visibility/admin-load'
import { parsePeriod } from '@/lib/visibility/rules'
import { parseTab } from '@/lib/visibility/admin-rules'
import { parisToday } from '@/lib/stripe/deposit-window'
import { perfTimer } from '@/lib/perf/server-timing'
import VisibiliteView from './VisibiliteView'

export const metadata = { title: 'Visibilité, Admin' }
export const dynamic = 'force-dynamic'
// Première lecture de Google sur 3 mois : jusqu'à ~20 s (ensuite en cache 6 h)
export const maxDuration = 60

export default async function VisibilitePage({ searchParams }: { searchParams: { periode?: string; onglet?: string } }) {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  // 7 jours, 28 jours ou 3 mois (12 mois réservé aux statistiques des pros)
  const raw = parsePeriod(searchParams.periode, '28j')
  const period = raw === '12m' ? '28j' : raw
  const tab = parseTab(searchParams.onglet)

  const t = perfTimer('/dashboard/admin/visibilite')
  const data = await loadVisibility(period, tab, parisToday())
  t.done()

  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <VisibiliteView data={data} tab={tab} />
    </div>
  )
}
