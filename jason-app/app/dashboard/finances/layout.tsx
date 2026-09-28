import { Suspense } from 'react'
import FinancesTabBar from './FinancesTabBar'
import ScopeBar from './_ui/ScopeBar'
import { getActiveProperty, ALL_PROPERTIES } from '@/lib/queries/active-property'

/**
 * « Mes finances » : chaque onglet montre les chiffres du logement choisi
 * (même réglage que le sélecteur de la sidebar), ou de tous les logements.
 */
export default async function FinancesLayout({ children }: { children: React.ReactNode }) {
  const active = await getActiveProperty()
  const choices = active.allProperties.map(p => ({ id: p.id, nom: p.nom }))
  const activeId = active.propertyId === ALL_PROPERTIES && choices.length === 1 ? choices[0].id : active.propertyId

  return (
    <div>
      <div style={{ padding: 'var(--dash-page-px) var(--dash-page-px) 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-fraunces), serif',
            fontSize: 'clamp(22px, 3vw, 28px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            marginBottom: 4,
          }}>
            Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 }}>finances</em>
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0 }}>
            Ce que rapporte {choices.length > 1 ? 'chaque logement' : 'ton logement'}, ce qu&apos;il coûte et ce que tu déclareras.
          </p>
        </div>
        <ScopeBar choices={choices} activeId={activeId} />
      </div>
      <div style={{ marginTop: 12 }}>
        <Suspense fallback={<div style={{ height: 46, borderBottom: '1px solid var(--border)' }} />}>
          <FinancesTabBar />
        </Suspense>
      </div>
      {children}
    </div>
  )
}
