import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import SecuriteView from './SecuriteView'

export default async function SecuritePage() {
  const profile = await getProfile()
  return (
    <>
      <Header title="Sécurité" userName={profile?.full_name ?? undefined} />
      <SecuriteView />
    </>
  )
}
