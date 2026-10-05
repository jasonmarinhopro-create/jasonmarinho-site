// Squelette de la page « Visibilité » : bandeau, onglets, 4 chiffres, courbe et 2 listes.
export default function VisibiliteLoading() {
  return (
    <div style={s.page} aria-busy="true" aria-label="Chargement">
      <div style={s.hero}>
        <div style={{ flex: '1 1 440px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...s.bar, width: 160, height: 12 }} />
          <div style={{ ...s.bar, width: 'min(420px, 90%)', height: 32 }} />
          <div style={{ ...s.bar, width: 'min(520px, 100%)', height: 14, opacity: 0.7 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[70, 80, 70].map((w, i) => <div key={i} style={{ ...s.bar, width: w, height: 32, borderRadius: 999 }} />)}
          </div>
        </div>
        <div style={{ ...s.card, flex: '0 1 320px', minHeight: 170, background: 'var(--surface)' }}>
          <div style={{ ...s.bar, width: '50%', height: 11 }} />
          <div style={{ ...s.bar, width: '35%', height: 28 }} />
          <div style={{ ...s.bar, width: '60%', height: 11, opacity: 0.7 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, overflow: 'hidden' }}>
        {[120, 100, 150, 70, 110, 90].map((w, i) => <div key={i} style={{ ...s.bar, width: w, height: 18, flexShrink: 0 }} />)}
      </div>

      <div style={s.kpis}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ ...s.card, minHeight: 130 }}>
            <div style={{ ...s.bar, width: '60%', height: 12 }} />
            <div style={{ ...s.bar, width: '35%', height: 30 }} />
            <div style={{ ...s.bar, width: '80%', height: 11, opacity: 0.6 }} />
          </div>
        ))}
      </div>

      <div style={{ ...s.card, minHeight: 280 }}>
        <div style={{ ...s.bar, width: 200, height: 18 }} />
        <div style={{ ...s.bar, width: '100%', flex: 1, minHeight: 180, opacity: 0.5 }} />
      </div>

      <div style={s.grid}>
        {[0, 1].map(i => (
          <div key={i} style={{ ...s.card, minHeight: 260 }}>
            <div style={{ ...s.bar, width: '55%', height: 16 }} />
            {[0, 1, 2, 3, 4].map(j => <div key={j} style={{ ...s.bar, width: `${90 - j * 8}%`, height: 12, opacity: 0.6 }} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

// La keyframe `shimmer` est définie globalement dans globals.css.
const pulse: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s infinite var(--ease-smooth)',
  borderRadius: 'var(--r-sm)',
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  hero: {
    display: 'flex', flexWrap: 'wrap', gap: '24px 40px', alignItems: 'center',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
    border: '1px solid var(--accent-border)', borderRadius: 20, padding: 'clamp(22px,3vw,36px)',
  },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 16 },
  card: { border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  bar: { ...pulse },
}
