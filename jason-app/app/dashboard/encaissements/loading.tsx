export default function Loading() {
  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={{ ...s.bar, width: '110px', height: '20px', borderRadius: '999px', marginBottom: '12px' }} />
        <div style={{ ...s.bar, width: '260px', height: '34px', marginBottom: '10px' }} />
        <div style={{ ...s.bar, width: '90%', maxWidth: '480px', height: '14px' }} />
      </div>
      <div style={s.grid}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={s.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ ...s.bar, width: '60%', height: '11px' }} />
              <div style={{ ...s.bar, width: '20px', height: '20px', borderRadius: '50%' }} />
            </div>
            <div style={{ ...s.bar, width: '70%', height: '26px', marginBottom: '6px' }} />
            <div style={{ ...s.bar, width: '85%', height: '11px', opacity: 0.6 }} />
          </div>
        ))}
      </div>
      <div style={s.bigCard}>
        <div style={{ ...s.bar, width: '200px', height: '20px', marginBottom: '14px' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={s.row}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ ...s.bar, width: '40%', height: '13px' }} />
              <div style={{ ...s.bar, width: '60%', height: '11px', opacity: 0.6 }} />
            </div>
            <div style={{ ...s.bar, width: '120px', height: '32px', borderRadius: '8px' }} />
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
  page:     { padding: 'clamp(14px, 3vw, 44px)', width: '100%', display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.15s ease' },
  hero:     { marginBottom: '4px' },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  statCard: { ...pulse, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 20px', minHeight: '100px' },
  bigCard:  { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px' },
  row:      { ...pulse, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '14px' },
  bar:      { ...pulse, borderRadius: '6px' },
}
