// Éléments d'interface partagés par les onglets de « Mes finances ».
// Composants sans état (utilisables côté serveur comme côté client).
import type { CSSProperties, ReactNode } from 'react'

export const COLORS = {
  revenus: 'var(--accent-text)',
  aVenir: 'rgba(47,158,91,0.35)',
  commissions: '#B7791F',
  charges: '#C2410C',
  neutre: 'var(--text-3)',
}

const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** 12 345 € (arrondi à l'euro) */
export function eur(n: number): string {
  return `${nf0.format(Math.round(n))} €`
}
/** 12 345,50 € (centimes si présents) */
export function eurPrecis(n: number): string {
  return `${nf2.format(n)} €`
}
export function pct(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits).replace('.', ',')} %`
}
export function dateCourte(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
export function dateLongue(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function Card({ children, style, id }: { children: ReactNode; style?: CSSProperties; id?: string }) {
  return <section id={id} style={{ ...ui.card, ...style }}>{children}</section>
}

export function CardHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div style={ui.cardHead}>
      <div style={{ minWidth: 0 }}>
        <h2 style={ui.cardTitle}>{title}</h2>
        {sub && <p style={ui.cardSub}>{sub}</p>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  )
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'green' | 'amber' | 'red' | 'muted' }) {
  const color = tone === 'green' ? 'var(--accent-text)' : tone === 'amber' ? COLORS.commissions : tone === 'red' ? COLORS.charges : tone === 'muted' ? 'var(--text-3)' : 'var(--text)'
  return (
    <div style={ui.stat}>
      <div style={ui.statLabel}>{label}</div>
      <div style={{ ...ui.statValue, color }}>{value}</div>
      {hint && <div style={ui.statHint}>{hint}</div>}
    </div>
  )
}

/** Note de définition sous un chiffre : dit exactement ce qui est compté */
export function Definition({ children }: { children: ReactNode }) {
  return <p style={ui.definition}>{children}</p>
}

export function Notice({ tone = 'info', children, action }: { tone?: 'info' | 'warn' | 'ok'; children: ReactNode; action?: ReactNode }) {
  const palette = tone === 'warn'
    ? { bg: 'rgba(255,213,107,0.14)', border: 'rgba(183,121,31,0.35)' }
    : tone === 'ok'
      ? { bg: 'var(--accent-bg)', border: 'var(--accent-border)' }
      : { bg: 'var(--bg-2)', border: 'var(--border)' }
  return (
    <div style={{ ...ui.notice, background: palette.bg, borderColor: palette.border }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

export function ProgressBar({ value, color = 'var(--accent-text)', height = 8 }: { value: number; color?: string; height?: number }) {
  const w = Math.max(0, Math.min(1, value)) * 100
  return (
    <div style={{ height, borderRadius: 999, background: 'var(--bg-3)', overflow: 'hidden' }}>
      <div style={{ width: `${w}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

export const ui: Record<string, CSSProperties> = {
  page: { padding: '20px var(--dash-page-px) 48px', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl, 18px)',
    padding: 'clamp(16px, 2.2vw, 24px)', minWidth: 0,
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  cardTitle: { margin: 0, fontFamily: 'var(--font-fraunces), serif', fontSize: 18, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' },
  cardSub: { margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 },
  stat: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  statLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.02em' },
  statValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px, 2.4vw, 26px)', fontWeight: 500, lineHeight: 1.15, whiteSpace: 'nowrap' },
  statHint: { fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45 },
  definition: { margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 },
  notice: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 12, border: '1px solid', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 16 },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16 },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
    background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
    background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
  },
  link: { color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13.5 },
  th: { textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', padding: '8px 10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  td: { padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', verticalAlign: 'middle' },
}
