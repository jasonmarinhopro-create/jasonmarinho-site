import ActualitesScreen from '@/components/actualites/ActualitesScreen'

export const metadata = { title: 'Actualités ménage, Jason Marinho' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <ActualitesScreen audience="menage" />
}
