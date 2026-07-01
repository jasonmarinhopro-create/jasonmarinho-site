// Re-export de /dashboard/chez-nous/page.tsx (home du forum).
// Les sous-routes (posts, profils membres, notifications) restent à leur
// URL d'origine — la tab bar Entre Hôtes n'est visible que sur la home
// du forum, ce qui laisse les vues détail sans distraction.
import ChezNousPage from '@/app/dashboard/chez-nous/page'

export const metadata = { title: 'Forum — Entre Hôtes' }
export default ChezNousPage
