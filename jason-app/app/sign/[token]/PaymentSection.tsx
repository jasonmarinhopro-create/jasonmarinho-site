'use client'

import { useState } from 'react'
import { SIGN_UI, type UiLang } from '@/lib/sign-ui-i18n'

interface Props {
  token: string
  amount: number
  /** true si `amount` n'est qu'un acompte (pas le loyer total) — ajuste le libellé. */
  isPartial?: boolean
  paymentParam?: string
  alreadyPaid: boolean
  lang: UiLang
}

export default function PaymentSection({ token, amount, isPartial, paymentParam, alreadyPaid, lang }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = SIGN_UI[lang]
  const amountLabel = `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`

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

  // Réservation déjà réglée
  if (alreadyPaid) {
    return (
      <div style={box('success')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <strong style={{ color: 'var(--success-1)', display: 'block', marginBottom: '4px' }}>
              {t.paymentDoneTitle(!!isPartial)}
            </strong>
            <p style={hint}>{t.paymentDoneHint(amountLabel, !!isPartial)}</p>
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
          {t.paymentCancelledTitle}
        </strong>
        <p style={hint}>{t.paymentCancelledHint(!!isPartial)}</p>
        <PayButton loading={loading} onClick={handlePayReservation} amountLabel={amountLabel} isPartial={isPartial} t={t} />
        {error && <p style={errStyle}>{error}</p>}
      </div>
    )
  }

  // Invite à payer la réservation
  return (
    <div style={box('default')}>
      <div style={{ marginBottom: '16px' }}>
        <strong style={{ color: '#f0ebe1', display: 'block', marginBottom: '6px', fontSize: '16px' }}>
          {t.payTitle(!!isPartial)}
        </strong>
        <p style={hint}>{t.payHint1(amountLabel, !!isPartial)}</p>
        <p style={{ ...hint, marginTop: '8px' }}>{t.payHint2}</p>
      </div>
      {error && <p style={errStyle}>{error}</p>}
      <PayButton loading={loading} onClick={handlePayReservation} amountLabel={amountLabel} isPartial={isPartial} t={t} />
    </div>
  )
}

function PayButton({
  loading, onClick, amountLabel, isPartial, t,
}: {
  loading: boolean
  onClick: () => void
  amountLabel: string
  isPartial?: boolean
  t: typeof SIGN_UI['fr']
}) {
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
      {loading ? t.redirecting : t.payButton(amountLabel, !!isPartial)}
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
    marginBottom: '16px',
  }
}

const hint: React.CSSProperties = {
  fontSize: '13px', color: '#a5c4b0', lineHeight: 1.7, margin: 0,
}

const errStyle: React.CSSProperties = {
  fontSize: '13px', color: 'var(--danger)', margin: '12px 0 0',
}
