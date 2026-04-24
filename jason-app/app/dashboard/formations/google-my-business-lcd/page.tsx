import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { GMB_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'google-my-business-lcd',
    headerTitle: 'Formation GMB',
    staticContent: GMB_FORMATION,
  })
}
