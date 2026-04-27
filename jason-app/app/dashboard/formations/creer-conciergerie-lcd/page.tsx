import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { CREER_CONCIERGERIE_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('creer-conciergerie-lcd', CREER_CONCIERGERIE_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'creer-conciergerie-lcd',
    headerTitle: 'Formation Créer sa conciergerie LCD',
    staticContent: CREER_CONCIERGERIE_FORMATION,
  })
}
