import { redirect } from 'next/navigation'
import { loadFinances } from '@/lib/finances/load'
import FiscaliteContent from './FiscaliteContent'

export const metadata = { title: 'Fiscalité, Mes finances' }
export const dynamic = 'force-dynamic'

export default async function FiscalitePage({ searchParams }: { searchParams: { annee?: string } }) {
  const data = await loadFinances()
  if (!data) redirect('/auth/login')
  return <FiscaliteContent data={data} searchParams={searchParams} />
}
