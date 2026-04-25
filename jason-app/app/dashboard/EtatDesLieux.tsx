import Link from 'next/link'
import { CalendarBlank, CurrencyEur, Star, Lightning } from '@phosphor-icons/react/dist/ssr'
import NoteMoyenne from './NoteMoyenne'

interface Props {
  prochainSejour: {
    logement_nom: string | null
    date_arrivee: string
    locataire_prenom?: string | null
    locataire_nom?: string | null
  } | null
  revenusThisMois: number
  revenusPrevMois: number
  avisMovyen: number | null
  urgentCount: number
  today: string
}

function diffDays(from: string, to: string) {
  return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
}

function fmtEur(n: number) {
  if (n === 0) return '0 €'
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 < 100 ? 1 : 0).replace('.', ',')} k€`
  return `${n} €`
}

export default function EtatDesLieux({
  prochainSejour, revenusThisMois, revenusPrevMois, avisMovyen, urgentCount, today,
}: Props) {
  // Prochain séjour
  let sejLabel = 'Aucun séjour prévu'
  let sejSub   = 'Pas d\'arrivée planifiée'
  let sejColor = '#60a5fa'
  if (prochainSejour) {
    const days = diffDays(today, prochainSejour.date_arrivee)
    const who  = [prochainSejour.locataire_prenom, prochainSejour.locataire_nom].filter(Boolean).join(' ')
    sejLabel   = days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days} jour${days > 1 ? 's' : ''}`
    sejSub     = [who || null, prochainSejour.logement_nom].filter(Boolean).join(' · ') || 'Logement'
    sejColor   = days <= 1 ? '#10b981' : days <= 3 ? '#eab308' : '#60a5fa'
  }

  // Variation revenus
  const variation = revenusPrevMois > 0
    ? Math.round(((revenusThisMois - revenusPrevMois) / revenusPrevMois) * 100)
    : null
  const varColor  = variation == null ? 'var(--text-muted)' : variation >= 0 ? '#10b981' : '#ef4444'
  const varText   = variation == null ? '' : `${variation >= 0 ? '+' : ''}${variation}% vs mois dernier`

  // Actions urgentes
  const urgColor = urgentCount > 0 ? '#ef4444' : '#10b981'
  const urgLabel = urgentCount > 0
    ? `${urgentCount} à traiter`
    : 'Tout est à jour'
  const urgSub   = urgentCount > 0 ? 'Voir les détails ci-dessous' : 'Aucune urgence'

  return (
    <div style={s.grid}>
      {/* 1 — Prochain séjour */}
      <Link href="/dashboard/calendrier" style={{ textDecoration: 'none' }}>
        <div style={s.card} className="kpi-hover">
          <div style={{ ...s.icon, color: sejColor, background: sejColor + '18', border: `1px solid ${sejColor}30` }}>
            <CalendarBlank size={18} weight="fill" />
          </div>
          <div style={s.body}>
            <span style={s.lbl}>Prochain séjour</span>
            <span style={{ ...s.val, color: sejColor }}>{sejLabel}</span>
            <span style={s.sub} title={sejSub}>{sejSub}</span>
          </div>
        </div>
      </Link>

      {/* 2 — Revenu du mois */}
      <Link href="/dashboard/revenus" style={{ textDecoration: 'none' }}>
        <div style={s.card} className="kpi-hover">
          <div style={{ ...s.icon, color: '#10b981', background: '#10b98118', border: '1px solid #10b98130' }}>
            <CurrencyEur size={18} weight="fill" />
          </div>
          <div style={s.body}>
            <span style={s.lbl}>Revenu du mois</span>
            <span style={{ ...s.val, color: '#10b981' }}>{fmtEur(revenusThisMois)}</span>
            {varText && <span style={{ ...s.sub, color: varColor }}>{varText}</span>}
            {!varText && <span style={s.sub}>encaissés (contrats + manuel)</span>}
          </div>
        </div>
      </Link>

      {/* 3 — Note actuelle */}
      <div style={s.card}>
        <div style={{ ...s.icon, color: '#f59e0b', background: '#f59e0b18', border: '1px solid #f59e0b30' }}>
          <Star size={18} weight="fill" />
        </div>
        <div style={s.body}>
          <span style={s.lbl}>Note actuelle</span>
          <NoteMoyenne initial={avisMovyen} />
          <span style={s.sub}>Airbnb / Booking · cliquer pour modifier</span>
        </div>
      </div>

      {/* 4 — Action urgente */}
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
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    padding: '18px 20px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', transition: 'border-color 0.15s, transform 0.15s',
    height: '100%',
  },
  icon: {
    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: '2px',
  },
  body:  { display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 },
  lbl:   { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.2px' },
  val:   { fontSize: '22px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.5px' },
  sub:   {
    fontSize: '11px', color: 'var(--text-3)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    maxWidth: '160px',
  },
}
