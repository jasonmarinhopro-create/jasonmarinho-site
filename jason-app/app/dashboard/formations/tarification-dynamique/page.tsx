import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { TARIFICATION_DYNAMIQUE_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('tarification-dynamique', TARIFICATION_DYNAMIQUE_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'tarification-dynamique',
    headerTitle: 'Formation Tarification Dynamique',
    staticContent: TARIFICATION_DYNAMIQUE_FORMATION,
  })
}
