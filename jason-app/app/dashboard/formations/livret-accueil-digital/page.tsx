import { buildFormationPage } from '@/lib/queries/formation-page-data'
import { LIVRET_ACCUEIL_FORMATION } from './content'

export default async function Page() {
  return buildFormationPage({
    slug: 'livret-accueil-digital',
    headerTitle: "Formation Livret d'accueil digital",
    staticContent: LIVRET_ACCUEIL_FORMATION,
  })
}
