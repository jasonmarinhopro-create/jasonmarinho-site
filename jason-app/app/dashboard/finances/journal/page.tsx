import { redirect } from 'next/navigation'
import { loadFinances } from '@/lib/finances/load'
import JournalContent from './JournalContent'

export const metadata = { title: 'Journal, Mes finances' }
export const dynamic = 'force-dynamic'

export default async function JournalPage({ searchParams }: { searchParams: { periode?: string } }) {
  const data = await loadFinances()
  if (!data) redirect('/auth/login')
  return <JournalContent data={data} searchParams={searchParams} />
}
