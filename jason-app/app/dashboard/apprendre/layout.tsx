import ApprendreTabBar from './ApprendreTabBar'

export default function ApprendreLayout({ children }: { children: React.ReactNode }) {
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
          Apprendre
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0, marginBottom: 20 }}>
          Formations vidéo et guide de référence pour progresser en LCD.
        </p>
      </div>
      <ApprendreTabBar />
      {children}
    </div>
  )
}
