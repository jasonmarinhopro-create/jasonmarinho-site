'use client'
import { useState } from 'react'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react/dist/ssr'

const PRESETS = [5, 10, 20, 50]

export default function TipForm() {
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const amount = selected ?? (custom ? Math.round(parseFloat(custom.replace(',', '.')) * 100) / 100 : null)
  const cents   = amount ? Math.round(amount * 100) : null

  async function handleSubmit() {
    if (!cents || cents < 100) { setError('Montant minimum : 1,00 €'); return }
    setLoading(true); setError(null)
    try {
      const res  = await fetch('/api/stripe/tip/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cents }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur.'); setLoading(false); return }
      window.location.href = data.url
    } catch { setError('Erreur réseau.'); setLoading(false) }
  }

  return (
    <div style={s.wrap}>
      {/* Preset amounts */}
      <div style={s.presets}>
        {PRESETS.map(v => (
          <button
            key={v}
            onClick={() => { setSelected(selected === v ? null : v); setCustom('') }}
            style={{ ...s.preset, ...(selected === v ? s.presetActive : {}) }}
          >
            {v} €
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div style={s.inputRow}>
        <span style={s.prefix}>€</span>
        <input
          type="number" min="1" step="1"
          placeholder="Autre montant…"
          value={custom}
          onChange={e => { setCustom(e.target.value); setSelected(null) }}
          style={{ ...s.input, ...(custom ? s.inputActive : {}) }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !cents}
        style={{ ...s.cta, ...(loading || !cents ? s.ctaDisabled : {}) }}
      >
        {loading
          ? <><CircleNotch size={18} style={{ animation: 'spin 1s linear infinite' }} /> Redirection…</>
          : <>Rejoindre les contributeurs{amount ? ` · ${amount} €` : ''} <ArrowRight size={16} weight="bold" /></>
        }
      </button>

      {error && <p style={s.err}>{error}</p>}

      <p style={s.legal}>
        Paiement sécurisé via Stripe · Contribution volontaire non remboursable
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap:    { display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' },
  presets: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' },
  preset:  {
    padding: '13px 8px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: 600,
    cursor: 'pointer', transition: 'all .15s',
  },
  presetActive: {
    background: 'rgba(255,213,107,0.12)',
    border: '1px solid rgba(255,213,107,0.4)',
    color: '#FFD56B',
  },
  inputRow:    { display: 'flex', alignItems: 'center', gap: '10px' },
  prefix:      { fontSize: '20px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-fraunces), serif', flexShrink: 0 },
  input:       {
    flex: 1, padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: '#fff',
    fontSize: '16px', outline: 'none', transition: 'border-color .15s',
  },
  inputActive: { border: '1px solid rgba(255,213,107,0.4)', background: 'rgba(255,213,107,0.05)' },
  cta:         {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '18px 28px',
    background: 'linear-gradient(135deg, #FFD56B 0%, #F5C842 100%)',
    color: '#002820', fontSize: '16px', fontWeight: 800,
    borderRadius: '14px', border: 'none', cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(255,213,107,0.25)', transition: 'all .2s',
  },
  ctaDisabled: { opacity: 0.35, cursor: 'not-allowed', boxShadow: 'none' },
  err:         { fontSize: '13px', color: '#f87171', margin: 0, textAlign: 'center' },
  legal:       { fontSize: '11px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', margin: 0, lineHeight: 1.6 },
}
