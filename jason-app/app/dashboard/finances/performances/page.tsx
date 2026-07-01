// Cf. commentaire dans finances/revenus/page.tsx — re-export du code
// existant de /dashboard/performances/page.tsx pour zéro duplication.
import PerformancesPage from '@/app/dashboard/performances/page'

export const revalidate = 60
export const metadata = { title: 'Performances — Mes finances' }
export default PerformancesPage
