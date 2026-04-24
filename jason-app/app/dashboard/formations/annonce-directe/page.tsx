import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { ANNONCE_DIRECTE_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'annonce-directe',
    headerTitle: 'Formation Annonce Directe',
    staticContent: ANNONCE_DIRECTE_FORMATION,
  })
}
