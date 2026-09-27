// Re-export de /dashboard/audit-gbp (audit de la fiche Google Business Profile).
// Les sous-pages (résultats, imports) restent sous /dashboard/audit-gbp.
import AuditGbpPage from '@/app/dashboard/audit-gbp/page'

export const metadata = { title: 'Fiche Google — Trouver des voyageurs' }
export const revalidate = 60
export default AuditGbpPage
