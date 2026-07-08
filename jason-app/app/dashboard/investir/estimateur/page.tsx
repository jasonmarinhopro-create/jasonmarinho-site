import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { EstimateurRevenus } from '@/app/dashboard/simulateurs/SimulateursUI'

export const metadata = { title: 'Estimer un bien — Espace investisseur' }
export const dynamic = 'force-dynamic'

// Estimateur dans l'espace investisseur (détaché de la partie hôte).
// Réutilise le composant EstimateurRevenus de la partie hôte, mais sans
// préfilage de logements (un investisseur pré-achat n'en a pas) : il
// analyse un bien qu'il envisage d'acheter.
export default async function InvestirEstimateurPage() {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  return (
    <div style={{ padding: 'var(--dash-page-px)', width: '100%', maxWidth: 1600, margin: '0 auto' }}>
      <EstimateurRevenus logements={[]} />
    </div>
  )
}
