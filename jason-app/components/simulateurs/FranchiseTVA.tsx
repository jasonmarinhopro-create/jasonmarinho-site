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
        verdict: 'Hors champ TVA',
        verdictTone: 'success' as const,
        verdictSub: 'Location meublée nue : pas soumise à TVA',
        position: '—',
        positionSub: 'Sans services para-hôteliers',
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
        verdictSub: 'Tu peux rester en franchise une année si tu redescends',
        position: `Au-dessus de ${fmtEur(tvaParams.seuilFranchise)}`,
        positionSub: `Sortie immédiate si tu passes ${fmtEur(tvaParams.seuilTolerance)}`,
        tvaPotentielle: ca * tvaParams.tauxLcdHotelier,
      }
    }
    return {
      verdict: 'Sortie de franchise',
      verdictTone: 'alert' as const,
      verdictSub: 'Tu dois facturer la TVA dès le mois suivant le dépassement',
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
          <input type="range" min={0} max={80000} step={500} value={ca} onChange={e => setCa(+e.target.value)} style={s.range} />
          <div style={s.helper}>{accountStats && accountStats.caTotal12m > 0 ? 'Préfilé avec ton CA 12 mois glissants' : 'Valeur démo · ajoute tes séjours pour le réel'}</div>
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
          <div style={s.helper}>Services para-hôteliers = petit-déj quotidien, ménage en cours, linge, accueil (3 min)</div>
        </div>
      </div>

      <div style={{
        padding: '18px 20px', borderRadius: '14px',
        background: result.verdictTone === 'alert'
          ? 'linear-gradient(135deg, rgba(252,165,165,0.12) 0%, var(--bg-2) 100%)'
          : result.verdictTone === 'success'
            ? 'linear-gradient(135deg, rgba(167,243,183,0.12) 0%, var(--bg-2) 100%)'
            : 'linear-gradient(135deg, rgba(255,213,107,0.10) 0%, var(--bg-2) 100%)',
        border: '1px solid ' + (
          result.verdictTone === 'alert' ? 'rgba(252,165,165,0.30)' :
          result.verdictTone === 'success' ? 'rgba(167,243,183,0.30)' :
          'rgba(255,213,107,0.28)'
        ),
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Verdict</div>
          <div style={{
            fontFamily: 'var(--font-fraunces), serif', fontSize: '24px', fontWeight: 500,
            color: result.verdictTone === 'alert' ? '#FCA5A5' : result.verdictTone === 'success' ? '#A7F3B7' : 'var(--accent-text)',
            letterSpacing: '-0.01em', lineHeight: 1.2,
          }}>{result.verdict}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px', lineHeight: 1.5 }}>{result.verdictSub}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <MiniBox label="Position vs seuils" value={result.position} sub={result.positionSub} />
          {activite === 'hotelier' && result.tvaPotentielle > 0 && (
            <MiniBox label="Si tu collectais la TVA" value={fmtEur(result.tvaPotentielle)} sub="au taux 10 % LCD hôtelier" />
          )}
        </div>
      </div>

      <div style={{
        padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5,
        background: 'rgba(255,213,107,0.06)', borderLeft: '2px solid var(--accent-text)', borderRadius: '0 8px 8px 0',
      }}>
        <strong style={{ color: 'var(--accent-text)' }}>Réforme 25 000 €</strong> : la LFi 2025 a proposé un seuil unifié à 25 000 € pour tous les BIC. Sa mise en œuvre reste en suspens. À ce jour, le seuil 37 500 € reste applicable. Vérifie le BOFiP avant toute décision.
      </div>
    </div>
  )
}
