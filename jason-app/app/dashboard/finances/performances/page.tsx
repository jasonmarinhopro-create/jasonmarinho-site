import { redirect } from 'next/navigation'
import { loadFinances } from '@/lib/finances/load'
import PerformancesContent from './PerformancesContent'

export const metadata = { title: 'Performances, Mes finances' }
export const dynamic = 'force-dynamic'

export default async function PerformancesPage({ searchParams }: { searchParams: { periode?: string } }) {
  const data = await loadFinances()
  if (!data) redirect('/auth/login')
  return <PerformancesContent data={data} searchParams={searchParams} />
}
