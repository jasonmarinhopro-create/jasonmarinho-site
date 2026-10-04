// Squelette de la fiche membre (04/10/2026). Sans lui, passer d'une fiche à
// l'autre affichait le squelette de la Vue d'ensemble admin (chiffres clés).
const pulse: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s infinite var(--ease-smooth)',
  borderRadius: 8,
}

export default function MembreLoading() {
  return (
    <div style={{ padding: 'clamp(20px,3vw,44px)', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} aria-busy="true" aria-label="Chargement de la fiche">
      <div style={{ ...pulse, width: 120, height: 14 }} />
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: 'clamp(20px,3vw,32px)', borderRadius: 20, border: '1px solid var(--accent-border)', background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)' }}>
        <div style={{ ...pulse, width: 68, height: 68, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div style={{ ...pulse, width: '45%', height: 24 }} />
          <div style={{ ...pulse, width: '60%', height: 12 }} />
          <div style={{ ...pulse, width: '35%', height: 20, borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: 12, padding: 18, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {[0, 1].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, border: '1px solid var(--border)' }}>
            <div style={{ ...pulse, width: '50%', height: 16 }} />
            <div style={{ ...pulse, width: '90%', height: 11 }} />
            <div style={{ ...pulse, width: '75%', height: 11 }} />
          </div>
        ))}
      </div>
      <div style={{ ...pulse, height: 160, borderRadius: 18 }} />
    </div>
  )
}
