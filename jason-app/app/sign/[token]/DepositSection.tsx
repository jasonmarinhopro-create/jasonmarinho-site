'use client'

import { useState } from 'react'

interface Props {
  token: string
  amount: number
  depositParam?: string
  depositAlreadyHeld: boolean
}

export default function DepositSection({ token, amount, depositParam, depositAlreadyHeld }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePayDeposit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Erreur lors du paiement.')
        setLoading(false)
      } else {
        window.location.href = data.url
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
      setLoading(false)
    }
  }

  // Caution déjà payée
  if (depositAlreadyHeld) {
    return (
      <div style={box('success')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <strong style={{ color: '#34D399', display: 'block', marginBottom: '4px' }}>
              Caution enregistrée
            </strong>
            <p style={hint}>
              {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € bloqués sur votre carte.
              Cette somme sera libérée par le propriétaire après votre séjour si aucun dommage n&apos;est constaté.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Retour d'annulation Stripe
  if (depositParam === 'cancel') {
    return (
      <div style={box('warning')}>
        <strong style={{ color: '#FFD56B', display: 'block', marginBottom: '8px' }}>
          Paiement de la caution annulé
        </strong>
        <p style={hint}>Vous pouvez régler la caution ci-dessous pour finaliser votre dossier.</p>
        <PayButton loading={loading} onClick={handlePayDeposit} amount={amount} />
        {error && <p style={errStyle}>{error}</p>}
      </div>
    )
  }

  // Invite à payer la caution
  return (
    <div style={box('default')}>
      <div style={{ marginBottom: '16px' }}>
        <strong style={{ color: '#f0ebe1', display: 'block', marginBottom: '6px', fontSize: '16px' }}>
          Dépôt de garantie requis
        </strong>
        <p style={hint}>
          Pour finaliser votre séjour, un dépôt de garantie de{' '}
          <strong style={{ color: '#FFD56B' }}>
            {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </strong>{' '}
          est demandé par le propriétaire.
        </p>
        <p style={{ ...hint, marginTop: '8px' }}>
          Votre carte sera <strong style={{ color: '#f0ebe1' }}>bloquée mais pas débitée</strong>, la somme
          n&apos;est encaissée qu&apos;en cas de dommages constatés à la fin du séjour.
        </p>
      </div>
      {error && <p style={errStyle}>{error}</p>}
      <PayButton loading={loading} onClick={handlePayDeposit} amount={amount} />
    </div>
  )
}

function PayButton({ loading, onClick, amount }: { loading: boolean; onClick: () => void; amount: number }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'block', width: '100%',
        padding: '14px 20px',
        background: loading ? 'rgba(99,91,255,0.3)' : 'rgba(99,91,255,0.2)',
        border: '1px solid rgba(99,91,255,0.4)',
        borderRadius: '12px',
        fontSize: '15px', fontWeight: 600,
        color: loading ? '#6c6fad' : '#a29bfe',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {loading
        ? 'Redirection vers Stripe…'
        : `Régler la caution, ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € →`}
    </button>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function box(type: 'success' | 'warning' | 'default'): React.CSSProperties {
  const colors = {
    success: { bg: 'rgba(52,211,153,0.06)',  border: 'rgba(52,211,153,0.2)' },
    warning: { bg: 'rgba(255,213,107,0.06)', border: 'rgba(255,213,107,0.2)' },
    default: { bg: '#0f2018',               border: '#1e3d2f' },
  }
  const c = colors[type]
  return {
    background: c.bg, border: `1px solid ${c.border}`,
    borderRadius: '16px', padding: '24px 28px',
    marginBottom: '24px',
  }
}

const hint: React.CSSProperties = {
  fontSize: '13px', color: '#a5c4b0', lineHeight: 1.7, margin: 0,
}

const errStyle: React.CSSProperties = {
  fontSize: '13px', color: '#ef4444', margin: '12px 0 0',
}
