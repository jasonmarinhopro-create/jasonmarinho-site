import ActualitesScreen from '@/components/actualites/ActualitesScreen'

export const metadata = { title: 'Actualités dépannage, Jason Marinho' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <ActualitesScreen audience="depannage" />
}
