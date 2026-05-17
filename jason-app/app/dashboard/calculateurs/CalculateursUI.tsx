'use client'

import { useState } from 'react'
import { ChartLineUp, MapPin, Storefront, TrendUp } from '@phosphor-icons/react/dist/ssr'
import { EstimateurRevenus, CalculateurPrix, CompareurMesVilles } from '../simulateurs/SimulateursUI'
import type { LogementPrefill } from './page'

type CalcTab = 'revenus' | 'prix' | 'mesvilles'

interface Props {
  logementsPrefill?: LogementPrefill[]
}

export default function CalculateursUI({ logementsPrefill = [] }: Props) {
  const [tab, setTab] = useState<CalcTab>('revenus')

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
      ` }} />
      <div className="calc-root">
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

        <div style={s.tabs}>
          <button onClick={() => setTab('revenus')} style={{ ...s.tab, ...(tab === 'revenus' ? s.tabActive : {}) }}>
            <TrendUp size={14} weight="fill" /> Revenus
          </button>
          <button onClick={() => setTab('prix')} style={{ ...s.tab, ...(tab === 'prix' ? s.tabActive : {}) }}>
            <Storefront size={14} weight="fill" /> Prix par nuit
          </button>
          <button onClick={() => setTab('mesvilles')} style={{ ...s.tab, ...(tab === 'mesvilles' ? s.tabActive : {}) }}>
            <MapPin size={14} weight="fill" /> Mes villes
          </button>
        </div>

        <div style={s.body}>
          {tab === 'revenus' && <EstimateurRevenus logements={logementsPrefill} />}
          {tab === 'prix' && <CalculateurPrix logements={logementsPrefill} />}
          {tab === 'mesvilles' && <CompareurMesVilles logements={logementsPrefill} />}
        </div>
      </div>
    </div>
  )
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

  tabs: {
    display: 'flex', gap: '6px', flexWrap: 'wrap',
    padding: '8px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    marginBottom: '28px',
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '10px 18px', borderRadius: '10px',
    background: 'transparent', border: 'none',
    color: 'var(--text-2)', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all .18s cubic-bezier(.16,1,.3,1)',
  },
  tabActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    fontWeight: 700, boxShadow: '0 2px 8px rgba(255,213,107,0.12)',
  },
  body: { width: '100%' },
}
