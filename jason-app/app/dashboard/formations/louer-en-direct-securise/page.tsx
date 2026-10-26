import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { LOUER_EN_DIRECT_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('louer-en-direct-securise', LOUER_EN_DIRECT_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'louer-en-direct-securise',
    headerTitle: 'Formation Louer en direct sans plateforme, en toute sécurité',
    staticContent: LOUER_EN_DIRECT_FORMATION,
  })
}
