'use client'

import { useState, useMemo } from 'react'
import { Info } from '@phosphor-icons/react/dist/ssr'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { s, fmtEur } from './_shared'

export default function EIvsSASU({ accountStats }: { accountStats?: AccountStats }) {
  // Si l'hôte a une activité réelle, on initialise le bénéfice à 70% du CA
  // (proxy raisonnable pour LCD : 30% de charges déductibles approximatives).
  // Sinon, valeur de démo 40 000 €.
  const initialBenef = accountStats && accountStats.caTotal12m > 0
    ? Math.max(1000, Math.round(accountStats.caTotal12m * 0.7))
    : 40000
  const [benef, setBenef] = useState(initialBenef)
  const [tmi, setTmi] = useState(30)

  const result = useMemo(() => {
    const cotisEI = benef * 0.42
    const netImposableEI = benef - cotisEI
    const irEI = netImposableEI * (tmi / 100)
    const netPocheEI = netImposableEI - irEI

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
    <div style={s.calc}>
      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Bénéfice annuel avant impôt</label>
          <div style={s.inputWrap}>
            <input type="number" value={benef} onChange={e => setBenef(Math.max(0, Number(e.target.value)))}
              style={s.input} min={0} step={1000} />
            <span style={s.suffix}>€</span>
          </div>
          <input type="range" value={benef} onChange={e => setBenef(Number(e.target.value))}
            min={0} max={150000} step={1000} style={s.range} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Tranche marginale d&apos;imposition (IR)</label>
          <div style={s.toggleRow}>
            {[11, 30, 41].map(t => (
              <button key={t} onClick={() => setTmi(t)} style={{ ...s.toggleBtn, ...(tmi === t ? s.toggleActive : {}) }}>{t} %</button>
            ))}
          </div>
          <div style={s.helper}>Selon ton revenu fiscal de référence</div>
        </div>
      </div>

      <div style={s.results}>
        <div style={{ ...s.resultBox, ...(result.meilleur === 'ei' ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)' } : {}) }}>
          <div style={s.resultLabel}>EI · TNS · IR</div>
          <div style={s.resultValue}>{fmtEur(result.ei.net)}</div>
          <div style={s.resultHint}>Cotisations TNS ~42 % : {fmtEur(result.ei.cotis)}<br />IR ({tmi} %) : {fmtEur(result.ei.ir)}</div>
        </div>
        <div style={{ ...s.resultBox, ...(result.meilleur === 'sasu' ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)' } : {}) }}>
          <div style={s.resultLabel}>SASU · 100 % dividendes</div>
          <div style={s.resultValue}>{fmtEur(result.sasu.net)}</div>
          <div style={s.resultHint}>IS (15/25 %) : {fmtEur(result.sasu.is)}<br />Flat tax 30 % : {fmtEur(result.sasu.flatTax)}</div>
        </div>
        {benef > 0 && (
          <div style={{ ...s.resultBox, gridColumn: '1 / -1', background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
            <div style={s.resultLabel}>Différence en ta poche</div>
            <div style={{ ...s.resultValue, color: 'var(--accent-text)', fontSize: '20px' }}>
              {result.meilleur === 'sasu' ? 'SASU' : 'EI'} : + {fmtEur(result.diff)}
            </div>
            <div style={s.resultHint}>
              {result.meilleur === 'sasu'
                ? 'En SASU full dividendes, tu gardes plus net mais aucune protection sociale ni retraite cotisée.'
                : 'En EI, tu cotises pour ta protection sociale et ta retraite. Tu touches moins net mais tu construis tes droits.'}
            </div>
          </div>
        )}
      </div>

      <div style={s.disclaimer}>
        <Info size={11} weight="fill" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Modèle simplifié. La SASU peut combiner salaire + dividendes. La protection sociale, la retraite et l&apos;ACRE ne sont pas modélisées. Consulte un expert-comptable.</span>
      </div>
    </div>
  )
}
