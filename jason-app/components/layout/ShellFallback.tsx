// Cadre du dashboard envoyé avant toute requête (30/09/2026) : barre
// latérale, en-tête et squelette de page, pendant que le serveur vérifie la
// session et charge le profil. Avant, l'écran restait blanc tout ce temps
// (jusqu'à 10 s à l'ouverture de l'app sur téléphone, fonction endormie).
// Composant serveur, sans donnée ni JavaScript.
import DashboardLoading from '@/app/dashboard/loading'

const bar: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s infinite var(--ease-smooth)',
  borderRadius: 'var(--r-sm)',
}

export default function ShellFallback() {
  return (
    <div style={{ display: 'flex', minHeight: '100svh' }} aria-busy="true" aria-label="Chargement">
      <aside className="dash-shell-side" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 'var(--sidebar-w)',
        background: 'var(--nav-bg)', borderRight: '1px solid var(--nav-border)',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 99,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-bg)' }} />
          <div style={{ ...bar, width: 110, height: 14 }} />
        </div>
        {[70, 55, 80, 60, 75, 50, 65].map((w, i) => (
          <div key={i} style={{ ...bar, width: `${w}%`, height: 12 }} />
        ))}
      </aside>
      <div className="dash-shell-head" style={{
        position: 'fixed', top: 0, left: 'var(--sidebar-w)', right: 0, height: 'var(--header-h)',
        background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)', zIndex: 90,
        display: 'flex', alignItems: 'center', padding: '0 clamp(16px,3vw,32px)',
      }}>
        <div style={{ ...bar, width: 150, height: 16 }} />
      </div>
      <main className="dash-main" style={{
        flex: 1, minWidth: 0, marginLeft: 'var(--sidebar-w)', paddingTop: 'var(--header-h)',
        minHeight: '100svh', background: 'var(--bg)',
      }}>
        <DashboardLoading />
      </main>
    </div>
  )
}
