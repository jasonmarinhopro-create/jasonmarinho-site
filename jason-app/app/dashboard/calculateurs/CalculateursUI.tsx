'use client'

import { useState, useEffect } from 'react'
import { Calculator, ChartLineUp, MapPin, Storefront, TrendUp } from '@phosphor-icons/react/dist/ssr'
import { EstimateurRevenus, CalculateurPrix, CompareurMesVilles } from '../simulateurs/SimulateursUI'
import { ActivityOverview } from '@/components/dashboard/ActivityOverview'
import type { AccountStats } from '@/lib/lcd/account-stats'
import type { LogementPrefill } from './page'

type CalcTab = 'revenus' | 'prix' | 'mesvilles'
const CALC_TABS: CalcTab[] = ['revenus', 'prix', 'mesvilles']

interface Props {
  logementsPrefill?: LogementPrefill[]
  accountStats?: AccountStats
}

export default function CalculateursUI({ logementsPrefill = [], accountStats }: Props) {
  const [tab, setTab] = useState<CalcTab>('revenus')

  useEffect(() => {
    const fromHash = () => {
      const h = (typeof window !== 'undefined' ? window.location.hash.slice(1) : '') as CalcTab
      if (CALC_TABS.includes(h)) setTab(h)
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const selectTab = (t: CalcTab) => {
    setTab(t)
    if (typeof window !== 'undefined') history.replaceState(null, '', `#${t}`)
  }

  return (
    <div style={s.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Selects en vert Jason quand ouverts */
        .calc-root select option { background-color: var(--bg-2); color: var(--text); padding: 8px 12px; font-weight: 500; }
        .calc-root select option:hover { background-color: var(--accent-bg); }
        .calc-root select option:checked { background: var(--accent-text); color: var(--bg); font-weight: 700; }
        /* Checkbox custom élégante (réutilise classe globale jm-check) */
        .jm-check { display: flex !important; align-items: center; gap: 10px; cursor: pointer; padding: 12px 14px !important; border-radius: 10px; background: linear-gradient(135deg, rgba(0,76,63,.05) 0%, rgba(255,213,107,.06) 100%); border: 1px solid var(--accent-border); transition: all .2s cubic-bezier(.4,0,.2,1); margin-top: 4px !important; }
        .jm-check:hover { border-color: var(--accent-text); background: linear-gradient(135deg, rgba(0,76,63,.10) 0%, rgba(255,213,107,.12) 100%); }
        .jm-check input[type="checkbox"] { appearance: none; -webkit-appearance: none; width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--accent-border); background: var(--bg); cursor: pointer; flex-shrink: 0; position: relative; transition: all .15s; margin: 0; }
        .jm-check input[type="checkbox"]:hover { border-color: var(--accent-text); }
        .jm-check input[type="checkbox"]:checked { background: var(--accent-text); border-color: var(--accent-text); }
        .jm-check input[type="checkbox"]:checked::after { content: ''; position: absolute; top: 3px; left: 6px; width: 5px; height: 9px; border: solid var(--bg); border-width: 0 2px 2px 0; transform: rotate(45deg); }
        .jm-check span { font-size: 13.5px; color: var(--text); font-weight: 500; line-height: 1.4; }
        .jm-check span strong { color: var(--accent-text); }
        .calc-root [role="tab"]:hover { color: var(--text); background: rgba(255,255,255,.03); }
        .calc-root [role="tab"][aria-selected="true"] { background: var(--accent-bg); color: var(--accent-text); font-weight: 700; box-shadow: 0 2px 8px rgba(255,213,107,0.12); }
      ` }} />
      <div className="calc-root">

        <PageSwitcher current="marche" />

        <div style={s.hero}>
          <span style={s.heroBadge}>
            <TrendUp size={13} weight="fill" />
            3 calculateurs marché
          </span>
          <h1 style={s.heroTitle}>
            Calculateurs <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>marché</em>
          </h1>
          <p style={s.heroDesc}>
            Estime tes revenus, trouve le bon prix, compare tes villes. Préfilé avec tes vrais logements, comparé au marché européen (83 villes sourcées).
          </p>
        </div>

        {accountStats && <ActivityOverview stats={accountStats} />}

        {logementsPrefill.length === 0 && (
          <div style={s.emptyState}>
            <MapPin size={28} weight="duotone" style={{ color: 'var(--accent-text)', opacity: 0.85, marginBottom: '8px' }} />
            <div style={s.emptyTitle}>Préfilage indisponible</div>
            <div style={s.emptyDesc}>Ajoute au moins un logement pour comparer ton activité réelle au marché européen. Tu peux quand même tester les outils sans préfilage.</div>
            <a href="/dashboard/logements" style={s.emptyCta}>Ajouter mon premier logement →</a>
          </div>
        )}

        <div style={s.tabs} role="tablist" aria-label="Calculateurs marché">
          <button onClick={() => selectTab('revenus')} role="tab" aria-selected={tab === 'revenus'} style={s.tab}>
            <TrendUp size={15} weight="fill" /> Revenus
          </button>
          <button onClick={() => selectTab('prix')} role="tab" aria-selected={tab === 'prix'} style={s.tab}>
            <Storefront size={15} weight="fill" /> Prix par nuit
          </button>
          <button onClick={() => selectTab('mesvilles')} role="tab" aria-selected={tab === 'mesvilles'} style={s.tab}>
            <MapPin size={15} weight="fill" /> Mes villes
          </button>
        </div>

        <div style={s.bodyCard} role="tabpanel">
          {tab === 'revenus' && <EstimateurRevenus logements={logementsPrefill} />}
          {tab === 'prix' && <CalculateurPrix logements={logementsPrefill} />}
          {tab === 'mesvilles' && <CompareurMesVilles logements={logementsPrefill} />}
        </div>
      </div>
    </div>
  )
}

function PageSwitcher({ current }: { current: 'fiscal' | 'marche' }) {
  const isFiscal = current === 'fiscal'
  return (
    <div style={ps.wrap} role="navigation" aria-label="Choix de la suite d'outils">
      <a href="/dashboard/simulateurs" style={isFiscal ? { ...ps.btn, ...ps.btnActive } : ps.btn} aria-current={isFiscal ? 'page' : undefined}>
        <Calculator size={13} weight="fill" /> Simulateurs fiscaux
      </a>
      <a href="/dashboard/calculateurs" style={!isFiscal ? { ...ps.btn, ...ps.btnActive } : ps.btn} aria-current={!isFiscal ? 'page' : undefined}>
        <ChartLineUp size={13} weight="fill" /> Calculateurs marché
      </a>
    </div>
  )
}

const ps: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'inline-flex', gap: '4px', padding: '4px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', marginBottom: 'clamp(18px, 2.5vw, 26px)',
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 12px', borderRadius: '7px',
    fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    textDecoration: 'none',
    transition: 'all .18s cubic-bezier(.4,0,.2,1)',
  },
  btnActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    fontWeight: 700,
  },
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%' },
  hero: { marginBottom: 'clamp(20px, 3vw, 32px)' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'var(--accent-text)', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  heroDesc: {
    fontSize: '14.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.65, margin: 0, maxWidth: '640px',
  },

  emptyState: {
    padding: 'clamp(20px, 3vw, 28px)',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.05) 0%, rgba(0,76,63,0.03) 100%)',
    border: '1px solid var(--accent-border)',
    borderRadius: '14px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
  },
  emptyTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500,
    color: 'var(--text)', letterSpacing: '-0.01em',
  },
  emptyDesc: {
    fontSize: '13.5px', color: 'var(--text-2)',
    lineHeight: 1.55, maxWidth: '560px', marginBottom: '8px',
  },
  emptyCta: {
    fontSize: '13px', fontWeight: 600,
    color: 'var(--accent-text)', textDecoration: 'none',
    padding: '8px 14px', borderRadius: '8px',
    background: 'rgba(255,213,107,0.10)',
    border: '1px solid rgba(255,213,107,0.22)',
    transition: 'all .2s',
  },

  tabs: {
    display: 'flex', gap: '8px', flexWrap: 'wrap',
    padding: '6px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    marginBottom: 'clamp(18px, 2.5vw, 24px)',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '11px 18px', borderRadius: '10px',
    background: 'transparent', border: 'none',
    color: 'var(--text-2)', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all .18s cubic-bezier(.16,1,.3,1)',
  },
  body: { width: '100%' },
  bodyCard: {
    width: '100%',
    padding: 'clamp(18px, 2.6vw, 28px)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: '0 1px 0 rgba(255,255,255,.02) inset',
  },
}
