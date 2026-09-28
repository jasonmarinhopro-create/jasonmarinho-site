// Squelette des pages admin. Sans lui, la bascule en mode admin affichait le
// squelette de l'Accueil hôte (app/dashboard/loading.tsx) pendant le chargement.
export default function AdminLoading() {
  return (
    <div style={styles.page} aria-busy="true" aria-label="Chargement">
      <div style={styles.hero}>
        <div style={{ ...styles.bar, width: '110px', height: '12px' }} />
        <div style={{ ...styles.bar, width: '260px', height: '30px' }} />
        <div style={{ ...styles.bar, width: '180px', height: '22px', borderRadius: '999px', opacity: 0.7 }} />
      </div>

      <div style={styles.kpis}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ ...styles.kpi, animationDelay: `${i * 60}ms` }}>
            <div style={{ ...styles.bar, width: '50%', height: '11px', opacity: 0.7 }} />
            <div style={{ ...styles.bar, width: '40%', height: '26px' }} />
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ ...styles.card, animationDelay: `${i * 60}ms` }}>
            <div style={{ ...styles.bar, width: '55%', height: '13px' }} />
            <div style={{ ...styles.bar, width: '100%', height: '11px', opacity: 0.7 }} />
            <div style={{ ...styles.bar, width: '85%', height: '11px', opacity: 0.7 }} />
            <div style={{ ...styles.bar, width: '65%', height: '11px', opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// La keyframe `shimmer` est définie globalement dans globals.css.
const pulse = {
  background: 'linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s infinite var(--ease-smooth)',
  borderRadius: 'var(--r-sm)',
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--s-6)',
  },
  hero: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)',
    padding: 'clamp(22px,3vw,36px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  kpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
    gap: 'var(--s-4)',
  },
  kpi: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    padding: 'var(--s-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
    gap: 'var(--s-4)',
  },
  card: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)',
    padding: 'var(--s-6)',
    minHeight: '170px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  bar: {
    ...pulse,
  },
}
