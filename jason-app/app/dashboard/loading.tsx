export default function DashboardLoading() {
  return (
    <div style={styles.page}>
      {/* Header skeleton */}
      <div style={styles.headerSkel} />

      {/* Hero skeleton */}
      <div style={styles.hero}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ ...styles.bar, width: '120px', height: '13px' }} />
          <div style={{ ...styles.bar, width: '280px', height: '32px' }} />
          <div style={{ ...styles.bar, width: '380px', height: '14px', opacity: 0.5 }} />
        </div>
      </div>

      {/* Grid skeleton */}
      <div style={styles.grid}>
        {[1, 2, 3].map(i => (
          <div key={i} style={styles.card}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ ...styles.circle, width: '44px', height: '44px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ ...styles.bar, width: '60%', height: '15px' }} />
                <div style={{ ...styles.bar, width: '40%', height: '12px', opacity: 0.5 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ ...styles.bar, width: '100%', height: '12px' }} />
              <div style={{ ...styles.bar, width: '85%', height: '12px' }} />
              <div style={{ ...styles.bar, width: '70%', height: '12px', opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const pulse = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.6s infinite',
  borderRadius: '8px',
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(20px,3vw,44px)',
    width: '100%',
    opacity: 1,
    animation: 'fadeIn 0.2s ease',
  },
  headerSkel: {
    ...pulse,
    height: '44px',
    width: '240px',
    borderRadius: '10px',
    marginBottom: '32px',
  },
  hero: {
    ...pulse,
    borderRadius: '20px',
    padding: 'clamp(24px,3vw,40px) clamp(24px,4vw,48px)',
    marginBottom: '32px',
    minHeight: '120px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    ...pulse,
    borderRadius: '18px',
    padding: '28px',
    minHeight: '180px',
  },
  bar: {
    ...pulse,
    borderRadius: '6px',
  },
  circle: {
    ...pulse,
    borderRadius: '50%',
    flexShrink: 0,
  },
}
