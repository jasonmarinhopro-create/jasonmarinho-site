// Briques communes des statistiques des pros (05/10/2026) : carte, onglets
// en pastilles, barres horizontales, pastille d'écart, pastille de place.
// Sans hook : utilisables côté serveur (fiche membre de l'admin) comme client.
import { TrendUp, TrendDown } from '@phosphor-icons/react/dist/ssr'
import { placeLabel } from '@/lib/visibility/rules'

export const AMBER = '#B7791F'
export const AMBER_DARK = '#8A5A12'

export function StatCard({ icon, title, subtitle, right, children, id, style }: {
  icon?: React.ReactNode; title: string; subtitle?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; id?: string; style?: React.CSSProperties
}) {
  return (
    <section id={id} style={{ ...card, ...style }} className="stats-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {icon && <span style={iconBox}>{icon}</span>}
          <div style={{ minWidth: 0 }}>
            <h2 style={cardTitle}>{title}</h2>
            {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.45 }}>{subtitle}</div>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Pills<T extends string>({ items, value, onChange, label }: {
  items: Array<{ key: T; label: string; count?: number }>; value: T; onChange: (k: T) => void; label: string
}) {
  return (
    <div role="tablist" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }} className="stats-noprint-tabs">
      {items.map(it => {
        const on = it.key === value
        return (
          <button key={it.key} type="button" role="tab" aria-selected={on} onClick={() => onChange(it.key)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            border: on ? '1px solid var(--accent-text)' : '1px solid var(--border)',
            background: on ? 'var(--accent-text)' : 'transparent',
            color: on ? 'var(--bg)' : 'var(--text-2)',
          }}>
            {it.label}
            {typeof it.count === 'number' && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '0 6px', borderRadius: 999, background: on ? 'rgba(255,255,255,0.22)' : 'var(--surface-2)', color: on ? 'var(--bg)' : 'var(--text-3)' }}>{it.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function BarList({ rows, limit = 6, empty }: { rows: Array<{ key: string; label: string; count: number; pct: number }>; limit?: number; empty: React.ReactNode }) {
  const shown = rows.slice(0, limit)
  if (!shown.length) return <EmptyNote>{empty}</EmptyNote>
  const top = Math.max(...shown.map(r => r.pct), 1)
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {shown.map(r => (
        <li key={r.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '6px 12px', alignItems: 'center' }}>
          <span style={{ fontSize: 13.5, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.label}>{r.label}</span>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            <strong style={{ color: 'var(--text)' }}>{r.pct} %</strong> <span style={{ color: 'var(--text-muted)' }}>· {r.count}</span>
          </span>
          <span style={{ gridColumn: '1 / -1', height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.max(3, (r.pct / top) * 100)}%`, borderRadius: 999, background: 'var(--accent-text)' }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '18px 16px', borderRadius: 12, background: 'var(--bg)', border: '1px dashed var(--border)', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
      {children}
    </div>
  )
}

export function MeasureNote({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '14px 0 0', lineHeight: 1.55 }}>{children}</p>
}

/** Écart en % : vert si ça monte (ou stable), ambre si ça baisse */
export function PctPill({ pct, size = 'md' }: { pct: number | null; size?: 'sm' | 'md' }) {
  if (pct === null) return null
  const up = pct >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, padding: size === 'sm' ? '1px 7px' : '2px 8px', borderRadius: 999,
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
      color: up ? 'var(--accent-text)' : AMBER_DARK,
      background: up ? 'var(--accent-bg)' : 'rgba(255,213,107,0.22)',
      border: up ? '1px solid var(--accent-border)' : `1px solid ${AMBER}55`,
    }}>
      {up ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
      {up ? '+' : ''}{pct} %
    </span>
  )
}

/** Place dans Google : vert foncé en première page (1er à 10e), vert pâle au-delà */
export function PlacePill({ position }: { position: number }) {
  const first = Math.round(position) <= 10
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, padding: '3px 8px', borderRadius: 999,
      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
      background: first ? 'var(--accent-text)' : 'var(--accent-bg)',
      color: first ? 'var(--bg)' : 'var(--accent-text)',
      border: first ? '1px solid var(--accent-text)' : '1px solid var(--accent-border)',
    }}>{placeLabel(position)}</span>
  )
}

export const nf = (n: number) => n.toLocaleString('fr-FR')

export const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 'clamp(16px, 2vw, 22px)', minWidth: 0,
}
export const cardTitle: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), serif', fontSize: 19, fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.25,
}
export const iconBox: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
}
