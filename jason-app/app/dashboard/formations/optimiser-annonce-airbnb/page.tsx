import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { OPTIMISER_ANNONCE_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('optimiser-annonce-airbnb', OPTIMISER_ANNONCE_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'optimiser-annonce-airbnb',
    headerTitle: 'Formation Optimiser son annonce Airbnb',
    staticContent: OPTIMISER_ANNONCE_FORMATION,
  })
}
