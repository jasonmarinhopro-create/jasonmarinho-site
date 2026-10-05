'use client'
// Courbe de « Mes statistiques » (05/10/2026), SVG fait main : la période en
// trait plein vert, la période d'avant en pointillés gris, le dernier point
// en pointillés s'il couvre des jours pas encore passés (mois en cours).
// Survol : ligne verticale, point et bulle avec les deux valeurs.
import { useState } from 'react'
import { bucketLabel, type SeriesPoint } from '@/lib/visibility/pro-stats'
import type { Granularity } from '@/lib/visibility/rules'

const W = 1000
const H = 1000

/** Plafond « rond » de l'axe : 4 → 5, 37 → 40, 230 → 250 */
export function niceMax(v: number): number {
  if (v <= 4) return Math.max(4, Math.ceil(v))
  const pow = 10 ** Math.floor(Math.log10(v))
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * pow >= v) return m * pow
  return 10 * pow
}

export default function StatsChart({ series, granularity, incompleteLast, format, height = 240, showPrev, unmeasuredUntil }: {
  series: SeriesPoint[]
  granularity: Granularity
  incompleteLast: boolean
  format: (v: number) => string
  height?: number
  showPrev: boolean
  /** Jour de début de la mesure : la partie d'avant est grisée */
  unmeasuredUntil?: string | null
}) {
  const [hover, setHover] = useState<number | null>(null)
  const n = series.length
  if (!n) return null
  const max = niceMax(Math.max(...series.map(p => Math.max(p.cur, showPrev ? p.prev ?? 0 : 0)), 0))
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W)
  const y = (v: number) => H - (v / max) * H
  const line = (pts: Array<[number, number]>) => pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join(' ')

  const cur = series.map((p, i) => [x(i), y(p.cur)] as [number, number])
  const solid = incompleteLast && n > 1 ? cur.slice(0, -1) : cur
  const tail = incompleteLast && n > 1 ? cur.slice(-2) : null
  const prev = showPrev ? series.map((p, i) => [x(i), y(p.prev ?? 0)] as [number, number]) : null
  const area = `${line(cur)} L${x(n - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`

  // 5 à 7 libellés d'axe répartis, toujours le premier et le dernier
  const every = Math.max(1, Math.ceil(n / 6))
  const xLabels = series.map((p, i) => i).filter(i => i % every === 0 || i === n - 1)
    .filter((i, k, arr) => !(k === arr.length - 2 && n - 1 - i < every / 2))
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const h = hover !== null ? series[hover] : null
  const leftPct = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  // Points entièrement avant le début de la mesure (une semaine ou un mois à cheval reste mesuré)
  // Premier point mesuré = dernier point dont le début tombe au plus tard ce jour-là
  let lastUnmeasured = -1
  if (unmeasuredUntil) series.forEach((p, i) => { if (p.key <= unmeasuredUntil) lastUnmeasured = i })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 10, rowGap: 8 }}>
      <div style={{ position: 'relative', height, width: 44 }} aria-hidden>
        {ticks.map(t => (
          <span key={t} style={{ position: 'absolute', right: 0, top: `${(1 - t) * 100}%`, transform: 'translateY(-50%)', fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {format(Math.round(max * t))}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', height }} onMouseLeave={() => setHover(null)}>
        {ticks.map(t => (
          <div key={t} style={{ position: 'absolute', left: 0, right: 0, top: `${(1 - t) * 100}%`, borderTop: t === 0 ? '1px solid var(--border)' : '1px dashed var(--border)', opacity: t === 0 ? 1 : 0.7 }} />
        ))}
        {lastUnmeasured > 0 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${leftPct(lastUnmeasured)}%`, background: 'repeating-linear-gradient(135deg, transparent 0 6px, var(--surface-2) 6px 8px)', opacity: 0.8, borderRight: '1px dashed var(--border)' }}>
            <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 11.5, color: 'var(--text-3)', background: 'var(--surface)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Pas encore mesuré</span>
          </div>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} role="img" aria-label="Évolution sur la période">
          <defs>
            <linearGradient id="statsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-text)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--accent-text)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#statsArea)" stroke="none" />
          {prev && <path d={line(prev)} fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />}
          {solid.length > 1 && <path d={line(solid)} fill="none" stroke="var(--accent-text)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
          {tail && <path d={line(tail)} fill="none" stroke="var(--accent-text)" strokeWidth={2.5} strokeDasharray="3 5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
        </svg>
        {series.every(p => p.cur === 0 && !(showPrev && p.prev)) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, padding: '6px 14px' }}>Rien sur la période pour l&apos;instant</span>
          </div>
        )}
        {n === 1 && <Dot left={50} top={(1 - series[0].cur / max) * 100} />}
        {h && hover !== null && (
          <>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${leftPct(hover)}%`, borderLeft: '1px solid var(--accent-border)', pointerEvents: 'none' }} />
            {showPrev && h.prev !== null && <Dot left={leftPct(hover)} top={(1 - h.prev / max) * 100} muted />}
            <Dot left={leftPct(hover)} top={(1 - h.cur / max) * 100} />
            <div style={{
              position: 'absolute', top: 6, left: `${leftPct(hover)}%`, transform: `translateX(${leftPct(hover) > 70 ? 'calc(-100% - 12px)' : '12px'})`,
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              pointerEvents: 'none', minWidth: 170, zIndex: 2,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
                {bucketLabel(h.key, granularity, { long: true })}{incompleteLast && hover === n - 1 ? ' (en cours)' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text)', fontWeight: 700 }}>
                <span style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--accent-text)' }} /> {format(h.cur)}
              </div>
              {showPrev && h.prev !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>
                  <span style={{ width: 14, height: 0, borderTop: '2px dashed var(--text-muted)' }} /> {format(h.prev)} <span style={{ color: 'var(--text-muted)' }}>période d&apos;avant</span>
                </div>
              )}
            </div>
          </>
        )}
        {/* Zones de survol, plus larges que les points */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {series.map((p, i) => (
            <div key={p.key} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} style={{ flex: 1, cursor: 'crosshair' }} />
          ))}
        </div>
      </div>
      <div />
      <div style={{ position: 'relative', height: 18 }} aria-hidden>
        {xLabels.map(i => (
          <span key={i} style={{
            position: 'absolute', left: `${leftPct(i)}%`,
            transform: i === 0 && n > 1 ? 'none' : i === n - 1 && n > 1 ? 'translateX(-100%)' : 'translateX(-50%)',
            fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap',
          }}>
            {bucketLabel(series[i].key, granularity)}
          </span>
        ))}
      </div>
    </div>
  )
}

function Dot({ left, top, muted }: { left: number; top: number; muted?: boolean }) {
  return (
    <span style={{
      position: 'absolute', left: `${left}%`, top: `${top}%`, width: 10, height: 10, borderRadius: '50%', transform: 'translate(-50%, -50%)',
      background: muted ? 'var(--surface)' : 'var(--accent-text)', border: muted ? '2px solid var(--text-muted)' : '2px solid var(--surface)',
      boxShadow: muted ? 'none' : '0 0 0 1px var(--accent-text)', pointerEvents: 'none',
    }} />
  )
}
