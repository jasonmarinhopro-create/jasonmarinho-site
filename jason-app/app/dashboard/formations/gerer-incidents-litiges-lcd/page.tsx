import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { GERER_INCIDENTS_LITIGES_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('gerer-incidents-litiges-lcd', GERER_INCIDENTS_LITIGES_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'gerer-incidents-litiges-lcd',
    headerTitle: 'Formation Gérer les incidents et litiges en LCD',
    staticContent: GERER_INCIDENTS_LITIGES_FORMATION,
  })
}
