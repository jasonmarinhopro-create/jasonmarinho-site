'use client'
import { useState } from 'react'
import { ArrowSquareOut, CircleNotch } from '@phosphor-icons/react/dist/ssr'

export default function ManageButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/subscribe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} style={btnStyle}>
      {loading
        ? <><CircleNotch size={13} style={{ animation: 'spin 1s linear infinite' }} /> Chargement…</>
        : <>Gérer mon abonnement <ArrowSquareOut size={13} weight="bold" /></>
      }
    </button>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px',
  background: 'var(--surface)', border: '1px solid var(--border-2)',
  color: 'var(--text-2)', fontSize: '13px', fontWeight: 500,
  padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
  fontFamily: 'inherit', transition: 'all .2s',
}
