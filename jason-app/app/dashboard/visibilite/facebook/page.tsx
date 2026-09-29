// Re-export de /dashboard/communaute (groupes Facebook + posts prêts à publier).
import CommunautePage from '@/app/dashboard/communaute/page'

export const metadata = { title: 'Groupes Facebook · Trouver des voyageurs' }
export const revalidate = 120
export default CommunautePage
