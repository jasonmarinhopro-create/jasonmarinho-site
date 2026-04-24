import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { LCD_BASSE_SAISON_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'lcd-basse-saison',
    headerTitle: 'Formation LCD Basse saison',
    staticContent: LCD_BASSE_SAISON_FORMATION,
  })
}
