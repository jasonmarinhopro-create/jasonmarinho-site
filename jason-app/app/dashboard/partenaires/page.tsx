import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import PartenairesView from './PartenairesView'

export default async function PartenairesPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Partenaires" userName={profile?.full_name ?? undefined} />
      <PartenairesView />
    </>
  )
}
