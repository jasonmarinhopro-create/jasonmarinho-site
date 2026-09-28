'use client'

// Micro-BIC ou régime réel, côte à côte, avec l'impôt estimé selon la
// tranche d'imposition choisie (impôt sur le revenu + prélèvements sociaux).
import { useState } from 'react'
import Link from 'next/link'
import { eur } from '../_ui/ui'
import { FISCAL_PARAMS_2026 } from '@/lib/lcd/fiscal-params'

const TRANCHES = [0, 0.11, 0.3, 0.41, 0.45]
const PS = FISCAL_PARAMS_2026.societe.prelevementsSociauxLmnp

interface Props {
  baseMicro: number
  baseReel: number
  recettes: number
  abattementTexte: string
  commissions: number
  charges: number
  amortissements: number
  amortissementsSaisis: boolean
  microEligible: boolean
}

export default function TaxCompare(p: Props) {
  const [tmi, setTmi] = useState(0.3)
  const impot = (base: number) => base * (tmi + PS)
  const best = p.microEligible && p.amortissementsSaisis ? (p.baseReel < p.baseMicro ? 'reel' : 'micro') : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Ta tranche d&apos;imposition</span>
        <div style={{ display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          {TRANCHES.map(t => (
            <button key={t} type="button" onClick={() => setTmi(t)} aria-pressed={tmi === t}
              style={{ padding: '5px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tmi === t ? 700 : 500, background: tmi === t ? 'var(--surface)' : 'transparent', color: tmi === t ? 'var(--accent-text)' : 'var(--text-3)' }}>
              {Math.round(t * 100)} %
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
        <Box
          title="Micro-BIC"
          highlight={best === 'micro'}
          disabled={!p.microEligible}
          disabledText="Pas possible avec tes recettes (plafond dépassé)."
          rows={[
            ['Recettes brutes', eur(p.recettes)],
            ['Abattement forfaitaire', p.abattementTexte],
          ]}
          base={p.baseMicro}
          impot={impot(p.baseMicro)}
          note="Aucune dépense à justifier : l'abattement remplace tes charges."
        />
        <Box
          title="Régime réel"
          highlight={best === 'reel'}
          rows={[
            ['Recettes brutes', eur(p.recettes)],
            ['Commissions', `− ${eur(p.commissions)}`],
            ['Charges déductibles', `− ${eur(p.charges)}`],
            ['Amortissements', p.amortissementsSaisis ? `− ${eur(p.amortissements)}` : 'non renseignés'],
          ]}
          base={p.baseReel}
          impot={impot(p.baseReel)}
          note={p.amortissementsSaisis
            ? "Comptabilité à tenir, souvent avec un expert-comptable (environ 400 à 1 000 € par an, déductibles)."
            : undefined}
          warning={!p.amortissementsSaisis ? (
            <>Incomplet : sans l&apos;amortissement du bien et du mobilier, le réel paraît plus cher qu&apos;il ne l&apos;est. <Link href="/dashboard/finances/journal" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Ajoute-le dans le Journal</Link> (charge « Investissement amorti »).</>
          ) : undefined}
        />
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Impôt estimé = base imposable × (ta tranche + 18,6 % de prélèvements sociaux). Estimation simplifiée : le calcul réel dépend de tout le foyer.
      </p>
    </div>
  )
}

function Box({ title, rows, base, impot, note, highlight, disabled, disabledText, warning }: {
  title: string; rows: Array<[string, string]>; base: number; impot: number; note?: string
  highlight?: boolean; disabled?: boolean; disabledText?: string; warning?: React.ReactNode
}) {
  return (
    <div style={{
      border: `1px solid ${highlight ? 'var(--accent-border)' : 'var(--border)'}`,
      background: highlight ? 'var(--accent-bg)' : 'var(--bg)',
      borderRadius: 14, padding: 16, opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 15, color: 'var(--text)' }}>{title}</strong>
        {highlight && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'var(--accent-text)', color: 'var(--bg)' }}>Le plus avantageux</span>}
      </div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, color: 'var(--text-2)', padding: '3px 0' }}>
          <span>{k}</span><span style={{ whiteSpace: 'nowrap' }}>{v}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Base imposable</span>
        <strong style={{ color: 'var(--text)' }}>{eur(base)}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginTop: 4 }}>
        <span style={{ color: 'var(--text-2)' }}>Impôt estimé</span>
        <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-fraunces), serif', fontSize: 18 }}>{eur(impot)}</strong>
      </div>
      {disabled && disabledText && <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{disabledText}</p>}
      {warning && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#B7791F', lineHeight: 1.5 }}>{warning}</p>}
      {note && <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{note}</p>}
    </div>
  )
}
