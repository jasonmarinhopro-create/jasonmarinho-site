'use client'
import { useState } from 'react'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react/dist/ssr'

interface Props {
  priceId: string
  label?: string
  style?: React.CSSProperties
}

export default function SubscribeButton({ priceId, label = 'Passer en Standard', style }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/subscribe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button onClick={handleClick} disabled={loading} style={{ ...btnStyle, ...style }}>
        {loading
          ? <><CircleNotch size={14} style={{ animation: 'spin 1s linear infinite' }} /> Redirection…</>
          : <>{label} <ArrowRight size={14} weight="bold" /></>
        }
      </button>
      {error && <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>{error}</p>}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
  color: '#34D399', fontSize: '13px', fontWeight: 600, padding: '11px 18px',
  borderRadius: '10px', cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
}
