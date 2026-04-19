'use client'
import { useState } from 'react'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react'

const PRESETS = [
  { label: '2,98 €', amount: 298, desc: 'Un petit geste' },
  { label: '5,98 €', amount: 598, desc: 'Merci sincèrement' },
  { label: '9,98 €', amount: 998, desc: 'Tu assures vraiment' },
]

export default function TipForm() {
  const [selected, setSelected] = useState<number | null>(598)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveAmount = custom
    ? Math.round(parseFloat(custom.replace(',', '.')) * 100)
    : selected

  const displayAmount = custom
    ? custom + ' €'
    : PRESETS.find(p => p.amount === selected)?.label ?? ''

  async function handleSubmit() {
    if (!effectiveAmount || effectiveAmount < 100) {
      setError('Montant minimum : 1,00 €')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/tip/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: effectiveAmount }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur.'); setLoading(false); return }
      window.location.href = data.url
    } catch {
      setError('Erreur réseau.')
      setLoading(false)
    }
  }

  return (
    <div style={s.wrap}>
      {/* Montants préréglés */}
      <div style={s.presets}>
        {PRESETS.map(p => (
          <button
            key={p.amount}
            onClick={() => { setSelected(p.amount); setCustom('') }}
            style={{ ...s.preset, ...(selected === p.amount && !custom ? s.presetActive : {}) }}
          >
            <span style={s.presetAmount}>{p.label}</span>
            <span style={s.presetDesc}>{p.desc}</span>
          </button>
        ))}
      </div>

      {/* Montant libre */}
      <div style={s.customWrap}>
        <label style={s.customLabel}>Ou choisis ton montant</label>
        <div style={s.customRow}>
          <input
            type="number"
            min="1"
            step="0.5"
            placeholder="Ex : 15"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(null) }}
            style={{ ...s.customInput, ...(custom ? s.customInputActive : {}) }}
          />
          <span style={s.customCurrency}>€</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={loading || !effectiveAmount}
        style={{ ...s.cta, ...(loading || !effectiveAmount ? s.ctaDisabled : {}) }}
      >
        {loading ? (
          <><CircleNotch size={16} style={{ animation: 'spin 1s linear infinite' }} /> Redirection…</>
        ) : (
          <>Contribuer {displayAmount} <ArrowRight size={16} weight="bold" /></>
        )}
      </button>

      {error && <p style={s.err}>{error}</p>}

      <p style={s.legal}>
        Paiement sécurisé via Stripe. Aucun remboursement prévu sur les contributions volontaires.
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '480px' },

  presets: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  preset: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '16px 8px', borderRadius: '14px', cursor: 'pointer', transition: 'all .15s',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    fontFamily: 'inherit',
  },
  presetActive: {
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.4)',
  },
  presetAmount: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 400, color: '#fff' },
  presetDesc: { fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 300 },

  customWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  customLabel: { fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase' },
  customRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  customInput: {
    flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    color: '#fff', fontSize: '16px', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .15s',
  },
  customInputActive: { border: '1px solid rgba(255,213,107,0.4)', background: 'rgba(255,213,107,0.06)' },
  customCurrency: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Fraunces, serif' },

  cta: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '16px 28px', background: '#FFD56B', color: '#002820',
    fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', letterSpacing: '0.2px',
  },
  ctaDisabled: { opacity: 0.4, cursor: 'not-allowed' },

  err: { fontSize: '13px', color: '#f87171', margin: 0, textAlign: 'center' },
  legal: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.6, margin: 0 },
}
