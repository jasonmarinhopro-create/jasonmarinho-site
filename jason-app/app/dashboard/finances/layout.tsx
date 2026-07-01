import FinancesTabBar from './FinancesTabBar'

/**
 * Layout partagé pour /dashboard/finances/* (Étape 4/7 du refactor).
 * Fusionne les 3 anciennes pages (Revenus + Encaissements + Performances)
 * sous des onglets, sans dupliquer leur logique de fetching — chaque
 * sous-page est un simple re-export de l'ancienne route pour préserver
 * toutes les fonctionnalités existantes (audit `AUDIT-PAGES-A-FUSIONNER.md`).
 */
export default function FinancesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: 'var(--dash-page-px) var(--dash-page-px) 0' }}>
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
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, marginBottom: 20 }}>
          Suivi de tes revenus, paiements Stripe et indicateurs de performance.
        </p>
      </div>
      <FinancesTabBar />
      {children}
    </div>
  )
}
