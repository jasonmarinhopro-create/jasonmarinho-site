import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { MAITRISER_DASHBOARD_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('maitriser-dashboard-jason-marinho', MAITRISER_DASHBOARD_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'maitriser-dashboard-jason-marinho',
    headerTitle: 'Formation Maîtriser le Dashboard Jason Marinho',
    staticContent: MAITRISER_DASHBOARD_FORMATION,
  })
}
