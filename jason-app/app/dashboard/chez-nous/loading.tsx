export default function ChezNousLoading() {
  return (
    <div style={s.page}>
      <style>{CSS}</style>

      {/* Barre de stats */}
      <div style={s.statsRow}>
        {[80, 100, 90].map((w, i) => (
          <div key={i} style={{ ...s.statBox }}>
            <div style={{ ...s.skel, width: w, height: 28, borderRadius: 6, marginBottom: 6 }} />
            <div style={{ ...s.skel, width: 60, height: 13, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      <div style={s.body}>
        {/* Colonne principale */}
        <div style={s.main}>
          {/* Bouton + filtres */}
          <div style={s.toolbar}>
            <div style={{ ...s.skel, width: 140, height: 38, borderRadius: 10 }} />
            <div style={s.filterRow}>
              {[70, 80, 90, 85].map((w, i) => (
                <div key={i} style={{ ...s.skel, width: w, height: 32, borderRadius: 8 }} />
              ))}
            </div>
          </div>

          {/* Posts skeleton */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={s.post}>
              <div style={s.postLeft}>
                <div style={{ ...s.skel, width: 36, height: 36, borderRadius: '50%' }} />
              </div>
              <div style={s.postRight}>
                <div style={{ ...s.skel, width: `${60 + (i % 3) * 15}%`, height: 16, borderRadius: 5, marginBottom: 8 }} />
                <div style={{ ...s.skel, width: `${40 + (i % 4) * 10}%`, height: 13, borderRadius: 4, marginBottom: 10 }} />
                <div style={s.postMeta}>
                  <div style={{ ...s.skel, width: 60, height: 12, borderRadius: 4 }} />
                  <div style={{ ...s.skel, width: 40, height: 12, borderRadius: 4 }} />
                  <div style={{ ...s.skel, width: 50, height: 12, borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Colonne latérale */}
        <aside style={s.sidebar}>
          {[1, 2].map(block => (
            <div key={block} style={s.sideBlock}>
              <div style={{ ...s.skel, width: 120, height: 14, borderRadius: 4, marginBottom: 14 }} />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={s.sideItem}>
                  <div style={{ ...s.skel, width: 30, height: 30, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...s.skel, width: '70%', height: 13, borderRadius: 4, marginBottom: 5 }} />
                    <div style={{ ...s.skel, width: '45%', height: 11, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </aside>
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
  page:       { padding: 'clamp(16px,3vw,44px)', width: '100%' },
  statsRow:   { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  statBox:    { background: 'var(--surface)', borderRadius: 12, padding: '14px 20px', flex: 1, minWidth: 100 },
  skel:       { ...skelBase, flexShrink: 0 },
  body:       { display: 'flex', gap: 24, alignItems: 'flex-start' },
  main:       { flex: 1, minWidth: 0 },
  toolbar:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  filterRow:  { display: 'flex', gap: 8, flexWrap: 'wrap' },
  post:       { display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' },
  postLeft:   { flexShrink: 0 },
  postRight:  { flex: 1, minWidth: 0 },
  postMeta:   { display: 'flex', gap: 12 },
  sidebar:    { width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 },
  sideBlock:  { background: 'var(--surface)', borderRadius: 12, padding: 16 },
  sideItem:   { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 },
}
