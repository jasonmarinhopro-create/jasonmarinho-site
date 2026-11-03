// Carte « Vues de ta fiche ce mois-ci » (espaces pros) : le chiffre qui dit au
// pro si l'annuaire lui apporte de la visibilité. Comparé à la même période du
// mois dernier (03/11/2026 : le 3 du mois, « -85 % » face à un mois entier).
// Graphique refait le 03/11/2026 (Jason : « l'échelle n'est pas très bien
// faite ») : hauteur fixe, graduations avec leurs valeurs, jours du mois en
// cours en plein et ceux d'avant en clair, dates sous l'axe.
import { Eye, TrendUp, TrendDown } from '@phosphor-icons/react/dist/ssr'
import type { ViewsTrend as Trend } from '@/lib/pros/views'
import { pctChange } from '@/lib/finances/month-compare'

/** Haut de l'échelle : un nombre rond juste au-dessus du maximum (1, 2, 4, 5, 10, 20…) */
export function niceMax(max: number): number {
  if (max <= 2) return 2
  if (max <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(max))
  for (const m of [1, 2, 5, 10]) if (m * pow >= max) return m * pow
  return 10 * pow
}

const dayLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export default function ViewsTrend({ trend, metier, style, compact }: { trend: Trend; metier: string; style?: React.CSSProperties; compact?: boolean }) {
  if (!trend.available) return null
  const delta = trend.samePeriod ? pctChange(trend.thisMonth, trend.samePeriod.views) : null
  const up = delta != null && delta >= 0
  const days = trend.daily
  const top = niceMax(Math.max(0, ...days.map(d => d.views)))
  const H = compact ? 96 : 110
  const month = days.length ? days[days.length - 1].day.slice(0, 7) : ''
  const firstOfMonth = days.findIndex(d => d.day.startsWith(month))
  const total30 = days.reduce((n, d) => n + d.views, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', margin: '0 0 18px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '.3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            <Eye size={13} /> Vues ce mois-ci
          </div>
          <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: compact ? 28 : 30, color: 'var(--text)', lineHeight: 1.15, marginTop: 4 }}>{trend.thisMonth}</div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', textAlign: 'right', maxWidth: 220 }}>
          {delta != null && trend.samePeriod ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: up ? 'var(--accent-text)' : '#B7791F', fontWeight: 600 }}>
              {up ? <TrendUp size={14} /> : <TrendDown size={14} />} {up ? '+' : ''}{delta} % {trend.samePeriod.label} ({trend.samePeriod.views})
            </span>
          ) : trend.samePeriod ? (
            <span style={{ color: 'var(--text-3)' }}>Aucune vue à la même période le mois dernier</span>
          ) : (
            <span style={{ color: 'var(--text-3)' }}>Mois dernier : {trend.lastMonth} vue{trend.lastMonth > 1 ? 's' : ''} en tout</span>
          )}
        </div>
      </div>

      {days.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Échelle */}
            <div style={{ position: 'relative', width: 18, height: H, flexShrink: 0, fontSize: 10.5, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }} aria-hidden="true">
              <span style={{ position: 'absolute', right: 0, top: -6 }}>{top}</span>
              <span style={{ position: 'absolute', right: 0, top: H / 2 - 6 }}>{top / 2}</span>
              <span style={{ position: 'absolute', right: 0, bottom: -6 }}>0</span>
            </div>
            {/* Barres */}
            <div style={{ position: 'relative', flex: 1, height: H }} role="img" aria-label={`Vues par jour sur 30 jours : ${total30} en tout`}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, borderTop: '1px dashed var(--border)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: H / 2, borderTop: '1px dashed var(--border)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTop: '1px solid var(--border-2)' }} />
              {firstOfMonth > 0 && (
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(firstOfMonth / days.length) * 100}%`, borderLeft: '1px solid var(--border-2)' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${days.length}, 1fr)`, gap: 3, alignItems: 'end' }}>
                {days.map(d => {
                  const current = d.day.startsWith(month)
                  return (
                    <div
                      key={d.day}
                      title={`${dayLabel(d.day)} : ${d.views} vue${d.views > 1 ? 's' : ''}`}
                      style={{
                        height: d.views ? `${Math.max(6, (d.views / top) * H)}px` : 0,
                        borderRadius: '4px 4px 1px 1px',
                        background: current ? 'var(--accent-text)' : 'color-mix(in srgb, var(--accent-text) 38%, transparent)',
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
          {/* Dates */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 6, paddingLeft: 26, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{dayLabel(days[0].day)}</span>
            {firstOfMonth > 0 && firstOfMonth < days.length - 3 && <span>{dayLabel(days[firstOfMonth].day)}</span>}
            <span>Aujourd’hui</span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 11.5, color: 'var(--text-3)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--accent-text)', display: 'inline-block' }} /> Ce mois-ci</span>
            {firstOfMonth > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'color-mix(in srgb, var(--accent-text) 38%, transparent)', display: 'inline-block' }} /> Avant</span>}
            <span style={{ marginLeft: 'auto' }}>{total30} vue{total30 > 1 ? 's' : ''} sur 30 jours</span>
          </div>
        </div>
      )}

      {!compact && (
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '10px 0 0', lineHeight: 1.55 }}>
          Chaque visite d’un hôte sur ta fiche {metier} compte une fois par session. Partage ta fiche (réseaux, signature d’email) pour faire monter ce chiffre.
        </p>
      )}
    </div>
  )
}
