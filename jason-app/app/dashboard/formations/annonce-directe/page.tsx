import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import FormationView from '../google-my-business-lcd/FormationView'
import { ANNONCE_DIRECTE_FORMATION } from './content'

export default async function AnnonceDirecteFormationPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Formation Annonce Directe" userName={profile?.full_name ?? undefined} />
      <FormationView formation={ANNONCE_DIRECTE_FORMATION} />
    </>
  )
}
