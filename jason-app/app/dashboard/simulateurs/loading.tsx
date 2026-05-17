// Skeleton qui matche la structure réelle de /dashboard/simulateurs (et calculateurs)
// pour donner immédiatement le sentiment que la page est là, avant que le serveur
// finisse de fetch les logements + séjours + accountStats.
export default function Loading() {
  return (
    <div style={s.page}>
      {/* PageSwitcher pill */}
      <div style={s.switcher}>
        <div style={{ ...s.bar, width: '160px', height: '32px' }} />
        <div style={{ ...s.bar, width: '170px', height: '32px', opacity: 0.5 }} />
      </div>

      {/* Hero */}
      <div style={{ ...s.bar, width: '160px', height: '20px', marginBottom: '14px' }} />
      <div style={{ ...s.bar, width: '320px', height: '40px', marginBottom: '10px' }} />
      <div style={{ ...s.bar, width: '560px', maxWidth: '90%', height: '15px', opacity: 0.55, marginBottom: '28px' }} />

      {/* ActivityOverview card */}
      <div style={s.activityWrap}>
        <div style={{ ...s.bar, width: '220px', height: '24px', marginBottom: '8px' }} />
        <div style={{ ...s.bar, width: '380px', maxWidth: '85%', height: '13px', opacity: 0.55, marginBottom: '22px' }} />

        {/* 5 tuiles */}
        <div style={s.tilesGrid}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ ...s.tile, animationDelay: `${i * 50}ms` }}>
              <div style={{ ...s.bar, width: '60px', height: '11px', marginBottom: '10px', opacity: 0.6 }} />
              <div style={{ ...s.bar, width: '100px', height: '22px', marginBottom: '6px' }} />
              <div style={{ ...s.bar, width: '80%', height: '11px', opacity: 0.45 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs row */}
      <div style={s.tabsRow}>
        {[110, 90, 110, 130, 130].map((w, i) => (
          <div key={i} style={{ ...s.bar, width: `${w}px`, height: '32px', borderRadius: '10px', opacity: i === 0 ? 1 : 0.45 }} />
        ))}
      </div>

      {/* Body card */}
      <div style={s.bodyCard} />
    </div>
  )
}

const pulse = {
  background: 'linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s infinite var(--ease-smooth, ease)',
  borderRadius: 'var(--r-sm, 8px)',
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: 'clamp(14px, 3vw, 44px)',
    width: '100%',
    animation: 'fadeIn var(--d-base, 200ms) var(--ease-smooth, ease)',
  },
  switcher: {
    display: 'inline-flex', gap: '6px', padding: '4px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', marginBottom: 'clamp(18px, 2.5vw, 26px)',
  },
  bar: {
    ...pulse,
  },
  activityWrap: {
    padding: 'clamp(20px, 3vw, 28px)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    marginBottom: 'clamp(22px, 3vw, 30px)',
  },
  tilesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
    gap: '12px',
  },
  tile: {
    padding: '16px 18px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    minHeight: '90px',
  },
  tabsRow: {
    display: 'flex', gap: '8px', padding: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', marginBottom: 'clamp(18px, 2.5vw, 24px)',
    flexWrap: 'wrap',
  },
  bodyCard: {
    ...pulse,
    minHeight: '480px',
    padding: 'clamp(18px, 2.6vw, 28px)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    opacity: 0.5,
  },
}
