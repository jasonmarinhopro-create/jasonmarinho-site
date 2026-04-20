'use client'
import { useState } from 'react'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react'

export default function TipForm() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveAmount = amount
    ? Math.round(parseFloat(amount.replace(',', '.')) * 100)
    : null

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
      <div style={s.inputRow}>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Sois libre de mettre ce que tu veux"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ ...s.input, ...(amount ? s.inputActive : {}) }}
        />
        <span style={s.currency}>€</span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !effectiveAmount}
        style={{ ...s.cta, ...(loading || !effectiveAmount ? s.ctaDisabled : {}) }}
      >
        {loading ? (
          <><CircleNotch size={20} style={{ animation: 'spin 1s linear infinite' }} /> Redirection…</>
        ) : (
          <>Contribuer{amount ? ` ${amount} €` : ''} <ArrowRight size={20} weight="bold" /></>
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
  wrap: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },

  inputRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  input: {
    flex: 1, padding: '18px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    color: '#fff', fontSize: '18px', fontFamily: 'inherit',
    outline: 'none', transition: 'border-color .15s',
  },
  inputActive: {
    border: '1px solid rgba(255,213,107,0.5)',
    background: 'rgba(255,213,107,0.06)',
  },
  currency: {
    fontSize: '22px', color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Fraunces, serif', flexShrink: 0,
  },

  cta: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '20px 32px',
    background: 'linear-gradient(135deg, #FFD56B 0%, #F5C842 100%)',
    color: '#002820',
    fontSize: '17px', fontWeight: 800, borderRadius: '14px', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
    letterSpacing: '0.2px', boxShadow: '0 8px 32px rgba(255,213,107,0.3)',
  },
  ctaDisabled: { opacity: 0.35, cursor: 'not-allowed', boxShadow: 'none' },

  err: { fontSize: '13px', color: '#f87171', margin: 0, textAlign: 'center' },
  legal: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.6, margin: 0 },
}
