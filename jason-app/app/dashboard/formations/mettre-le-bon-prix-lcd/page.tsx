import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { METTRE_BON_PRIX_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'mettre-le-bon-prix-lcd',
    headerTitle: 'Formation Mettre le bon prix en LCD',
    staticContent: METTRE_BON_PRIX_FORMATION,
  })
}
