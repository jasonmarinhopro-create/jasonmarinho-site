import Link from 'next/link'
import { TrendUp, CurrencyEur, UsersThree, Lightning } from '@phosphor-icons/react/dist/ssr'

interface Props {
  revenuPrevisionnel: number
  revenusThisMois: number
  revenusPrevMois: number
  totalReach: number
  joinedCount: number
  totalGroupCount: number
  urgentCount: number
}

function fmtEur(n: number) {
  if (n === 0) return '0 €'
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 < 100 ? 1 : 0).replace('.', ',')} k€`
  return `${n} €`
}

function fmtReach(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
  if (n >= 1_000)     return `${Math.round(n / 1_000)} k`
  return String(n)
}

export default function EtatDesLieux({
  revenuPrevisionnel, revenusThisMois, revenusPrevMois,
  totalReach, joinedCount, totalGroupCount, urgentCount,
}: Props) {
  // Revenu prévisionnel : forward-looking, complète "Revenu du mois"
  const previsColor = revenuPrevisionnel > 0 ? 'var(--success-1)' : 'var(--text-muted)'
  const previsLabel = revenuPrevisionnel > 0
    ? fmtEur(revenuPrevisionnel)
    : '0 €'
  const previsSub = revenuPrevisionnel > 0
    ? 'des réservations à venir'
    : 'Aucune résa confirmée à venir'

  // Variation revenus
  const variation = revenusPrevMois > 0
    ? Math.round(((revenusThisMois - revenusPrevMois) / revenusPrevMois) * 100)
    : null
  const varColor  = variation == null ? 'var(--text-muted)' : variation >= 0 ? 'var(--success-1)' : 'var(--danger)'
  const varText   = variation == null ? '' : `${variation >= 0 ? '+' : ''}${variation}% vs mois dernier`

  // Actions urgentes
  const urgColor = urgentCount > 0 ? 'var(--danger)' : 'var(--success-1)'
  const urgLabel = urgentCount > 0
    ? `${urgentCount} à traiter`
    : 'Tout est à jour'
  const urgSub   = urgentCount > 0 ? 'Voir les détails ci-dessous' : 'Aucune urgence'

  return (
    <div style={s.grid}>
      {/* 1, Revenu prévisionnel — résas à venir avec montant connu */}
      <Link href="/dashboard/revenus" style={{ textDecoration: 'none' }}>
        <div style={s.card} className="kpi-hover">
          <div style={{ ...s.icon, color: previsColor, background: previsColor + '18', border: `1px solid ${previsColor}30` }}>
            <TrendUp size={18} weight="fill" />
          </div>
          <div style={s.body}>
            <span style={s.lbl}>Revenu prévisionnel</span>
            <span style={{ ...s.val, color: previsColor }}>{previsLabel}</span>
            <span style={s.sub} title={previsSub}>{previsSub}</span>
          </div>
        </div>
      </Link>

      {/* 2, Revenu du mois */}
      <Link href="/dashboard/revenus" style={{ textDecoration: 'none' }}>
        <div style={s.card} className="kpi-hover">
          <div style={{ ...s.icon, color: 'var(--success-1)', background: '#10b98118', border: '1px solid #10b98130' }}>
            <CurrencyEur size={18} weight="fill" />
          </div>
          <div style={s.body}>
            <span style={s.lbl}>Revenu du mois</span>
            <span style={{ ...s.val, color: 'var(--success-1)' }}>{fmtEur(revenusThisMois)}</span>
            {varText && <span style={{ ...s.sub, color: varColor }}>{varText}</span>}
            {!varText && <span style={s.sub}>encaissés (contrats + manuel)</span>}
          </div>
        </div>
      </Link>

      {/* 3, Communauté LCD */}
      <Link href="/dashboard/communaute" style={{ textDecoration: 'none' }}>
        <div style={s.card} className="kpi-hover">
          <div style={{ ...s.icon, color: '#a78bfa', background: '#a78bfa18', border: '1px solid #a78bfa30' }}>
            <UsersThree size={18} weight="fill" />
          </div>
          <div style={s.body}>
            <span style={s.lbl}>Communauté LCD</span>
            <span style={{ ...s.val, color: '#a78bfa' }}>
              {totalReach > 0 ? fmtReach(totalReach) : '-'}
            </span>
            <span style={s.sub}>
              {joinedCount > 0
                ? `${joinedCount} groupe${joinedCount > 1 ? 's' : ''} rejoints sur ${totalGroupCount}`
                : `Rejoins des groupes pour voir ta portée`}
            </span>
          </div>
        </div>
      </Link>

      {/* 4, Action urgente */}
      <div style={{ ...s.card, cursor: urgentCount > 0 ? 'pointer' : 'default' }}>
        <div style={{ ...s.icon, color: urgColor, background: urgColor + '18', border: `1px solid ${urgColor}30` }}>
          <Lightning size={18} weight="fill" />
        </div>
        <div style={s.body}>
          <span style={s.lbl}>Action urgente</span>
          <span style={{ ...s.val, color: urgColor }}>{urgLabel}</span>
          <span style={s.sub}>{urgSub}</span>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  card: {
    display: 'flex', alignItems: 'flex-start', gap: 'var(--s-4)',
    padding: 'var(--s-5) var(--s-5)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    transition: 'border-color var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth)',
    height: '100%',
  },
  icon: {
    width: '42px', height: '42px', borderRadius: 'var(--r-md)', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: '2px',
    transition: 'transform var(--d-base) var(--ease-spring)',
  },
  body:  { display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-1)', minWidth: 0 },
  lbl:   {
    fontSize: 'var(--t-xs)', color: 'var(--text-muted)',
    fontWeight: 600, letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  val:   {
    fontSize: 'var(--t-2xl)', fontWeight: 700,
    lineHeight: 'var(--lh-tight)', letterSpacing: 'var(--ls-tight)',
    fontFamily: 'var(--font-fraunces), serif',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  sub:   {
    fontSize: 'var(--t-xs)', color: 'var(--text-3)',
    overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
    maxWidth: '160px',
  },
}
