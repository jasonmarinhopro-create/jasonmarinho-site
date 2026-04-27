import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { ECRIRE_AVIS_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('ecrire-avis-repondre-voyageurs', ECRIRE_AVIS_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'ecrire-avis-repondre-voyageurs',
    headerTitle: 'Formation Écrire des avis',
    staticContent: ECRIRE_AVIS_FORMATION,
  })
}
