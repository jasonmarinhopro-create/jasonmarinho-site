import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { SECURISER_RESERVATIONS_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('securiser-reservations-eviter-mauvais-voyageurs', SECURISER_RESERVATIONS_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'securiser-reservations-eviter-mauvais-voyageurs',
    headerTitle: 'Formation Sécuriser ses réservations',
    staticContent: SECURISER_RESERVATIONS_FORMATION,
  })
}
