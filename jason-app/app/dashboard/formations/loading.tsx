// Squelette de l'espace Formations (23/11/2026) : onglets à gauche, puis
// la leçon à reprendre et la colonne de progression, comme la page.
export default function Loading() {
  return (
    <div style={s.page}>
      <div style={{ ...s.bar, width: 'min(560px, 100%)', height: '48px', borderRadius: '14px', marginBottom: '20px' }} />
      <div style={s.grid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          <div style={{ ...s.bar, height: '250px', borderRadius: '24px' }} />
          <div style={{ ...s.bar, height: '84px', borderRadius: '18px', opacity: 0.7 }} />
          <div style={s.cards}>
            {[1, 2, 3].map(i => <div key={i} style={{ ...s.bar, height: '200px', borderRadius: '18px', opacity: 0.6 }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          <div style={{ ...s.bar, height: '150px', borderRadius: '18px' }} />
          <div style={{ ...s.bar, height: '120px', borderRadius: '18px', opacity: 0.7 }} />
          <div style={{ ...s.bar, height: '180px', borderRadius: '18px', opacity: 0.5 }} />
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '20px var(--dash-page-px) 40px', width: '100%', animation: 'fadeIn 0.15s ease' },
  bar: { background: 'var(--surface-2)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite', borderRadius: '8px', maxWidth: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '22px', alignItems: 'start' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' },
}
