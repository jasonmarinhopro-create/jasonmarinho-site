import ActualitesScreen from '@/components/actualites/ActualitesScreen'

export const metadata = { title: 'Actualités photo & vidéo, Jason Marinho' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <ActualitesScreen audience="photographe" />
}
