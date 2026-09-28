import Link from 'next/link'
import { Wallet, Target } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import ScopeBar from './ScopeBar'
import { eur } from './ui'
import { totaux } from '@/lib/finances/engine'
import type { FinanceData } from '@/lib/finances/load'

/**
 * Bandeau de « Mes finances » (DA 28/09/2026) : le logement affiché se
 * choisit dans le bandeau (même réglage que le sélecteur de la sidebar) ;
 * à droite, l'année en cours de ce logement.
 */
export default function FinancesHero({ data, choices, activeId }: {
  data: FinanceData | null
  choices: Array<{ id: string; nom: string }>
  activeId: string
}) {
  const scopeName = data?.scope.logement?.nom ?? null
  const multi = choices.length > 1
  const year = data ? Number(data.today.slice(0, 4)) : null
  const yearTot = data && year
    ? totaux(data.lines, data.charges, [], `${year}-01-01`, `${year}-12-31`, data.today)
    : null
  const hasFigures = !!yearTot && (yearTot.revenus > 0 || yearTot.aVenir > 0 || yearTot.charges > 0)
  const objectif = data?.objectif ?? null
  // Réalisé + déjà réservé, comme la carte Objectif (le pourcentage peut dépasser 100 %)
  const ratio = objectif && yearTot ? (yearTot.revenus + yearTot.aVenir) / objectif : 0

  return (
      <div style={{ padding: '20px var(--dash-page-px) 0' }}>
        <HubHero
          eyebrowIcon={<Wallet size={14} weight="fill" />}
          eyebrow="Mes finances"
          title={<>Ce que rapporte <HeroEm>{scopeName ?? (multi ? 'tes logements' : 'ton logement')}</HeroEm></>}
          desc={multi
            ? 'Chaque logement a ses propres chiffres : revenus, commissions, charges, bénéfice et ce que tu déclareras. Choisis celui à afficher.'
            : 'Revenus, commissions, charges, bénéfice et ce que tu déclareras, calculés à partir de tes séjours et de tes contrats.'}
          aside={hasFigures && yearTot && year ? (
            <div style={{ ...heroCard, width: '100%' }}>
              <div style={s.asideTitle}>Depuis le 1er janvier {year}</div>
              <div style={s.asideStats}>
                <div style={s.asideStat}>
                  <span style={s.asideNum}>{eur(yearTot.revenus)}</span>
                  <span style={s.asideLbl}>de revenus</span>
                </div>
                <div style={s.asideStat}>
                  <span style={{ ...s.asideNum, color: yearTot.benefice >= 0 ? 'var(--accent-text)' : 'var(--danger)' }}>{eur(yearTot.benefice)}</span>
                  <span style={s.asideLbl}>de bénéfice</span>
                </div>
              </div>
              {yearTot.aVenir > 0 && (
                <div style={s.asideLine}>+ {eur(yearTot.aVenir)} déjà réservés d&apos;ici décembre</div>
              )}
              {objectif ? (
                <Link href="/dashboard/finances/revenus" style={s.asideObj}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text-2)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Target size={13} weight="duotone" color="var(--accent-text)" /> Objectif {eur(objectif)}
                    </span>
                    <span style={{ color: 'var(--accent-text)', fontWeight: 700 }}>{Math.round(ratio * 100)} %</span>
                  </span>
                  <span style={s.bar}><span style={{ ...s.barFill, width: `${Math.min(1, ratio) * 100}%` }} /></span>
                </Link>
              ) : null}
            </div>
          ) : undefined}
        >
          <ScopeBar choices={choices} activeId={activeId} />
        </HubHero>
      </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  asideTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  asideStats: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 14px' },
  asideStat: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  asideNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: 24, lineHeight: 1.05, fontWeight: 500, color: 'var(--text)' },
  asideLbl: { fontSize: 12, color: 'var(--text-3)', lineHeight: 1.35 },
  asideLine: { fontSize: 12.5, color: 'var(--text-2)' },
  asideObj: { display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' },
  bar: { display: 'block', height: 7, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden' },
  barFill: { display: 'block', height: '100%', borderRadius: 6, background: 'var(--accent-text)' },
}
