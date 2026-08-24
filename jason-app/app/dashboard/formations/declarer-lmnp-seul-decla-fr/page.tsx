import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { DECLARER_LMNP_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('declarer-lmnp-seul-decla-fr', DECLARER_LMNP_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'declarer-lmnp-seul-decla-fr',
    headerTitle: 'Formation Déclarer sa LMNP seul avec décla.fr',
    staticContent: DECLARER_LMNP_FORMATION,
  })
}
