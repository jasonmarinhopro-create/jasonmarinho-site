import IdeesPage from '@/components/idees/IdeesPage'

export const metadata = { title: 'Idées & feuille de route' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <IdeesPage espace="hote" />
}
