'use client'

import { useState } from 'react'
import { SIGN_UI, type UiLang } from '@/lib/sign-ui-i18n'

interface Props {
  token: string
  amount: number
  depositParam?: string
  depositAlreadyHeld: boolean
  lang: UiLang
}

export default function DepositSection({ token, amount, depositParam, depositAlreadyHeld, lang }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = SIGN_UI[lang]
  const amountLabel = `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`

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
        setError(data.error ?? t.paymentError)
        setLoading(false)
      } else {
        window.location.href = data.url
      }
    } catch {
      setError(t.networkError)
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
            <strong style={{ color: 'var(--success-1)', display: 'block', marginBottom: '4px' }}>
              {t.depositRegistered}
            </strong>
            <p style={hint}>{t.depositRegisteredHint(amountLabel)}</p>
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
          {t.depositCancelled}
        </strong>
        <p style={hint}>{t.depositCancelledHint}</p>
        <PayButton loading={loading} onClick={handlePayDeposit} amountLabel={amountLabel} t={t} />
        {error && <p style={errStyle}>{error}</p>}
      </div>
    )
  }

  // Invite à payer la caution
  return (
    <div style={box('default')}>
      <div style={{ marginBottom: '16px' }}>
        <strong style={{ color: '#f0ebe1', display: 'block', marginBottom: '6px', fontSize: '16px' }}>
          {t.depositRequired}
        </strong>
        <p style={hint}>{t.depositRequiredHint(amountLabel)}</p>
        <p style={{ ...hint, marginTop: '8px' }}>{t.depositCardNote}</p>
      </div>
      {error && <p style={errStyle}>{error}</p>}
      <PayButton loading={loading} onClick={handlePayDeposit} amountLabel={amountLabel} t={t} />
    </div>
  )
}

function PayButton({
  loading, onClick, amountLabel, t,
}: {
  loading: boolean
  onClick: () => void
  amountLabel: string
  t: typeof SIGN_UI['fr']
}) {
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
      {loading ? t.redirecting : t.payDeposit(amountLabel)}
    </button>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function box(type: 'success' | 'warning' | 'default'): React.CSSProperties {
  const colors = {
    success: { bg: 'var(--success-bg)',  border: 'var(--success-border)' },
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
  fontSize: '13px', color: 'var(--danger)', margin: '12px 0 0',
}
