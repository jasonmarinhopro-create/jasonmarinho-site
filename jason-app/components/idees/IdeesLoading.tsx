// Squelette de la page Idées (sans lui, celui de la page parente s'affichait)
export default function IdeesLoading() {
  const bar = (h: number, w = '100%') => ({ height: h, width: w, borderRadius: 14, background: 'var(--border)', opacity: 0.5 })
  return (
    <div style={{ padding: 'clamp(16px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 16 }} aria-busy="true">
      <div style={bar(220)} />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={bar(40, '70%')} />
          {[0, 1, 2].map(i => <div key={i} style={bar(120)} />)}
        </div>
        <div style={{ flex: '1 1 300px', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={bar(160)} />
          <div style={bar(140)} />
        </div>
      </div>
    </div>
  )
}
