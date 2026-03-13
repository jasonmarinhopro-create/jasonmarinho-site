import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from './FormationView'
import { GMB_FORMATION } from './content'

export default async function GmbFormationPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Formation GMB" userName={profile?.full_name ?? undefined} />
      <FormationView formation={GMB_FORMATION} />
    </>
  )
}
