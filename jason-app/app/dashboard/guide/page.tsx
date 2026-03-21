import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import GuideView from './GuideView'

export default async function GuidePage() {
  const profile = await getProfile()
  return (
    <>
      <Header title="Guide LCD" userName={profile?.full_name ?? undefined} />
      <GuideView />
    </>
  )
}
