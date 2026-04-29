'use client'

import { useState } from 'react'
import { Calculator } from '@phosphor-icons/react'

type CalcTab = 'fiscal' | 'statut' | 'rentabilite' | 'taxe'

export default function SimulateursUI() {
  const [tab, setTab] = useState<CalcTab>('fiscal')

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <span style={s.heroBadge}>
          <Calculator size={13} weight="fill" />
          4 simulateurs gratuits
        </span>
        <h1 style={s.heroTitle}>
          Simulateurs <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
        </h1>
        <p style={s.heroDesc}>
          Estime ton imposition, choisis ton statut, calcule ta rentabilité et la taxe de séjour applicable. Tout en quelques secondes.
        </p>
      </div>

      <div style={s.tabs}>
        <button onClick={() => setTab('fiscal')} style={{ ...s.tab, ...(tab === 'fiscal' ? s.tabActive : {}) }}>Fiscalité LCD</button>
        <button onClick={() => setTab('statut')} style={{ ...s.tab, ...(tab === 'statut' ? s.tabActive : {}) }}>EI vs SASU</button>
        <button onClick={() => setTab('rentabilite')} style={{ ...s.tab, ...(tab === 'rentabilite' ? s.tabActive : {}) }}>Rentabilité</button>
        <button onClick={() => setTab('taxe')} style={{ ...s.tab, ...(tab === 'taxe' ? s.tabActive : {}) }}>Taxe de séjour</button>
      </div>

      <div style={s.body}>
        <div style={s.placeholder}>Chargement du simulateur…</div>
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
    fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 10px',
  },
  heroDesc: {
    fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)',
    maxWidth: '600px', margin: 0,
  },
  tabs: {
    display: 'flex', gap: '6px', padding: '4px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px', fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    border: 'none', borderRadius: '9px', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tabActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
  },
  body: { minHeight: '200px' },
  placeholder: {
    padding: '40px', textAlign: 'center' as const,
    fontSize: '13px', color: 'var(--text-muted)',
  },
}
