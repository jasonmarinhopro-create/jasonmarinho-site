'use client'

// Simulateurs investisseur (détaché) : rentabilité nette + fiscalité LMNP.
// Réutilise les composants de la partie hôte (Rentabilite, FiscalLCD) sans
// préfilage de données réelles — l'investisseur teste un scénario d'achat.

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChartLineUp, Receipt } from '@phosphor-icons/react/dist/ssr'

const Rentabilite = dynamic(() => import('@/components/simulateurs/Rentabilite'), { ssr: false })
const FiscalLCD = dynamic(() => import('@/components/simulateurs/FiscalLCD'), { ssr: false })

type Tab = 'rentabilite' | 'fiscal'

export default function InvestirSimulateurs() {
  const [tab, setTab] = useState<Tab>('rentabilite')
  return (
    <div className="sim-root">
      <div style={s.head}>
        <h1 style={s.title}>Rentabilité &amp; <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>fiscalité</em></h1>
        <p style={s.desc}>
          Projette la rentabilité nette d&apos;un bien que tu envisages d&apos;acheter et estime ton imposition
          (LMNP micro-BIC / réel). Teste plusieurs scénarios avant de te décider.
        </p>
      </div>

      <div style={s.tabs} role="tablist" aria-label="Simulateurs investisseur">
        <button onClick={() => setTab('rentabilite')} role="tab" aria-selected={tab === 'rentabilite'}
          style={{ ...s.tab, ...(tab === 'rentabilite' ? s.tabActive : {}) }}>
          <ChartLineUp size={15} weight="fill" /> Rentabilité nette
        </button>
        <button onClick={() => setTab('fiscal')} role="tab" aria-selected={tab === 'fiscal'}
          style={{ ...s.tab, ...(tab === 'fiscal' ? s.tabActive : {}) }}>
          <Receipt size={15} weight="fill" /> Fiscalité LMNP
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        {tab === 'rentabilite' && <Rentabilite />}
        {tab === 'fiscal' && <FiscalLCD />}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  head: { marginBottom: 18 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(20px, 2.6vw, 26px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.01em' },
  desc: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55, margin: 0, maxWidth: 640 },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
    fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  tabActive: { background: 'var(--accent-bg)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)' },
}
