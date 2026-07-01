// Re-export de /dashboard/formations/page.tsx (voir apprendre/layout.tsx).
// Zéro duplication de code : la page originale garde son fetching, ses
// server actions, son onboarding tour, ses 17 sous-pages, etc.
import FormationsPage from '@/app/dashboard/formations/page'

export const metadata = { title: 'Formations — Apprendre' }
export default FormationsPage
