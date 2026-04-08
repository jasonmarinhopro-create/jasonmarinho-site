import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import GuideUI from './GuideUI'

export const metadata = { title: 'Guide LCD — Jason Marinho' }

export default async function GuidePage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Guide LCD" userName={profile?.full_name ?? undefined} />
      <GuideUI />
    </>
  )
}
