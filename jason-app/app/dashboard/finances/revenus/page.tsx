// Cette page RÉUTILISE intégralement le code de /dashboard/revenus/page.tsx
// via un re-export. Aucune duplication de logique de fetching → aucune
// perte de fonctionnalité possible (voir audit AUDIT-PAGES-A-FUSIONNER.md).
//
// La vieille route /dashboard/revenus reste fonctionnelle et un redirect
// 307 (vercel.json) redirige les URLs vers /dashboard/finances/revenus.
import RevenusPage from '@/app/dashboard/revenus/page'

export const revalidate = 60
export const metadata = { title: 'Revenus — Mes finances' }
export default RevenusPage
