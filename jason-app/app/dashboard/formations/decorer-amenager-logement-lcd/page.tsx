import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { DECORER_AMENAGER_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'decorer-amenager-logement-lcd',
    headerTitle: 'Formation Décorer et aménager son logement',
    staticContent: DECORER_AMENAGER_FORMATION,
  })
}
