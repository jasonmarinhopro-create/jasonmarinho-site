import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { ANNONCE_360_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('annonce-360', ANNONCE_360_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'annonce-360',
    headerTitle: 'Formation Annonce 360°',
    staticContent: ANNONCE_360_FORMATION,
  })
}
