import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { FISCALITE_LCD_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'fiscalite-reglementation-lcd-france-2026',
    headerTitle: 'Formation Fiscalité LCD France 2026',
    staticContent: FISCALITE_LCD_FORMATION,
  })
}
