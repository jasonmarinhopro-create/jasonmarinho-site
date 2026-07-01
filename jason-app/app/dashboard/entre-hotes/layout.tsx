import EntreHotesTabBar from './EntreHotesTabBar'

export default function EntreHotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: 'var(--dash-page-px) var(--dash-page-px) 0' }}>
        <h1 style={{
          fontFamily: 'var(--font-fraunces), serif',
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: 0, marginBottom: 4,
        }}>
          Entre <em style={{ color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 }}>Hôtes</em>
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, marginBottom: 20 }}>
          Le forum de la communauté, les groupes Facebook LCD et l&apos;écosystème des partenaires vérifiés.
        </p>
      </div>
      <EntreHotesTabBar />
      {children}
    </div>
  )
}
