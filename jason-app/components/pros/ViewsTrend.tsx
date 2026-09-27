// Carte « Vues de ta fiche ce mois-ci » (espace photographe / équipe ménage) :
// le chiffre qui dit au pro si l'annuaire lui apporte de la visibilité.
import { Eye, TrendUp, TrendDown } from '@phosphor-icons/react/dist/ssr'
import type { ViewsTrend as Trend } from '@/lib/pros/views'

export default function ViewsTrend({ trend, metier }: { trend: Trend; metier: string }) {
  if (!trend.available) return null
  const max = Math.max(1, ...trend.daily.map(d => d.views))
  const delta = trend.lastMonth > 0 ? Math.round(((trend.thisMonth - trend.lastMonth) / trend.lastMonth) * 100) : null
  const up = delta != null && delta >= 0
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', margin: '0 0 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '.3px', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            <Eye size={13} /> Vues de ta fiche ce mois-ci
          </div>
          <div style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: 30, color: 'var(--text)', lineHeight: 1.2, marginTop: 4 }}>{trend.thisMonth}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {delta != null ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: up ? 'var(--success-text)' : 'var(--warning-text)', fontWeight: 600 }}>
              {up ? <TrendUp size={14} /> : <TrendDown size={14} />} {up ? '+' : ''}{delta} % vs le mois dernier ({trend.lastMonth})
            </span>
          ) : (
            <span>Premier mois de mesure</span>
          )}
        </div>
      </div>
      {trend.daily.length > 0 && (
        <div aria-label="Vues par jour sur 30 jours" style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 3, alignItems: 'end', height: 44, marginTop: 12 }}>
          {trend.daily.map(d => (
            <div key={d.day} title={`${new Date(d.day + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${d.views} vue${d.views > 1 ? 's' : ''}`}
              style={{ height: `${Math.max(3, (d.views / max) * 44)}px`, borderRadius: 3, background: d.views ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>
      )}
      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '10px 0 0', lineHeight: 1.55 }}>
        Chaque visite d’un hôte sur ta fiche {metier} compte une fois par session. Partage ta fiche (réseaux, signature d’email) pour faire monter ce chiffre.
      </p>
    </div>
  )
}
