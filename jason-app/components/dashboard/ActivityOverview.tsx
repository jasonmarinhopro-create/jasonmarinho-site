'use client'

import type { AccountStats, Insight } from '@/lib/lcd/account-stats'
import { fmtEur } from '@/lib/lcd/account-stats'
import { CurrencyEur, House, TrendUp, Scales, Lightning, ArrowRight, Briefcase } from '@phosphor-icons/react/dist/ssr'

export function ActivityOverview({ stats }: { stats: AccountStats }) {
  const hasActivity = stats.caTotal12m > 0
  const villeLabel = stats.villes.length === 0
    ? 'Aucune ville'
    : stats.villes.length === 1
      ? stats.villes[0]
      : `${stats.villes.length} villes`

  return (
    <div style={ao.wrap} data-tour="activity-overview">
      <div style={ao.greet}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={ao.greetH}>
            Bonjour <em style={ao.greetEm}>{stats.firstName}</em>
          </div>
          <div style={ao.greetSub}>
            {hasActivity
              ? `Voici tes chiffres réels sur 12 mois glissants — ils alimentent automatiquement les simulateurs ci-dessous.`
              : `Ajoute tes premiers séjours pour personnaliser les simulations avec tes vrais chiffres.`}
          </div>
        </div>
        {stats.plan === 'driing' && (
          <span style={ao.planTag}>
            <Lightning size={11} weight="fill" /> Membre Driing
          </span>
        )}
        {stats.plan === 'standard' && (
          <span style={ao.planTagStandard}>
            Membre Standard
          </span>
        )}
      </div>

      <div style={ao.grid}>
        <StatTile
          label="CA 12 mois"
          value={hasActivity ? fmtEur(stats.caTotal12m) : '—'}
          sub={hasActivity ? `${stats.nuitsTotales12m} nuits vendues` : 'Pas encore de séjours'}
          icon={<CurrencyEur size={14} weight="fill" />}
          insight={stats.insights.ca}
          accent
        />
        <StatTile
          label="Logements"
          value={`${stats.nbLogements}`}
          sub={stats.nbLogements > 0
            ? `${stats.nbLogementsActifs} actif${stats.nbLogementsActifs > 1 ? 's' : ''} · ${villeLabel}`
            : 'Aucun configuré'}
          icon={<House size={14} weight="fill" />}
          insight={stats.insights.logements}
        />
        <StatTile
          label="ADR moyen"
          value={hasActivity ? fmtEur(stats.adrMoyen) : '—'}
          sub={hasActivity ? `${stats.occupationMoyenne} % occupation` : 'À calculer'}
          icon={<TrendUp size={14} weight="fill" />}
          insight={stats.insights.adr}
        />
        <StatTile
          label="Régime fiscal"
          value={stats.regimeLabel}
          sub={stats.regimeHint}
          icon={<Scales size={14} weight="fill" />}
          insight={stats.insights.regime}
          highlight={stats.regimeEstime !== 'aucun'}
        />
        <StatTile
          label="Statut locatif"
          value={stats.statutLocatif === 'a-configurer' ? '—' : stats.statutLocatifLabel}
          sub={stats.statutLocatifDetails}
          icon={<Briefcase size={14} weight="fill" />}
          insight={stats.insights.statut}
          highlight={stats.statutLocatif === 'lmnp' || stats.statutLocatif === 'lmp'}
        />
      </div>
    </div>
  )
}

function StatTile({
  label, value, sub, icon, accent, highlight, insight,
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  accent?: boolean
  highlight?: boolean
  insight?: Insight | null
}) {
  return (
    <div style={{
      ...st.wrap,
      ...(accent ? st.wrapAccent : {}),
      ...(highlight && !accent ? st.wrapHighlight : {}),
    }}>
      <div style={st.head}>
        <span style={st.label}>{label}</span>
        <span style={{ ...st.icon, ...(accent ? { color: 'var(--accent-text)', opacity: 0.85 } : {}) }}>{icon}</span>
      </div>
      <div style={{ ...st.value, ...(accent ? st.valueAccent : {}) }}>{value}</div>
      {sub && <div style={st.sub}>{sub}</div>}
      {insight && (
        <div style={{ ...st.insight, ...(insight.tone === 'warning' ? st.insightWarning : insight.tone === 'opportunity' ? st.insightOpportunity : {}) }}>
          <div style={st.insightMsg}>{insight.message}</div>
          <a href={insight.ctaHref} style={{ ...st.insightCta, ...(insight.tone === 'warning' ? st.insightCtaWarning : {}) }}>
            {insight.ctaLabel}
            <ArrowRight size={11} weight="bold" />
          </a>
        </div>
      )}
    </div>
  )
}

const ao: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(20px, 3vw, 28px)',
    background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255,213,107,0.03) 100%)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    marginBottom: 'clamp(22px, 3vw, 30px)',
  },
  greet: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '14px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  greetH: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(20px, 2.4vw, 26px)',
    fontWeight: 400,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  greetEm: {
    color: 'var(--accent-text)',
    fontStyle: 'italic',
    fontWeight: 300,
  },
  greetSub: {
    fontSize: '13.5px',
    color: 'var(--text-2)',
    marginTop: '6px',
    lineHeight: 1.6,
    maxWidth: '640px',
  },
  planTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    borderRadius: '999px',
    background: 'rgba(255,213,107,0.12)',
    color: 'var(--accent-text)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    border: '1px solid rgba(255,213,107,0.22)',
    flexShrink: 0,
  },
  planTagStandard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    borderRadius: '999px',
    background: 'rgba(99,214,131,0.10)',
    color: '#5DC077',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    border: '1px solid rgba(99,214,131,0.22)',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 'clamp(10px, 1.4vw, 14px)',
  },
}

const st: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '16px 18px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'transform .2s cubic-bezier(.4,0,.2,1), border-color .2s',
  },
  wrapAccent: {
    background: 'linear-gradient(135deg, rgba(255,213,107,0.07) 0%, var(--bg-2) 100%)',
    borderColor: 'rgba(255,213,107,0.22)',
  },
  wrapHighlight: {
    borderColor: 'rgba(99,214,131,0.26)',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  icon: {
    color: 'var(--text-muted)',
    opacity: 0.65,
    display: 'inline-flex',
  },
  value: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(20px, 2.4vw, 24px)',
    fontWeight: 500,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
    marginTop: '4px',
  },
  valueAccent: {
    color: 'var(--accent-text)',
  },
  sub: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  // Insight tile sub-section
  insight: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px dashed var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  insightOpportunity: {
    borderTopColor: 'rgba(99,214,131,0.22)',
  },
  insightWarning: {
    borderTopColor: 'rgba(251,146,60,0.32)',
  },
  insightMsg: {
    fontSize: '12px',
    color: 'var(--text-2)',
    lineHeight: 1.5,
  },
  insightCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--accent-text)',
    textDecoration: 'none',
    alignSelf: 'flex-start',
    padding: '4px 0',
    transition: 'gap .15s',
  },
  insightCtaWarning: {
    color: '#fb923c',
  },
}

