export default function Loading() {
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ ...s.bar, width: '180px', height: '28px', borderRadius: '10px' }} />
        <div style={{ ...s.bar, width: '90px', height: '34px', borderRadius: '10px' }} />
      </div>
      
      {/* Cards grid skeleton */}
      <div style={s.grid}>
        {[1,2,3,4].map(i => (
          <div key={i} style={s.card}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ ...s.circle, width: '40px', height: '40px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ ...s.bar, width: '65%', height: '13px' }} />
                <div style={{ ...s.bar, width: '45%', height: '11px', opacity: 0.5 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ ...s.bar, width: '100%', height: '11px' }} />
              <div style={{ ...s.bar, width: '80%', height: '11px', opacity: 0.6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const pulse: React.CSSProperties = {
  background: 'var(--surface-2)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.6s infinite',
  borderRadius: '8px',
}

const s: Record<string, React.CSSProperties> = {
  page:   { padding: 'clamp(20px,3vw,44px)', width: '100%', animation: 'fadeIn 0.15s ease' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  grid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' },
  list:   { display: 'flex', flexDirection: 'column', gap: '10px' },
  card:   { ...pulse, borderRadius: '18px', padding: '24px', minHeight: '160px' },
  row:    { ...pulse, borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' },
  bar:    { ...pulse, borderRadius: '6px' },
  circle: { ...pulse, borderRadius: '50%', flexShrink: 0 },
}
