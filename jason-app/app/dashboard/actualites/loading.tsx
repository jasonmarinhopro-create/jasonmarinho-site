export default function Loading() {
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ ...s.bar, width: '180px', height: '28px', borderRadius: '10px' }} />
        <div style={{ ...s.bar, width: '90px', height: '34px', borderRadius: '10px' }} />
      </div>
      
      {/* List rows skeleton */}
      <div style={s.list}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={s.row}>
            <div style={{ ...s.circle, width: '42px', height: '42px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ ...s.bar, width: i % 2 === 0 ? '55%' : '70%', height: '13px' }} />
              <div style={{ ...s.bar, width: '40%', height: '11px', opacity: 0.5 }} />
            </div>
            <div style={{ ...s.bar, width: '72px', height: '28px', borderRadius: '8px' }} />
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
