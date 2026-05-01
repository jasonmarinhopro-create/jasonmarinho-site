'use client'

import { useState } from 'react'

interface Props {
  token: string
  amount: number
  paymentParam?: string
  alreadyPaid: boolean
}

export default function PaymentSection({ token, amount, paymentParam, alreadyPaid }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePayReservation() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/payment/create', {
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

  // Réservation déjà réglée
  if (alreadyPaid) {
    return (
      <div style={box('success')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <strong style={{ color: '#34D399', display: 'block', marginBottom: '4px' }}>
              Réservation réglée
            </strong>
            <p style={hint}>
              {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € reçus par le propriétaire.
              Votre réservation est confirmée.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Retour annulation Stripe
  if (paymentParam === 'cancel') {
    return (
      <div style={box('warning')}>
        <strong style={{ color: '#FFD56B', display: 'block', marginBottom: '8px' }}>
          Paiement annulé
        </strong>
        <p style={hint}>Vous pouvez régler votre réservation ci-dessous pour la finaliser.</p>
        <PayButton loading={loading} onClick={handlePayReservation} amount={amount} />
        {error && <p style={errStyle}>{error}</p>}
      </div>
    )
  }

  // Invite à payer la réservation
  return (
    <div style={box('default')}>
      <div style={{ marginBottom: '16px' }}>
        <strong style={{ color: '#f0ebe1', display: 'block', marginBottom: '6px', fontSize: '16px' }}>
          Réglez votre réservation
        </strong>
        <p style={hint}>
          Pour confirmer votre séjour, réglez en ligne{' '}
          <strong style={{ color: '#FFD56B' }}>
            {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </strong>{' '}
          directement par carte bancaire.
        </p>
        <p style={{ ...hint, marginTop: '8px' }}>
          Le paiement est <strong style={{ color: '#f0ebe1' }}>sécurisé par Stripe</strong> et votre carte
          est débitée immédiatement. Vous recevrez une confirmation par email.
        </p>
      </div>
      {error && <p style={errStyle}>{error}</p>}
      <PayButton loading={loading} onClick={handlePayReservation} amount={amount} />
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
        background: loading ? 'rgba(255,213,107,0.15)' : 'rgba(255,213,107,0.18)',
        border: '1px solid rgba(255,213,107,0.4)',
        borderRadius: '12px',
        fontSize: '15px', fontWeight: 600,
        color: loading ? '#b89a3e' : '#FFD56B',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {loading
        ? 'Redirection vers Stripe…'
        : `Payer la réservation, ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € →`}
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
    marginBottom: '16px',
  }
}

const hint: React.CSSProperties = {
  fontSize: '13px', color: '#a5c4b0', lineHeight: 1.7, margin: 0,
}

const errStyle: React.CSSProperties = {
  fontSize: '13px', color: '#ef4444', margin: '12px 0 0',
}
