import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { ANNONCE_DIRECTE_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('annonce-directe', ANNONCE_DIRECTE_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'annonce-directe',
    headerTitle: 'Formation Annonce Directe',
    staticContent: ANNONCE_DIRECTE_FORMATION,
  })
}
