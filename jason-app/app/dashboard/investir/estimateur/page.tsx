import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { EstimateurRevenus } from '@/app/dashboard/simulateurs/SimulateursUI'
import HubHero, { HeroEm } from '@/components/dashboard/HubHero'
import { TrendUp } from '@phosphor-icons/react/dist/ssr'

export const metadata = { title: 'Estimer un bien, Espace investisseur' }
export const dynamic = 'force-dynamic'

// Estimateur dans l'espace investisseur (détaché de la partie hôte).
// Réutilise le composant EstimateurRevenus de la partie hôte, mais sans
// préfilage de logements (un investisseur pré-achat n'en a pas) : il
// analyse un bien qu'il envisage d'acheter.
export default async function InvestirEstimateurPage() {
  const profile = await getProfile()
  if (!profile?.userId) redirect('/auth/login')

  return (
    <div style={{ padding: 'var(--dash-page-px)', width: '100%' }}>
      <HubHero
        eyebrowIcon={<TrendUp size={14} weight="fill" />}
        eyebrow="Espace investisseur · Estimer un bien"
        title={<>Combien peut rapporter <HeroEm>ce bien</HeroEm> ?</>}
        desc="Revenu annuel, saisonnalité et règles de location courte durée de la ville, à partir des données de marché. Sauvegarde le projet pour le retrouver sur ton accueil et télécharge le prévisionnel pour ta banque."
        steps={[['Choisis', 'la ville et le type de bien'], ['Lis', 'l’estimation et la réglementation'], ['Télécharge', 'le PDF pour ta banque']]}
      />
      <EstimateurRevenus logements={[]} hideHeader />
    </div>
  )
}
