import { buildFormationPage, buildFormationMetadataFromContent } from '@/lib/queries/formation-page-data'
import { AUDIT_ANNONCE_FORMATION } from './content'

export const metadata = buildFormationMetadataFromContent('audit-annonce', AUDIT_ANNONCE_FORMATION)

export default async function Page() {
  return buildFormationPage({
    slug: 'audit-annonce',
    headerTitle: 'Formation Audit Annonce',
    staticContent: AUDIT_ANNONCE_FORMATION,
  })
}
