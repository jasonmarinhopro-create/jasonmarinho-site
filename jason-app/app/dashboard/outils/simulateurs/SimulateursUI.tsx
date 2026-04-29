'use client'

import { useState, useMemo } from 'react'
import { Calculator, Scales, CurrencyEur, Info, House, MapPin, ChartLineUp } from '@phosphor-icons/react'

type CalcTab = 'fiscal' | 'statut' | 'rentabilite' | 'taxe'

function fmtEur(n: number, decimals: number = 0): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals }) + ' €'
}

function fmtPct(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %'
}

/* ──────────────────────────────────────────
 * 1. FISCALITÉ LCD (micro-BIC)
 * ────────────────────────────────────────── */

function FiscalLCD() {
  const [ca, setCa] = useState(30000)
  const [classe, setClasse] = useState(false)

  const result = useMemo(() => {
    const plafond = classe ? 77700 : 15000
    const tauxAbattement = classe ? 0.71 : 0.30
    const sousPlafond = ca <= plafond
    const baseImposable = sousPlafond ? ca * (1 - tauxAbattement) : ca
    const economieClassement = ca * (0.71 - 0.30)
    return { plafond, tauxAbattement, sousPlafond, baseImposable, economieClassement }
  }, [ca, classe])

  return (
    <div style={s.calc}>
      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Chiffre d&apos;affaires annuel</label>
          <div style={s.inputWrap}>
            <input type="number" value={ca} onChange={e => setCa(Math.max(0, Number(e.target.value)))}
              style={s.input} min={0} step={1000} />
            <span style={s.suffix}>€</span>
          </div>
          <input type="range" value={ca} onChange={e => setCa(Number(e.target.value))}
            min={0} max={100000} step={1000} style={s.range} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Logement classé Atout France ?</label>
          <div style={s.toggleRow}>
            <button onClick={() => setClasse(false)} style={{ ...s.toggleBtn, ...(classe ? {} : s.toggleActive) }}>Non classé</button>
            <button onClick={() => setClasse(true)} style={{ ...s.toggleBtn, ...(classe ? s.toggleActive : {}) }}>Classé 1–5★</button>
          </div>
          <div style={s.helper}>Abattement {result.tauxAbattement * 100} % · plafond {fmtEur(result.plafond)}</div>
        </div>
      </div>

      <div style={s.results}>
        {result.sousPlafond ? (
          <>
            <div style={s.resultBox}>
              <div style={s.resultLabel}>Base imposable (micro-BIC)</div>
              <div style={s.resultValue}>{fmtEur(result.baseImposable)}</div>
              <div style={s.resultHint}>{fmtEur(ca)} − abattement {result.tauxAbattement * 100} %</div>
            </div>
            <div style={s.resultBox}>
              <div style={s.resultLabel}>Tu peux rester au micro</div>
              <div style={{ ...s.resultValue, color: '#10b981' }}>OK</div>
              <div style={s.resultHint}>Sous le plafond {fmtEur(result.plafond)}</div>
            </div>
          </>
        ) : (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={s.resultLabel}>Plafond dépassé</div>
            <div style={{ ...s.resultValue, color: '#ef4444' }}>Régime réel</div>
            <div style={s.resultHint}>Tu dépasses le plafond {fmtEur(result.plafond)} → bascule au réel obligatoire l&apos;année suivante</div>
          </div>
        )}
        {!classe && ca > 0 && (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
            <div style={s.resultLabel}>Si tu te fais classer Atout France</div>
            <div style={{ ...s.resultValue, color: '#10b981', fontSize: '20px' }}>− {fmtEur(result.economieClassement)} de base imposable</div>
            <div style={s.resultHint}>Économie estimée d&apos;impôt : ~{fmtEur(result.economieClassement * 0.30)} (à TMI 30 %)</div>
          </div>
        )}
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" />
        Estimation pédagogique. Le régime <strong>réel simplifié</strong> peut être plus avantageux au-delà de 30 k€/an si tu as des charges (amortissement, intérêts, travaux). Consulte un expert-comptable.
      </div>
    </div>
  )
}

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
        <button onClick={() => setTab('fiscal')} style={{ ...s.tab, ...(tab === 'fiscal' ? s.tabActive : {}) }}>
          <CurrencyEur size={14} weight="fill" /> Fiscalité LCD
        </button>
        <button onClick={() => setTab('statut')} style={{ ...s.tab, ...(tab === 'statut' ? s.tabActive : {}) }}>
          <Scales size={14} weight="fill" /> EI vs SASU
        </button>
        <button onClick={() => setTab('rentabilite')} style={{ ...s.tab, ...(tab === 'rentabilite' ? s.tabActive : {}) }}>
          <ChartLineUp size={14} weight="fill" /> Rentabilité
        </button>
        <button onClick={() => setTab('taxe')} style={{ ...s.tab, ...(tab === 'taxe' ? s.tabActive : {}) }}>
          <MapPin size={14} weight="fill" /> Taxe de séjour
        </button>
      </div>

      <div style={s.body}>
        {tab === 'fiscal' && <FiscalLCD />}
        {tab === 'statut' && <div style={s.placeholder}>Bientôt disponible.</div>}
        {tab === 'rentabilite' && <div style={s.placeholder}>Bientôt disponible.</div>}
        {tab === 'taxe' && <div style={s.placeholder}>Bientôt disponible.</div>}
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

  /* ── Shared calc styles ── */
  calc: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '7px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
  },
  inputWrap: { position: 'relative' as const },
  input: {
    width: '100%', padding: '11px 36px 11px 14px',
    fontSize: '15px', fontWeight: 500, color: 'var(--text)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', fontFamily: 'inherit', outline: 'none',
  },
  suffix: {
    position: 'absolute' as const, right: '14px', top: '50%',
    transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 400,
    color: 'var(--text-3)', pointerEvents: 'none' as const,
  },
  range: { width: '100%', accentColor: 'var(--accent-text)' },
  helper: { fontSize: '11px', fontWeight: 300, color: 'var(--text-3)' },

  toggleRow: {
    display: 'flex', gap: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    padding: '4px', borderRadius: '10px',
  },
  toggleBtn: {
    flex: 1, padding: '8px 10px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
    background: 'transparent', border: 'none', borderRadius: '7px',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  toggleActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
  },

  results: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px', marginTop: '4px',
  },
  resultBox: {
    padding: '14px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '12px',
  },
  resultLabel: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-3)',
    textTransform: 'uppercase' as const, letterSpacing: '0.4px',
    marginBottom: '6px',
  },
  resultValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '24px', fontWeight: 400, color: 'var(--text)',
    marginBottom: '6px',
  },
  resultHint: {
    fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.5,
  },

  disclaimer: {
    display: 'flex', alignItems: 'flex-start', gap: '7px',
    padding: '10px 12px',
    background: 'rgba(96,165,250,0.06)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '9px',
    fontSize: '11.5px', fontWeight: 300, color: 'var(--text-2)',
    lineHeight: 1.5, marginTop: '4px',
  },
}
