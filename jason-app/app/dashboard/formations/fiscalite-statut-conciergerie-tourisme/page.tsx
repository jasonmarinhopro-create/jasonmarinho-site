import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { FISCALITE_CONCIERGERIE_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'fiscalite-statut-conciergerie-tourisme',
    headerTitle: 'Formation Fiscalité conciergerie de tourisme',
    staticContent: FISCALITE_CONCIERGERIE_FORMATION,
  })
}
