import TrouverClientsPage from '@/components/pros/TrouverClientsPage'

export const metadata = { title: 'Trouver des clients, Photographe' }
export const dynamic = 'force-dynamic'

export default function Page() {
  return <TrouverClientsPage kind="photographer" />
}
