export default function Loading() {
  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={{ ...s.bar, width: '110px', height: '20px', borderRadius: '999px', marginBottom: '12px' }} />
        <div style={{ ...s.bar, width: '260px', height: '34px', marginBottom: '10px' }} />
        <div style={{ ...s.bar, width: '90%', maxWidth: '480px', height: '14px' }} />
      </div>
      <div style={{ ...s.bar, width: '320px', height: '38px', borderRadius: '12px' }} />
      <div style={s.list}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={s.row}>
            <div style={{ ...s.bar, width: '36px', height: '36px', borderRadius: '11px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ ...s.bar, width: '40%', height: '12px' }} />
              <div style={{ ...s.bar, width: '70%', height: '14px' }} />
              <div style={{ ...s.bar, width: '85%', height: '11px', opacity: 0.6 }} />
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
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeIn 0.15s ease' },
  hero: { marginBottom: '4px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: {
    ...pulse,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px 16px',
    display: 'flex', gap: '14px', alignItems: 'flex-start',
  },
  bar: { ...pulse, borderRadius: '6px' },
}
