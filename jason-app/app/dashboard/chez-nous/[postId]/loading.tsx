export default function PostLoading() {
  return (
    <div style={s.page}>
      <style>{CSS}</style>

      {/* Bouton retour */}
      <div style={{ ...s.skel, width: 110, height: 22, borderRadius: 6, marginBottom: 20 }} />

      {/* Header du post : meta + titre */}
      <div style={s.header}>
        <div style={s.metaRow}>
          <div style={{ ...s.skel, width: 80, height: 22, borderRadius: 999 }} />
          <div style={{ ...s.skel, width: 60, height: 14, borderRadius: 4 }} />
        </div>
        <div style={{ ...s.skel, width: '75%', height: 32, borderRadius: 6, marginBottom: 18 }} />

        {/* Ligne auteur + actions */}
        <div style={s.authorRow}>
          <div style={{ ...s.skel, width: 38, height: 38, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...s.skel, width: 140, height: 14, borderRadius: 4, marginBottom: 5 }} />
            <div style={{ ...s.skel, width: 90, height: 12, borderRadius: 4 }} />
          </div>
          <div style={{ ...s.skel, width: 80, height: 32, borderRadius: 8 }} />
        </div>
      </div>

      {/* Corps du post : plusieurs paragraphes */}
      <div style={s.body}>
        <div style={{ ...s.skel, width: '100%', height: 14, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ ...s.skel, width: '92%', height: 14, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ ...s.skel, width: '80%', height: 14, borderRadius: 4, marginBottom: 18 }} />
        <div style={{ ...s.skel, width: '88%', height: 14, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ ...s.skel, width: '65%', height: 14, borderRadius: 4 }} />
      </div>

      {/* Bandeau stats */}
      <div style={s.statsRow}>
        {[1, 2].map(i => (
          <div key={i} style={s.statBox}>
            <div style={{ ...s.skel, width: 32, height: 22, borderRadius: 5, marginBottom: 5 }} />
            <div style={{ ...s.skel, width: 60, height: 11, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Titre Réponses */}
      <div style={{ ...s.skel, width: 160, height: 18, borderRadius: 5, marginBottom: 16 }} />

      {/* Réponses skeleton */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} style={s.reply}>
          <div style={{ ...s.skel, width: 32, height: 32, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...s.skel, width: 120, height: 13, borderRadius: 4, marginBottom: 7 }} />
            <div style={{ ...s.skel, width: '92%', height: 13, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ ...s.skel, width: '70%', height: 13, borderRadius: 4 }} />
          </div>
        </div>
      ))}

      {/* Form de réponse */}
      <div style={s.replyForm}>
        <div style={{ ...s.skel, width: 90, height: 13, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ ...s.skel, width: '100%', height: 100, borderRadius: 8 }} />
      </div>
    </div>
  )
}

const CSS = `
  @keyframes shimmer {
    0%   { background-position: -400px 0 }
    100% { background-position:  400px 0 }
  }
`

const skelBase: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--border) 25%, var(--surface-2, #f3f3f3) 50%, var(--border) 75%)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.4s infinite linear',
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding: 'clamp(16px,3vw,44px)', width: '100%', maxWidth: 920, margin: '0 auto' },
  skel:       { ...skelBase, flexShrink: 0 },
  header:     { marginBottom: 24 },
  metaRow:    { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 },
  authorRow:  { display: 'flex', gap: 12, alignItems: 'center' },
  body:       { padding: '18px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 18 },
  statsRow:   { display: 'flex', gap: 12, marginBottom: 28 },
  statBox:    { background: 'var(--surface)', borderRadius: 10, padding: '10px 16px', flex: 1, maxWidth: 130 },
  reply:      { display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' },
  replyForm:  { marginTop: 24, padding: 16, background: 'var(--surface)', borderRadius: 12 },
}
