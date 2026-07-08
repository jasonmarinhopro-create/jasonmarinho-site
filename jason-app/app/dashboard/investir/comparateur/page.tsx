import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { CompareurMesVilles } from '@/app/dashboard/simulateurs/SimulateursUI'

export const metadata = { title: 'Comparer les villes — Espace investisseur' }
export const dynamic = 'force-dynamic'

// Comparateur de villes dans l'espace investisseur (détaché). Réutilise le
// composant de la partie hôte, sans logements préfilés : l'investisseur
// compare des villes où il envisage d'acheter.
export default async function InvestirComparateurPage() {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')
  return (
    <div className="sim-root" style={{ padding: 'var(--dash-page-px)', width: '100%', maxWidth: 1600, margin: '0 auto' }}>
      <CompareurMesVilles logements={[]} />
    </div>
  )
}
