import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { PHOTOGRAPHIE_LCD_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('photographie-lcd-smartphone', PHOTOGRAPHIE_LCD_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'photographie-lcd-smartphone',
    headerTitle: 'Formation Photographie LCD au smartphone',
    staticContent: PHOTOGRAPHIE_LCD_FORMATION,
  })
}
