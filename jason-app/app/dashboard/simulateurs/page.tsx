import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import SimulateursUI from './SimulateursUI'

export const metadata = { title: 'Simulateurs LCD — Jason Marinho' }

export default async function SimulateursPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Simulateurs LCD" userName={profile?.full_name ?? undefined} />
      <SimulateursUI />
    </>
  )
}
