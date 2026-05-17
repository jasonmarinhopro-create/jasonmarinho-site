// Skeleton générique pour les pages dashboard sans loading.tsx custom.
// Reproduit la structure typique : titre + sous-titre + 3-4 cards en grid.
// Utilise les tokens globaux (shimmer keyframe dans globals.css).

interface PageSkeletonProps {
  /** Nombre de cards à afficher en grille sous le hero. Défaut 3. */
  cards?: number
  /** Si true, ajoute un sélecteur/tabs row au-dessus de la grille. */
  withTabs?: boolean
}

export default function PageSkeleton({ cards = 3, withTabs = false }: PageSkeletonProps) {
  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={{ ...s.bar, width: '160px', height: '20px', marginBottom: '14px' }} />
      <div style={{ ...s.bar, width: '320px', maxWidth: '85%', height: '36px', marginBottom: '10px' }} />
      <div style={{ ...s.bar, width: '560px', maxWidth: '90%', height: '14px', opacity: 0.55, marginBottom: '24px' }} />

      {withTabs && (
        <div style={s.tabsRow}>
          {[100, 120, 130, 110].map((w, i) => (
            <div key={i} style={{ ...s.bar, width: `${w}px`, height: '30px', borderRadius: '10px', opacity: i === 0 ? 1 : 0.45 }} />
          ))}
        </div>
      )}

      <div style={s.grid}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} style={{ ...s.card, animationDelay: `${i * 60}ms` }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ ...s.circle, width: '40px', height: '40px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...s.bar, width: '60%', height: '14px', marginBottom: '6px' }} />
                <div style={{ ...s.bar, width: '40%', height: '11px', opacity: 0.55 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ ...s.bar, width: '100%', height: '11px' }} />
              <div style={{ ...s.bar, width: '80%', height: '11px', opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>
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
    padding: 'clamp(20px, 3vw, 44px)',
    width: '100%',
    animation: 'fadeIn var(--d-base, 200ms) var(--ease-smooth, ease)',
  },
  bar: { ...pulse },
  tabsRow: {
    display: 'flex', gap: '8px', padding: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', marginBottom: '22px',
    flexWrap: 'wrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    ...pulse,
    padding: '20px',
    borderRadius: '14px',
    minHeight: '140px',
  },
  circle: {
    ...pulse,
    borderRadius: '50%',
    flexShrink: 0,
  },
}
