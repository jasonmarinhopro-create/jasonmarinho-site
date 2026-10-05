import ProStatsPage from '@/components/pros/stats/ProStatsPage'

export const metadata = { title: 'Mes statistiques' }
export const dynamic = 'force-dynamic'

export default function Page({ searchParams }: { searchParams?: { id?: string; periode?: string } }) {
  return <ProStatsPage metier="photographe" searchParams={searchParams} />
}
