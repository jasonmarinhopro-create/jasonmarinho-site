import { getProfile } from '@/lib/queries/profile'
import GuideUI from './GuideUI'

export const metadata = { title: 'Guide LCD — Jason Marinho' }

export default async function GuidePage() {
  const profile = await getProfile()

  return (
    <>
      <GuideUI />
    </>
  )
}
