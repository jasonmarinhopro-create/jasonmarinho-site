import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { GERER_LCD_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('gerer-lcd-automatisation', GERER_LCD_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'gerer-lcd-automatisation',
    headerTitle: 'Formation Gérer sa LCD pro',
    staticContent: GERER_LCD_FORMATION,
  })
}
