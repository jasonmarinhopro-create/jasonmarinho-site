'use client'

import { useState } from 'react'
import { fmtInt } from '@/lib/visibility/admin-rules'

// Courbe faite main (05/10/2026) : aire légère pour la période, pointillés
// pour la période d'avant, repère et bulle au survol. Pas d'axe vertical :
// le maximum est donné dans la légende, les dates aux deux extrémités.

export interface TrendPoint { key: string; label: string; value: number; prev?: number | null }

const W = 1000

export default function TrendChart({ points, unit, unitPlural, height = 200, prevLabel = 'Période d\'avant' }: {
  points: TrendPoint[]
  unit: string
  unitPlural?: string
  height?: number
  prevLabel?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const H = height
  const hasPrev = points.some(p => p.prev !== undefined && p.prev !== null)
  const max = Math.max(1, ...points.map(p => p.value), ...points.map(p => p.prev ?? 0))
  const n = points.length
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W)
  const y = (val: number) => H - 6 - (val / max) * (H - 18)
  const plural = (k: number) => (k > 1 ? unitPlural ?? `${unit}s` : unit)

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = n ? `${line} L${x(n - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z` : ''
  const prevLine = hasPrev ? points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.prev ?? 0).toFixed(1)}`).join(' ') : ''
  const peak = Math.max(0, ...points.map(p => p.value))

  const onMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * (n - 1)))
  }

  const h = hover !== null ? points[hover] : null
  const hx = hover !== null ? (n <= 1 ? 50 : (hover / (n - 1)) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 12.5, color: 'var(--text-3)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 2, borderRadius: 2, background: 'var(--accent-text)' }} /> Cette période
        </span>
        {hasPrev && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 0, borderTop: '2px dashed var(--text-3)' }} /> {prevLabel}
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>Au plus haut : <strong style={{ color: 'var(--text-2)' }}>{fmtInt(peak)} {plural(peak)}</strong></span>
      </div>
      <div
        style={{ position: 'relative', height: H, touchAction: 'pan-y', cursor: 'crosshair' }}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchStart={onMove} onTouchMove={onMove} onTouchEnd={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
          {[0, 0.5, 1].map(f => (
            <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {hasPrev && <path d={prevLine} fill="none" stroke="var(--text-3)" strokeWidth={1.5} strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />}
          <path d={area} fill="color-mix(in srgb, var(--accent-text) 12%, transparent)" />
          <path d={line} fill="none" stroke="var(--accent-text)" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {h && (
          <>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${hx}%`, width: 1, background: 'var(--border-2)', pointerEvents: 'none' }} />
            <div style={{
              position: 'absolute', left: `${hx}%`, top: y(h.value), width: 10, height: 10, borderRadius: '50%', transform: 'translate(-50%,-50%)',
              background: 'var(--accent-text)', border: '2px solid var(--surface)', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 4, left: `${hx}%`, transform: `translateX(${hx > 70 ? '-105%' : '8px'})`, pointerEvents: 'none',
              background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 10, padding: '8px 11px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.10)', fontSize: 12.5, color: 'var(--text-2)', whiteSpace: 'nowrap', zIndex: 2,
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{h.label}</div>
              <div><strong style={{ color: 'var(--text)' }}>{fmtInt(h.value)}</strong> {plural(h.value)}</div>
              {hasPrev && h.prev !== undefined && h.prev !== null && <div style={{ color: 'var(--text-3)' }}>{fmtInt(h.prev)} sur la période d&apos;avant</div>}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
        <span>{points[0]?.label}</span>
        <span>{points[n - 1]?.label}</span>
      </div>
    </div>
  )
}
