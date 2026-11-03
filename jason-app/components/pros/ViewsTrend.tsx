// Carte « Vues de ta fiche ce mois-ci » (espaces pros) : le chiffre qui dit au
// pro si l'annuaire lui apporte de la visibilité. Comparé à la même période du
// mois dernier (03/11/2026 : le 3 du mois, « -85 % » face à un mois entier).
import { Eye, TrendUp, TrendDown } from '@phosphor-icons/react/dist/ssr'
import type { ViewsTrend as Trend } from '@/lib/pros/views'
import { pctChange } from '@/lib/finances/month-compare'

export default function ViewsTrend({ trend, metier, style, compact }: { trend: Trend; metier: string; style?: React.CSSProperties; compact?: boolean }) {
  if (!trend.available) return null
  const max = Math.max(1, ...trend.daily.map(d => d.views))
  const delta = trend.samePeriod ? pctChange(trend.thisMonth, trend.samePeriod.views) : null
  const up = delta != null && delta >= 0
  const h = compact ? 34 : 44
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: compact ? '16px 18px' : '16px 18px', margin: '0 0 18px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ marginBottom: compact ? 12 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '.3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            <Eye size={13} /> Vues ce mois-ci
          </div>
          <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: compact ? 26 : 30, color: 'var(--text)', lineHeight: 1.2, marginTop: 4 }}>{trend.thisMonth}</div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', textAlign: 'right' }}>
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
      {trend.daily.length > 0 && (
        <div aria-label="Vues par jour sur 30 jours" style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 3, alignItems: 'end', height: h, flexShrink: 0, marginTop: compact ? 'auto' : 12, paddingTop: 0, boxSizing: 'content-box' }}>
          {trend.daily.map(d => (
            <div key={d.day} title={`${new Date(d.day + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${d.views} vue${d.views > 1 ? 's' : ''}`}
              style={{ height: `${Math.max(3, (d.views / max) * h)}px`, borderRadius: 3, background: d.views ? 'var(--accent-text)' : 'var(--border)' }} />
          ))}
        </div>
      )}
      {!compact && (
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '10px 0 0', lineHeight: 1.55 }}>
          Chaque visite d’un hôte sur ta fiche {metier} compte une fois par session. Partage ta fiche (réseaux, signature d’email) pour faire monter ce chiffre.
        </p>
      )}
      {compact && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8, flexShrink: 0 }}>30 derniers jours, une barre par jour</div>}
    </div>
  )
}
