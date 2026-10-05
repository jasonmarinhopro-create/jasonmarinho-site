import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadSales } from '@/lib/admin/sales-load'
import { perfTimer } from '@/lib/perf/server-timing'
import VentesView from './VentesView'

export const metadata = { title: 'Ventes, Admin' }
export const dynamic = 'force-dynamic'
// Envoi des e-mails aux membres : jusqu'à ~45 s par appel (rythme de la boîte d'envoi)
export const maxDuration = 60

export default async function VentesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const t = perfTimer('/dashboard/admin/ventes')
  const data = await loadSales()
  t.done()

  // Même marge que les autres pages admin
  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%' }}>
      <VentesView data={data} />
    </div>
  )
}
