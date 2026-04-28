import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { FISCALITE_CONCIERGERIE_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('fiscalite-statut-conciergerie-tourisme', FISCALITE_CONCIERGERIE_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'fiscalite-statut-conciergerie-tourisme',
    headerTitle: 'Formation Fiscalité conciergerie de tourisme',
    staticContent: FISCALITE_CONCIERGERIE_FORMATION,
  })
}
