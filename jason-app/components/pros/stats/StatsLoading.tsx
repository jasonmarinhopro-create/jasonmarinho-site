// Squelette de « Mes statistiques » : bandeau, 6 chiffres, courbe, cartes.
export default function StatsLoading() {
  const bar: React.CSSProperties = { background: 'var(--surface-2)', borderRadius: 8 }
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }
  return (
    <div style={{ padding: 'clamp(16px, 3vw, 44px)', width: '100%' }} aria-busy="true" aria-label="Chargement des statistiques">
      <div style={{ padding: 'clamp(22px,3vw,36px)', borderRadius: 20, marginBottom: 28, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
        <div style={{ ...bar, width: 180, height: 14, marginBottom: 14 }} />
        <div style={{ ...bar, width: 'min(420px, 90%)', height: 34, marginBottom: 12 }} />
        <div style={{ ...bar, width: 'min(560px, 95%)', height: 14 }} />
      </div>
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, marginBottom: 22 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ ...bar, width: '60%', height: 12 }} />
              <div style={{ ...bar, width: '45%', height: 26 }} />
              <div style={{ ...bar, width: '70%', height: 10, opacity: 0.6 }} />
            </div>
          ))}
        </div>
        <div style={{ ...bar, width: '100%', height: 240, borderRadius: 12, opacity: 0.6 }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 20 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ ...card, flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...bar, width: 200, height: 18 }} />
            {[1, 2, 3, 4].map(j => <div key={j} style={{ ...bar, width: `${90 - j * 15}%`, height: 10 }} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
