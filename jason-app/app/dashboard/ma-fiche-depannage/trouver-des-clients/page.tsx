import TrouverClientsPage from '@/components/pros/TrouverClientsPage'

export const metadata = { title: 'Trouver des clients, Dépannage' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <TrouverClientsPage kind="depannage" />
}
