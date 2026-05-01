import { getProfile } from '@/lib/queries/profile'
import SimulateursUI from './SimulateursUI'

export const metadata = { title: 'Simulateurs LCD, Jason Marinho' }

export default async function SimulateursPage() {
  const profile = await getProfile()

  return (
    <>
      <SimulateursUI />
    </>
  )
}
