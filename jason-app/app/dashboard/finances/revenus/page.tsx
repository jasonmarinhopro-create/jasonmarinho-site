import { redirect } from 'next/navigation'
import { loadFinances } from '@/lib/finances/load'
import RevenusContent from './RevenusContent'

export const metadata = { title: 'Revenus, Mes finances' }
export const dynamic = 'force-dynamic'

export default async function RevenusPage({ searchParams }: { searchParams: { periode?: string } }) {
  const data = await loadFinances()
  if (!data) redirect('/auth/login')
  return <RevenusContent data={data} searchParams={searchParams} />
}
