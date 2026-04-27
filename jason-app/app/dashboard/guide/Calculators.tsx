'use client'

import { useState, useMemo } from 'react'
import { Calculator, Scales, CurrencyEur, Info } from '@phosphor-icons/react'

type CalcTab = 'fiscal' | 'statut'

function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}

/* ──────────────────────────────────────────
 * SIMULATEUR FISCAL LCD (micro-BIC)
 * ────────────────────────────────────────── */

function FiscalLCD() {
  const [ca, setCa] = useState(30000)
  const [classe, setClasse] = useState(false)

  const result = useMemo(() => {
    const plafond = classe ? 77700 : 15000
    const tauxAbattement = classe ? 0.71 : 0.30
    const sousPlafond = ca <= plafond

    const baseImposable = sousPlafond ? ca * (1 - tauxAbattement) : ca // au-delà, micro non applicable
    const economieClassement = ca * (0.71 - 0.30) // gain si on passe de non-classé à classé

    return {
      plafond,
      tauxAbattement,
      sousPlafond,
      baseImposable,
      economieClassement,
    }
  }, [ca, classe])

  return (
    <div style={cs.calc}>
      <div style={cs.row}>
        <div style={cs.field}>
          <label style={cs.label}>Chiffre d&apos;affaires annuel</label>
          <div style={cs.inputWrap}>
            <input
              type="number"
              value={ca}
              onChange={(e) => setCa(Math.max(0, Number(e.target.value)))}
              style={cs.input}
              min={0}
              step={1000}
            />
            <span style={cs.suffix}>€</span>
          </div>
          <input
            type="range"
            value={ca}
            onChange={(e) => setCa(Number(e.target.value))}
            min={0}
            max={100000}
            step={1000}
            style={cs.range}
          />
        </div>
        <div style={cs.field}>
          <label style={cs.label}>Logement classé Atout France ?</label>
          <div style={cs.toggleRow}>
            <button
              onClick={() => setClasse(false)}
              style={{ ...cs.toggleBtn, ...(classe ? {} : cs.toggleActive) }}
            >
              Non classé
            </button>
            <button
              onClick={() => setClasse(true)}
              style={{ ...cs.toggleBtn, ...(classe ? cs.toggleActive : {}) }}
            >
              Classé 1–5★
            </button>
          </div>
          <div style={cs.helper}>
            Abattement {result.tauxAbattement * 100} % · plafond {fmtEur(result.plafond)}
          </div>
        </div>
      </div>

      <div style={cs.results}>
        {result.sousPlafond ? (
          <>
            <div style={cs.resultBox}>
              <div style={cs.resultLabel}>Base imposable (micro-BIC)</div>
              <div style={cs.resultValue}>{fmtEur(result.baseImposable)}</div>
              <div style={cs.resultHint}>
                {fmtEur(ca)} − abattement {result.tauxAbattement * 100} %
              </div>
            </div>
            <div style={cs.resultBox}>
              <div style={cs.resultLabel}>Tu peux rester au micro</div>
              <div style={{ ...cs.resultValue, color: '#10b981' }}>OK</div>
              <div style={cs.resultHint}>
                Sous le plafond {fmtEur(result.plafond)}
              </div>
            </div>
          </>
        ) : (
          <div style={{ ...cs.resultBox, gridColumn: '1 / -1', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={cs.resultLabel}>Plafond dépassé</div>
            <div style={{ ...cs.resultValue, color: '#ef4444' }}>Régime réel</div>
            <div style={cs.resultHint}>
              Tu dépasses le plafond {fmtEur(result.plafond)} → bascule au réel obligatoire l&apos;année suivante
            </div>
          </div>
        )}
        {!classe && ca > 0 && (
          <div style={{ ...cs.resultBox, gridColumn: '1 / -1', background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
            <div style={cs.resultLabel}>Si tu te fais classer Atout France</div>
            <div style={{ ...cs.resultValue, color: '#10b981', fontSize: '20px' }}>
              − {fmtEur(result.economieClassement)} de base imposable
            </div>
            <div style={cs.resultHint}>
              Économie estimée d&apos;impôt : ~{fmtEur(result.economieClassement * 0.30)} (à TMI 30 %)
            </div>
          </div>
        )}
      </div>

      <div style={cs.disclaimer}>
        <Info size={11} weight="fill" />
        Estimation pédagogique. Le régime <strong>réel simplifié</strong> peut être plus avantageux au-delà de 30 k€/an si tu as des charges (amortissement, intérêts, travaux). Consulte un expert-comptable.
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
 * EI vs SASU
 * ────────────────────────────────────────── */

function EIvsSASU() {
  const [benef, setBenef] = useState(40000)
  const [tmi, setTmi] = useState(30) // tranche marginale d'imposition

  const result = useMemo(() => {
    /* EI au régime réel — TNS (~40 % de cotisations sur le bénéfice) */
    const cotisEI = benef * 0.42
    const netImposableEI = benef - cotisEI
    const irEI = netImposableEI * (tmi / 100)
    const netPocheEI = netImposableEI - irEI

    /* SASU full dividendes (simplifié) — IS 15 % jusqu'à 42 500 €, puis 25 %, puis flat tax 30 % sur dividendes */
    const seuilIS = 42500
    const isReduit = Math.min(benef, seuilIS) * 0.15
    const isPlein = Math.max(0, benef - seuilIS) * 0.25
    const totalIS = isReduit + isPlein
    const beneficeApresIS = benef - totalIS
    const flatTax = beneficeApresIS * 0.30
    const netPocheSASU = beneficeApresIS - flatTax

    const diff = netPocheSASU - netPocheEI
    const meilleur = diff > 0 ? 'sasu' : 'ei'

    return {
      ei: { cotis: cotisEI, ir: irEI, net: netPocheEI },
      sasu: { is: totalIS, flatTax, net: netPocheSASU },
      diff: Math.abs(diff),
      meilleur,
    }
  }, [benef, tmi])

  return (
    <div style={cs.calc}>
      <div style={cs.row}>
        <div style={cs.field}>
          <label style={cs.label}>Bénéfice annuel avant impôt</label>
          <div style={cs.inputWrap}>
            <input
              type="number"
              value={benef}
              onChange={(e) => setBenef(Math.max(0, Number(e.target.value)))}
              style={cs.input}
              min={0}
              step={1000}
            />
            <span style={cs.suffix}>€</span>
          </div>
          <input
            type="range"
            value={benef}
            onChange={(e) => setBenef(Number(e.target.value))}
            min={0}
            max={150000}
            step={1000}
            style={cs.range}
          />
        </div>
        <div style={cs.field}>
          <label style={cs.label}>Tranche marginale d&apos;imposition (IR)</label>
          <div style={cs.toggleRow}>
            {[11, 30, 41].map(t => (
              <button
                key={t}
                onClick={() => setTmi(t)}
                style={{ ...cs.toggleBtn, ...(tmi === t ? cs.toggleActive : {}) }}
              >
                {t} %
              </button>
            ))}
          </div>
          <div style={cs.helper}>
            Selon ton revenu fiscal de référence
          </div>
        </div>
      </div>

      <div style={cs.results}>
        <div style={{
          ...cs.resultBox,
          ...(result.meilleur === 'ei' ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)' } : {}),
        }}>
          <div style={cs.resultLabel}>EI · TNS · IR</div>
          <div style={cs.resultValue}>{fmtEur(result.ei.net)}</div>
          <div style={cs.resultHint}>
            Cotisations TNS ~42 % : {fmtEur(result.ei.cotis)}<br />
            IR ({tmi} %) : {fmtEur(result.ei.ir)}
          </div>
        </div>
        <div style={{
          ...cs.resultBox,
          ...(result.meilleur === 'sasu' ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)' } : {}),
        }}>
          <div style={cs.resultLabel}>SASU · 100 % dividendes</div>
          <div style={cs.resultValue}>{fmtEur(result.sasu.net)}</div>
          <div style={cs.resultHint}>
            IS (15/25 %) : {fmtEur(result.sasu.is)}<br />
            Flat tax 30 % : {fmtEur(result.sasu.flatTax)}
          </div>
        </div>
        {benef > 0 && (
          <div style={{ ...cs.resultBox, gridColumn: '1 / -1', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
            <div style={cs.resultLabel}>Différence en ta poche</div>
            <div style={{ ...cs.resultValue, color: 'var(--accent-text)', fontSize: '20px' }}>
              {result.meilleur === 'sasu' ? 'SASU' : 'EI'} : + {fmtEur(result.diff)}
            </div>
            <div style={cs.resultHint}>
              {result.meilleur === 'sasu'
                ? 'En SASU full dividendes, tu gardes plus net — mais aucune protection sociale ni retraite cotisée.'
                : 'En EI, tu cotises pour ta protection sociale et ta retraite — tu touches moins net mais tu construis tes droits.'}
            </div>
          </div>
        )}
      </div>

      <div style={cs.disclaimer}>
        <Info size={11} weight="fill" />
        Modèle simplifié. La SASU peut aussi distribuer une rémunération (charges salariales ~80 %), combiner salaire + dividendes, etc. La protection sociale, la retraite et l&apos;ACRE ne sont pas modélisées. Consulte un expert-comptable.
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
 * COMPOSANT PRINCIPAL AVEC TABS
 * ────────────────────────────────────────── */

export default function Calculators() {
  const [tab, setTab] = useState<CalcTab>('fiscal')

  return (
    <div style={cs.wrap} className="fade-up glass-card">
      <div style={cs.header}>
        <div style={cs.headerLeft}>
          <span style={cs.headerIcon}>
            <Calculator size={18} weight="fill" />
          </span>
          <div>
            <h3 style={cs.title}>Outils de simulation</h3>
            <p style={cs.subtitle}>
              Estimer ton imposition et choisir ton statut
            </p>
          </div>
        </div>
      </div>

      <div style={cs.tabs}>
        <button
          onClick={() => setTab('fiscal')}
          style={{ ...cs.tab, ...(tab === 'fiscal' ? cs.tabActive : {}) }}
        >
          <CurrencyEur size={14} weight="fill" />
          Fiscalité LCD (micro-BIC)
        </button>
        <button
          onClick={() => setTab('statut')}
          style={{ ...cs.tab, ...(tab === 'statut' ? cs.tabActive : {}) }}
        >
          <Scales size={14} weight="fill" />
          EI vs SASU
        </button>
      </div>

      <div style={cs.body}>
        {tab === 'fiscal' ? <FiscalLCD /> : <EIvsSASU />}
      </div>
    </div>
  )
}

const cs: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 'clamp(20px,3vw,28px)',
    borderRadius: '20px',
    marginBottom: '28px',
  },
  header: { marginBottom: '18px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 400,
    color: 'var(--text)',
    margin: '0 0 2px',
  },
  subtitle: {
    fontSize: '12px', fontWeight: 300,
    color: 'var(--text-3)',
    margin: 0,
  },

  tabs: {
    display: 'flex', gap: '6px',
    padding: '4px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    marginBottom: '20px',
    width: 'fit-content',
    maxWidth: '100%',
    flexWrap: 'wrap' as const,
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '8px 14px',
    fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-2)',
    background: 'transparent',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
  },

  body: {},

  calc: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '7px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
  },
  inputWrap: { position: 'relative' as const },
  input: {
    width: '100%',
    padding: '11px 36px 11px 14px',
    fontSize: '15px', fontWeight: 500,
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  suffix: {
    position: 'absolute' as const,
    right: '14px', top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '13px', fontWeight: 400,
    color: 'var(--text-3)',
    pointerEvents: 'none' as const,
  },
  range: {
    width: '100%',
    accentColor: 'var(--accent-text)',
  },
  helper: {
    fontSize: '11px', fontWeight: 300,
    color: 'var(--text-3)',
  },

  toggleRow: {
    display: 'flex', gap: '6px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '4px',
    borderRadius: '10px',
  },
  toggleBtn: {
    flex: 1,
    padding: '8px 10px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)',
    background: 'transparent',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  toggleActive: {
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
  },

  results: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
    marginTop: '4px',
  },
  resultBox: {
    padding: '14px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  resultLabel: {
    fontSize: '11px', fontWeight: 600,
    color: 'var(--text-3)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
    marginBottom: '6px',
  },
  resultValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '24px', fontWeight: 400,
    color: 'var(--text)',
    marginBottom: '6px',
  },
  resultHint: {
    fontSize: '11.5px', fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.5,
  },

  disclaimer: {
    display: 'flex', alignItems: 'flex-start', gap: '7px',
    padding: '10px 12px',
    background: 'rgba(96,165,250,0.06)',
    border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: '9px',
    fontSize: '11.5px', fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.5,
    marginTop: '4px',
  },
}
