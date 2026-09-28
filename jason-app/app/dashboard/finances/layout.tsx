import { Suspense } from 'react'
import FinancesTabBar from './FinancesTabBar'
import FinancesHero from './_ui/FinancesHero'
import { getActiveProperty, ALL_PROPERTIES } from '@/lib/queries/active-property'
import { loadFinances } from '@/lib/finances/load'

/**
 * « Mes finances » (DA 28/09/2026) : bandeau vert commun aux onglets
 * (FinancesHero), puis les onglets. loadFinances() est mis en cache pour le
 * rendu : la page de l'onglet réutilise les mêmes requêtes.
 */
export default async function FinancesLayout({ children }: { children: React.ReactNode }) {
  const [active, data] = await Promise.all([getActiveProperty(), loadFinances()])
  const choices = active.allProperties.map(p => ({ id: p.id, nom: p.nom }))
  const activeId = active.propertyId === ALL_PROPERTIES && choices.length === 1 ? choices[0].id : active.propertyId

  return (
    <div>
      <FinancesHero data={data} choices={choices} activeId={activeId} />
      <Suspense fallback={<div style={{ height: 46, borderBottom: '1px solid var(--border)' }} />}>
        <FinancesTabBar />
      </Suspense>
      {children}
    </div>
  )
}
