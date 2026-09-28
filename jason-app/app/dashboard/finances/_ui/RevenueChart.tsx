'use client'

// Revenus mois par mois : barres pleines = revenus (séjours arrivés), barres
// hachurées = déjà réservé. Survol ou toucher d'un mois : le détail.
import { useState } from 'react'
import type { MoisPoint } from '@/lib/finances/engine'
import { monthLabel } from '@/lib/finances/engine'
import { COLORS, eur } from './ui'

export default function RevenueChart({ points, currentMonth }: { points: MoisPoint[]; currentMonth: string }) {
  const [sel, setSel] = useState<string | null>(null)
  const max = Math.max(1, ...points.map(p => p.revenus + p.aVenir))
  const focus = points.find(p => p.mois === sel) ?? points.find(p => p.mois === currentMonth) ?? points[points.length - 1]

  return (
    <div>
      <div style={s.chart} onMouseLeave={() => setSel(null)}>
        {points.map(p => {
          const h1 = (p.revenus / max) * 100
          const h2 = (p.aVenir / max) * 100
          const active = focus?.mois === p.mois
          return (
            <button
              key={p.mois}
              type="button"
              onMouseEnter={() => setSel(p.mois)}
              onFocus={() => setSel(p.mois)}
              onClick={() => setSel(p.mois)}
              aria-label={`${monthLabel(p.mois)} : ${eur(p.revenus)} de revenus${p.aVenir > 0 ? `, ${eur(p.aVenir)} déjà réservés` : ''}`}
              style={s.col}
            >
              <div style={s.barZone}>
                {h2 > 0 && <div style={{ ...s.barFuture, height: `${h2}%` }} />}
                {h1 > 0 && <div style={{ ...s.bar, height: `${h1}%`, opacity: active ? 1 : 0.78 }} />}
              </div>
              <span style={{ ...s.lbl, color: active ? 'var(--text)' : 'var(--text-3)', fontWeight: active ? 700 : 500 }}>
                {monthLabel(p.mois, true)}
              </span>
            </button>
          )
        })}
      </div>

      {focus && (
        <div style={s.detail} aria-live="polite">
          <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{monthLabel(focus.mois)}</strong>
          <span>Revenus <b style={{ color: COLORS.revenus }}>{eur(focus.revenus)}</b></span>
          {focus.commissions > 0 && <span>Commissions <b style={{ color: COLORS.commissions }}>− {eur(focus.commissions)}</b></span>}
          {focus.charges > 0 && <span>Charges <b style={{ color: COLORS.charges }}>− {eur(focus.charges)}</b></span>}
          <span>Bénéfice <b style={{ color: 'var(--text)' }}>{eur(focus.benefice)}</b></span>
          {focus.aVenir > 0 && <span>Déjà réservé <b style={{ color: COLORS.revenus }}>{eur(focus.aVenir)}</b></span>}
        </div>
      )}

      <div style={s.legend}>
        <span><i style={{ ...s.dot, background: COLORS.revenus }} />Revenus</span>
        <span><i style={{ ...s.dot, ...s.hatch }} />Déjà réservé</span>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  chart: { display: 'flex', alignItems: 'flex-end', gap: 'clamp(3px, 1vw, 10px)', height: 190, paddingTop: 8 },
  col: { flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' },
  barZone: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  bar: { background: 'var(--accent-text)', borderRadius: '6px 6px 2px 2px', minHeight: 2, transition: 'opacity 0.15s' },
  barFuture: {
    borderRadius: '6px 6px 0 0', minHeight: 2,
    background: 'repeating-linear-gradient(45deg, rgba(47,158,91,0.45) 0, rgba(47,158,91,0.45) 4px, rgba(47,158,91,0.15) 4px, rgba(47,158,91,0.15) 8px)',
  },
  lbl: { fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' },
  detail: { display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 14, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-2)', fontSize: 13, color: 'var(--text-2)' },
  legend: { display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--text-3)' },
  dot: { display: 'inline-block', width: 10, height: 10, borderRadius: 3, marginRight: 6, verticalAlign: '-1px' },
  hatch: { background: 'repeating-linear-gradient(45deg, rgba(47,158,91,0.55) 0, rgba(47,158,91,0.55) 2px, rgba(47,158,91,0.15) 2px, rgba(47,158,91,0.15) 4px)' },
}
