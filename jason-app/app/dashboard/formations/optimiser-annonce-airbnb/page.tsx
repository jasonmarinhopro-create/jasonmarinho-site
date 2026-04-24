import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { OPTIMISER_ANNONCE_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'optimiser-annonce-airbnb',
    headerTitle: 'Formation Optimiser son annonce Airbnb',
    staticContent: OPTIMISER_ANNONCE_FORMATION,
  })
}
