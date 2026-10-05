// Briques visuelles de la page « Visibilité » (sans état : utilisables côté
// serveur comme dans les composants client).
import { ArrowUp, ArrowDown } from '@phosphor-icons/react/dist/ssr'
import { AMBER, tint } from '../_ui/theme'
import { fmtInt, type ProBucket } from '@/lib/visibility/admin-rules'
import type { PlaceBucket } from '@/lib/visibility/rules'

export const ACCENT = 'var(--accent-text)'

/** Nuances de vert, de la 1re place (foncé) à « au-delà » (pâle) */
export const BUCKET_STYLE: Record<ProBucket, { label: string; color: string; hint?: string }> = {
  '1': { label: '1er', color: `color-mix(in srgb, ${ACCENT} 100%, var(--surface))` },
  '2-3': { label: '2e-3e', color: `color-mix(in srgb, ${ACCENT} 76%, var(--surface))` },
  '4-10': { label: '4e-10e', color: `color-mix(in srgb, ${ACCENT} 54%, var(--surface))` },
  '11-20': { label: '11e-20e', color: `color-mix(in srgb, ${ACCENT} 32%, var(--surface))` },
  '21+': { label: 'Au-delà', color: `color-mix(in srgb, ${ACCENT} 16%, var(--surface))` },
  masked: { label: 'Recherches masquées', color: tint(AMBER, 45), hint: 'Vue dans Google, mais sur des recherches trop rares que Google ne détaille pas' },
  never: { label: 'Jamais montrées', color: 'var(--surface-2)', hint: 'Aucun affichage dans Google sur la période' },
}

export const PLACE_KEYS: PlaceBucket[] = ['1', '2-3', '4-10', '11-20', '21+']

/** Pastille de place : vert foncé en première page, vert pâle au-delà */
export function PlacePill({ place, size = 'md' }: { place: number | null | undefined; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? { minWidth: 30, height: 22, fontSize: 11.5 } : { minWidth: 38, height: 26, fontSize: 12.5 }
  if (place === null || place === undefined) {
    return <span style={{ ...pill, ...dims, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px dashed var(--border-2)' }}>–</span>
  }
  const first = place <= 10
  return (
    <span style={{
      ...pill, ...dims,
      background: first ? ACCENT : tint(ACCENT, 12),
      color: first ? 'var(--bg)' : ACCENT,
      border: `1px solid ${first ? ACCENT : tint(ACCENT, 26)}`,
    }}>
      {place === 1 ? '1er' : `${place}e`}
    </span>
  )
}

const pill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 7px', borderRadius: 8,
  fontWeight: 700, flexShrink: 0, fontVariantNumeric: 'tabular-nums', boxSizing: 'border-box',
}

/** Évolution de place : « +2 places » en vert, « -1 place » en ambre */
export function PlaceDelta({ delta, isNew, compact }: { delta: number | null; isNew?: boolean; compact?: boolean }) {
  if (isNew) return <span style={badge(ACCENT)}>nouvelle</span>
  if (delta === null) return <span style={{ color: 'var(--text-3)', fontSize: 12.5 }}>–</span>
  if (delta === 0) return <span style={{ color: 'var(--text-3)', fontSize: 12.5 }}>{compact ? '=' : 'stable'}</span>
  const up = delta > 0
  const n = Math.abs(delta)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontWeight: 700, color: up ? ACCENT : AMBER, whiteSpace: 'nowrap' }}>
      {up ? <ArrowUp size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
      {up ? '+' : '-'}{n}{compact ? '' : ` place${n > 1 ? 's' : ''}`}
    </span>
  )
}

/** Écart en % : « +12 % » vert, « -8 % » ambre */
export function PctDelta({ pct, suffix }: { pct: number | null; suffix?: string }) {
  if (pct === null) return <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>pas de comparaison</span>
  const up = pct >= 0
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontWeight: 700, color: up ? ACCENT : AMBER }}>
      {up ? <ArrowUp size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
      {up ? '+' : ''}{pct} %{suffix && <span style={{ fontWeight: 500, color: 'var(--text-3)' }}> {suffix}</span>}
    </span>
  )
}

export function badge(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    color, background: tint(color, 12), border: `1px solid ${tint(color, 26)}`, whiteSpace: 'nowrap', lineHeight: 1.5,
  }
}

/** Barre empilée par place + légende avec les nombres */
export function BucketBar({ counts, keys, height = 14 }: { counts: Partial<Record<ProBucket, number>>; keys: ProBucket[]; height?: number }) {
  const total = keys.reduce((n, k) => n + (counts[k] ?? 0), 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div role="img" aria-label={keys.map(k => `${BUCKET_STYLE[k].label} : ${counts[k] ?? 0}`).join(', ')}
        style={{ display: 'flex', gap: 2, height, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-2)' }}>
        {total > 0 && keys.filter(k => (counts[k] ?? 0) > 0).map(k => (
          <div key={k} title={`${BUCKET_STYLE[k].label} : ${counts[k]}`}
            style={{ flex: `${counts[k]} 1 0`, minWidth: 4, background: BUCKET_STYLE[k].color, border: k === 'never' ? '1px solid var(--border-2)' : undefined, boxSizing: 'border-box' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
        {keys.map(k => (
          <span key={k} title={BUCKET_STYLE[k].hint} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: BUCKET_STYLE[k].color, border: '1px solid var(--border)', flexShrink: 0 }} />
            {BUCKET_STYLE[k].label}
            <strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtInt(counts[k] ?? 0)}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Petit chiffre avec libellé (à droite des en-têtes de liste) */
export function Figure({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</span>
      <strong style={{ fontFamily: 'var(--font-fraunces), serif', fontWeight: 500, fontSize: 24, color: 'var(--text)', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      {sub && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</span>}
    </div>
  )
}

export const v: Record<string, React.CSSProperties> = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 'clamp(16px,2vw,22px)', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  head: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  icon: { width: 36, height: 36, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: tint(ACCENT, 12), color: ACCENT },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 19, fontWeight: 500, margin: 0, color: 'var(--text)', lineHeight: 1.25 },
  sub: { fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.55 },
  text: { fontSize: 14, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 16, alignItems: 'start' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  chipOn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, border: `1px solid ${ACCENT}`, background: ACCENT, color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  input: { flex: '1 1 220px', minWidth: 0, padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  select: { padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit', fontWeight: 600 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: `1px solid ${ACCENT}`, background: ACCENT, color: 'var(--bg)', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  colHead: { fontSize: 11.5, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-3)' },
  num: { fontVariantNumeric: 'tabular-nums', fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'right' },
  empty: { padding: '28px 12px', textAlign: 'center', fontSize: 14, color: 'var(--text-3)' },
  more: { alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: ACCENT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
