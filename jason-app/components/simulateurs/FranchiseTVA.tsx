'use client'

import { useState, useMemo } from 'react'
import type { AccountStats } from '@/lib/lcd/account-stats'
import { FISCAL_PARAMS_2026 } from '@/lib/lcd/fiscal-params'
import { s, fmtEur, MiniBox } from './_shared'

export default function FranchiseTVA({ accountStats }: { accountStats?: AccountStats }) {
  const initialCa = accountStats && accountStats.caTotal12m > 0
    ? Math.round(accountStats.caTotal12m)
    : 25000
  const [ca, setCa] = useState(initialCa)
  const [activite, setActivite] = useState<'hotelier' | 'locatif'>('hotelier')

  const tvaParams = FISCAL_PARAMS_2026.tva

  const result = useMemo(() => {
    if (activite === 'locatif') {
      return {
        verdict: 'Exonérée de TVA',
        verdictTone: 'success' as const,
        verdictSub: 'Location meublée sans services para-hôteliers : exonérée (art. 261 D 4° du CGI), quel que soit ton CA',
        position: 'Aucun seuil',
        positionSub: 'Tant que tu proposes 2 services ou moins',
        tvaPotentielle: 0,
      }
    }
    if (ca <= tvaParams.seuilFranchise) {
      return {
        verdict: 'Franchise applicable',
        verdictTone: 'success' as const,
        verdictSub: `CA sous le seuil ${fmtEur(tvaParams.seuilFranchise)}, pas de TVA à facturer`,
        position: 'Sous le seuil',
        positionSub: `Marge restante : ${fmtEur(tvaParams.seuilFranchise - ca)}`,
        tvaPotentielle: ca * tvaParams.tauxLcdHotelier,
      }
    }
    if (ca <= tvaParams.seuilTolerance) {
      return {
        verdict: 'Zone de tolérance',
        verdictTone: 'neutral' as const,
        verdictSub: `Premier dépassement : tu gardes la franchise cette année, tu la perds si tu restes au-dessus de ${fmtEur(tvaParams.seuilFranchise)} l'an prochain`,
        position: `Au-dessus de ${fmtEur(tvaParams.seuilFranchise)}`,
        positionSub: `TVA due dès le jour où tu passes ${fmtEur(tvaParams.seuilTolerance)}`,
        tvaPotentielle: ca * tvaParams.tauxLcdHotelier,
      }
    }
    return {
      verdict: 'Sortie de franchise',
      verdictTone: 'alert' as const,
      verdictSub: 'Tu factures la TVA à 10 % dès le jour du dépassement',
      position: `Au-dessus de ${fmtEur(tvaParams.seuilTolerance)}`,
      positionSub: 'Demande ton numéro de TVA intracommunautaire',
      tvaPotentielle: ca * tvaParams.tauxLcdHotelier,
    }
  }, [ca, activite, tvaParams])

  return (
    <div style={s.calc}>
      <div style={s.row}>
        <div style={s.field}>
          <label style={s.label}>Chiffre d'affaires LCD annuel</label>
          <div style={s.inputWrap}>
            <input type="number" value={ca} onChange={e => setCa(+e.target.value || 0)} style={s.input} />
            <span style={s.suffix}>€</span>
          </div>
          <input type="range" min={0} max={120000} step={500} value={ca} onChange={e => setCa(+e.target.value)} style={s.range} />
          <div style={s.helper}>{accountStats && accountStats.caTotal12m > 0 ? 'Prérempli avec ton CA des 12 derniers mois' : 'Valeur d\'exemple : ajoute tes séjours pour voir ton cas'}</div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Type d'activité</label>
          <div style={s.toggleRow}>
            <button onClick={() => setActivite('hotelier')} style={{ ...s.toggleBtn, ...(activite === 'hotelier' ? s.toggleActive : {}) }}>
              Avec services
            </button>
            <button onClick={() => setActivite('locatif')} style={{ ...s.toggleBtn, ...(activite === 'locatif' ? s.toggleActive : {}) }}>
              Sans services
            </button>
          </div>
          <div style={s.helper}>Avec services = au moins 3 sur 4 : petit-déjeuner, ménage pendant le séjour, linge, réception (séjours de 30 nuits max)</div>
        </div>
      </div>

      <div style={{
        padding: '18px 20px', borderRadius: '14px',
        background: result.verdictTone === 'alert'
          ? 'var(--danger-bg)'
          : result.verdictTone === 'success'
            ? 'var(--accent-bg)'
            : 'rgba(255,213,107,0.12)',
        border: '1px solid ' + (
          result.verdictTone === 'alert' ? 'var(--danger-border)' :
          result.verdictTone === 'success' ? 'var(--accent-border)' :
          'rgba(255,213,107,0.40)'
        ),
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Verdict</div>
          <div style={{
            fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 500,
            color: result.verdictTone === 'alert' ? 'var(--danger)' : result.verdictTone === 'success' ? 'var(--accent-text)' : '#B7791F',
            letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>{result.verdict}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px', lineHeight: 1.5 }}>{result.verdictSub}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <MiniBox label="Position vs seuils" value={result.position} sub={result.positionSub} />
          {activite === 'hotelier' && result.tvaPotentielle > 0 && (
            <MiniBox label="Si tu collectais la TVA" value={fmtEur(result.tvaPotentielle)} sub="au taux de 10 % (hébergement para-hôtelier)" />
          )}
        </div>
      </div>

      <div style={{
        padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5,
        background: 'rgba(255,213,107,0.06)', borderLeft: '2px solid var(--accent-text)', borderRadius: '0 8px 8px 0',
      }}>
        <strong style={{ color: 'var(--accent-text)' }}>À savoir</strong> : ta location para-hôtelière est une prestation d&apos;hébergement, d&apos;où le seuil de {fmtEur(tvaParams.seuilFranchise)}. Le seuil de {fmtEur(tvaParams.seuilServices)} concerne les autres services (une conciergerie, par exemple). Le seuil unique de 25 000 € prévu en 2025 a été abandonné (loi du 3 novembre 2025).
      </div>
    </div>
  )
}
