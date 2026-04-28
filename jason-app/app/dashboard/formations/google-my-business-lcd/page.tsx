import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { GMB_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('google-my-business-lcd', GMB_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'google-my-business-lcd',
    headerTitle: 'Formation GMB',
    staticContent: GMB_FORMATION,
  })
}
