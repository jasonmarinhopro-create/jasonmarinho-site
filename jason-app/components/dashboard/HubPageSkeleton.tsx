// Squelette des espaces à bandeau HubHero (24/11/2026) : Groupes Facebook,
// Fiche Google. Jason : « il n'y a plus le squelette, juste "Communauté
// Driing" au milieu, ça fait vide ». Même forme que la page : bandeau vert
// avec carte à droite, puis colonne + liste de cartes.
export default function HubPageSkeleton({ aside = true }: { aside?: boolean }) {
  return (
    <div style={s.page} data-page-skel="">
      <div style={s.hero}>
        <div style={{ flex: '1 1 440px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={{ ...s.bar, width: 140, height: 12 }} />
          <div style={{ ...s.bar, width: 'min(420px, 90%)', height: 34 }} />
          <div style={{ ...s.bar, width: 'min(560px, 95%)', height: 14, opacity: 0.6 }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            {[150, 170, 160].map((w, i) => <div key={i} style={{ ...s.bar, width: w, height: 34, borderRadius: 999, opacity: 0.7 }} />)}
          </div>
        </div>
        <div style={{ ...s.bar, flex: '0 1 300px', height: 120, borderRadius: 18, opacity: 0.8 }} />
      </div>
      <div style={{ ...s.cols, gridTemplateColumns: aside ? 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' : 'minmax(0, 1fr)' }}>
        {aside && <div style={{ ...s.card, minHeight: 360 }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ ...s.card, minHeight: 88, animationDelay: `${i * 60}ms` }} />)}
        </div>
      </div>
    </div>
  )
}

const pulse: React.CSSProperties = { background: 'var(--surface-2)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite' }
const s: Record<string, React.CSSProperties> = {
  page: { padding: '20px var(--dash-page-px) 32px', width: '100%' },
  hero: {
    display: 'flex', flexWrap: 'wrap', gap: '24px 40px', alignItems: 'center', padding: 'clamp(22px,3vw,36px)',
    borderRadius: 20, marginBottom: 28, border: '1px solid var(--accent-border)',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
  },
  cols: { display: 'grid', gap: 16, alignItems: 'start' },
  card: { ...pulse, borderRadius: 18, border: '1px solid var(--border)' },
  bar: { ...pulse, borderRadius: 8, maxWidth: '100%' },
}
