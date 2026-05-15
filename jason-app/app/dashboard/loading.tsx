export default function DashboardLoading() {
  return (
    <div style={styles.page}>
      {/* Header skeleton */}
      <div style={styles.headerSkel} />

      {/* Hero skeleton */}
      <div style={styles.hero}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ ...styles.bar, width: '120px', height: '13px' }} />
          <div style={{ ...styles.bar, width: '280px', height: '36px' }} />
          <div style={{ ...styles.bar, width: '380px', height: '14px', opacity: 0.6 }} />
        </div>
      </div>

      {/* Grid skeleton */}
      <div style={styles.grid}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ ...styles.card, animationDelay: `${i * 60}ms` }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ ...styles.circle, width: '44px', height: '44px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ ...styles.bar, width: '60%', height: '15px' }} />
                <div style={{ ...styles.bar, width: '40%', height: '12px', opacity: 0.6 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ ...styles.bar, width: '100%', height: '12px' }} />
              <div style={{ ...styles.bar, width: '85%', height: '12px' }} />
              <div style={{ ...styles.bar, width: '70%', height: '12px', opacity: 0.6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Shimmer 2026 : vrai gradient animé avec contraste (light strip qui balaie).
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
    animation: 'fadeIn var(--d-base) var(--ease-smooth)',
  },
  headerSkel: {
    ...pulse,
    height: '44px',
    width: '240px',
    borderRadius: 'var(--r-md)',
    marginBottom: 'var(--s-8)',
  },
  hero: {
    ...pulse,
    borderRadius: 'var(--r-xl)',
    padding: 'clamp(24px,3vw,40px) clamp(24px,4vw,48px)',
    marginBottom: 'var(--s-8)',
    minHeight: '140px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--s-4)',
  },
  card: {
    ...pulse,
    borderRadius: 'var(--r-xl)',
    padding: 'var(--s-7)',
    minHeight: '180px',
  },
  bar: {
    ...pulse,
    borderRadius: 'var(--r-sm)',
  },
  circle: {
    ...pulse,
    borderRadius: '50%',
    flexShrink: 0,
  },
}
