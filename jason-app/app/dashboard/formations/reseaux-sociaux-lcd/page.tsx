import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { RESEAUX_SOCIAUX_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('reseaux-sociaux-lcd', RESEAUX_SOCIAUX_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'reseaux-sociaux-lcd',
    headerTitle: 'Formation Réseaux sociaux LCD',
    staticContent: RESEAUX_SOCIAUX_FORMATION,
  })
}
