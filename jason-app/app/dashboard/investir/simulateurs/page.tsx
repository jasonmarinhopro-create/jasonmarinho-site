import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import InvestirSimulateurs from './InvestirSimulateurs'

export const metadata = { title: 'Rentabilité & fiscalité — Espace investisseur' }
export const dynamic = 'force-dynamic'

export default async function InvestirSimulateursPage() {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')
  return (
    <div style={{ padding: 'var(--dash-page-px)', width: '100%', maxWidth: 1600, margin: '0 auto' }}>
      <InvestirSimulateurs />
    </div>
  )
}
