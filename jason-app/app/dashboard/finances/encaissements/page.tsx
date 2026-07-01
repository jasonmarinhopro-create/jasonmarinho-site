// Cf. commentaire dans finances/revenus/page.tsx — re-export du code
// existant de /dashboard/encaissements/page.tsx pour zéro duplication.
import EncaissementsPage from '@/app/dashboard/encaissements/page'

export const revalidate = 30
export const metadata = { title: 'Encaissements — Mes finances' }
export default EncaissementsPage
