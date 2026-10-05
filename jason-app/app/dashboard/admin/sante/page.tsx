import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { loadHealth } from '@/lib/admin/health-load'
import { perfTimer } from '@/lib/perf/server-timing'
import SanteView from './SanteView'

export const metadata = { title: 'État de santé, Admin' }
export const dynamic = 'force-dynamic'

export default async function SantePage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const t = perfTimer('/dashboard/admin/sante')
  const checks = await loadHealth()
  t.done()

  const checkedAt = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  return <SanteView checks={checks} checkedAt={checkedAt} />
}
