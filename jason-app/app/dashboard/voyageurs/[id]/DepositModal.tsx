'use client'

import { useState, useTransition } from 'react'
import { X, LockKey, LockKeyOpen, Warning, CurrencyEur, Copy, Check, PaperPlaneTilt } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

type DepositStatus = 'pending' | 'held' | 'captured' | 'released' | 'failed' | null
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | null

interface Contract {
  id: string
  token: string
  statut: string
  locataire_prenom: string
  locataire_nom: string
  montant_loyer: number | null
  montant_caution: number | null
  stripe_payment_enabled: boolean
  stripe_payment_status: PaymentStatus
  stripe_deposit_status: DepositStatus
}

interface Props {
  contract: Contract
  onClose: () => void
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

const DEPOSIT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'En attente de paiement', color: '#a5c4b0', bg: 'rgba(165,196,176,0.08)' },
  held:     { label: 'Caution retenue ✓',       color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
  captured: { label: 'Encaissée',               color: '#FFD56B', bg: 'rgba(255,213,107,0.08)' },
  released: { label: 'Libérée',                  color: '#6b9a7e', bg: 'rgba(107,154,126,0.08)' },
  failed:   { label: 'Échec paiement',           color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
}

const PAYMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'En attente de paiement', color: '#a5c4b0', bg: 'rgba(165,196,176,0.08)' },
  paid:     { label: 'Réglé ✓',                color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
  refunded: { label: 'Remboursé',              color: '#FFD56B', bg: 'rgba(255,213,107,0.08)' },
  failed:   { label: 'Échec paiement',          color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
}

export default function DepositModal({ contract, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState<'capture' | 'release' | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<'captured' | 'released' | null>(null)
  const [copied, setCopied] = useState<'payment' | 'deposit' | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  function copyLink(type: 'payment' | 'deposit') {
    const url = type === 'payment'
      ? `${APP_URL}/api/stripe/payment/redirect?token=${contract.token}`
      : `${APP_URL}/api/stripe/deposit/redirect?token=${contract.token}`

    const doFallback = () => {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
      } finally {
        document.body.removeChild(ta)
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
      }).catch(doFallback)
    } else {
      doFallback()
    }
  }

  async function handleResend() {
    setResending(true)
    setResent(false)
    try {
      const res = await fetch('/api/contracts/resend-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contract.id }),
      })
      if (res.ok) {
        setResent(true)
        setTimeout(() => setResent(false), 4000)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Erreur lors de l\'envoi.')
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setResending(false)
    }
  }

  const depositStatus = contract.stripe_deposit_status
  const paymentStatus = contract.stripe_payment_status
  const depositAmount = Number(contract.montant_caution ?? 0)
  const paymentAmount = Number(contract.montant_loyer ?? 0)
  const depositStatusMeta = depositStatus ? DEPOSIT_LABELS[depositStatus] : null
  const paymentStatusMeta = paymentStatus ? PAYMENT_LABELS[paymentStatus] : null
  // Keep backward-compat alias
  const amount = depositAmount

  async function handleAction(type: 'capture' | 'release') {
    setError('')
    setAction(type)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/stripe/deposit/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contract_id: contract.id }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Une erreur est survenue.')
        } else {
          setDone(type === 'capture' ? 'captured' : 'released')
          router.refresh()
        }
      } catch {
        setError('Erreur réseau. Réessayez.')
      } finally {
        setAction(null)
      }
    })
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <div>
            <p style={tag}>Paiements</p>
            <h3 style={title}>
              {contract.locataire_prenom} {contract.locataire_nom}
            </h3>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>

        <div style={body}>

          {/* ── Paiement réservation ─────────────────────────────────────── */}
          {contract.stripe_payment_enabled && (
            <div style={{ marginBottom: '20px' }}>
              <p style={sectionLabel}>
                <CurrencyEur size={13} weight="bold" />
                Paiement de la réservation
              </p>
              <div style={{ ...amountBox, borderColor: 'rgba(255,213,107,0.25)', background: 'rgba(255,213,107,0.06)' }}>
                <p style={{ ...amountLabel, color: '#FFD56B' }}>Loyer total</p>
                <p style={amountValue}>{paymentAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
              </div>
              {paymentStatusMeta ? (
                <div style={{ background: paymentStatusMeta.bg, borderRadius: '10px', padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: paymentStatusMeta.color, fontWeight: 500 }}>
                    {paymentStatusMeta.label}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={hint}>Le paiement en ligne n&apos;a pas encore été effectué par le locataire.</p>
                  <div style={linkRow}>
                    <button onClick={() => copyLink('payment')} style={copyBtn}>
                      {copied === 'payment' ? <Check size={13} weight="bold" /> : <Copy size={13} />}
                      {copied === 'payment' ? 'Lien copié !' : 'Copier le lien'}
                    </button>
                    <a href={`${APP_URL}/api/stripe/payment/redirect?token=${contract.token}`} target="_blank" rel="noopener noreferrer" style={viewLink}>
                      Voir →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Dépôt de garantie ────────────────────────────────────────── */}
          {depositAmount > 0 && (
            <div>
              <p style={sectionLabel}>
                <LockKey size={13} weight="bold" />
                Dépôt de garantie (caution)
              </p>

              <div style={amountBox}>
                <p style={amountLabel}>Montant de la caution</p>
                <p style={amountValue}>{depositAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
              </div>

              {depositStatusMeta && (
                <div style={{ background: depositStatusMeta.bg, borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: depositStatusMeta.color, fontWeight: 500 }}>
                    {depositStatusMeta.label}
                  </p>
                </div>
              )}

              {/* Actions si caution retenue */}
              {depositStatus === 'held' && !done && (
                <>
                  <p style={hint}>
                    La carte de {contract.locataire_prenom} est bloquée. Choisissez une action :
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                    <button
                      onClick={() => handleAction('capture')}
                      disabled={isPending}
                      style={captureBtn}
                    >
                      <LockKey size={16} weight="fill" />
                      {action === 'capture' ? 'Encaissement…' : `Encaisser ${depositAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                    </button>
                    <button
                      onClick={() => handleAction('release')}
                      disabled={isPending}
                      style={releaseBtn}
                    >
                      <LockKeyOpen size={16} />
                      {action === 'release' ? 'Libération…' : 'Libérer la caution (séjour sans dommages)'}
                    </button>
                  </div>
                  <p style={legal}>
                    L&apos;encaissement est définitif. La libération annule le blocage carte immédiatement.
                  </p>
                </>
              )}

              {done === 'captured' && (
                <div style={successBox}>
                  <strong style={{ color: '#FFD56B' }}>Caution encaissée ✓</strong>
                  <p style={hint}>Le montant a été transféré vers votre compte Stripe.</p>
                </div>
              )}
              {done === 'released' && (
                <div style={successBox}>
                  <strong style={{ color: '#34D399' }}>Caution libérée ✓</strong>
                  <p style={hint}>Le blocage carte a été annulé. Le locataire est libéré.</p>
                </div>
              )}

              {depositStatus === 'captured' && !done && (
                <p style={hint}>La caution a déjà été encaissée sur votre compte Stripe.</p>
              )}
              {depositStatus === 'released' && !done && (
                <p style={hint}>La caution a été libérée. Le locataire n&apos;a pas été débité.</p>
              )}
              {(depositStatus === 'pending' || !depositStatus) && (
                <div>
                  <p style={hint}>La caution n&apos;a pas encore été payée par le locataire.</p>
                  <div style={linkRow}>
                    <button onClick={() => copyLink('deposit')} style={copyBtn}>
                      {copied === 'deposit' ? <Check size={13} weight="bold" /> : <Copy size={13} />}
                      {copied === 'deposit' ? 'Lien copié !' : 'Copier le lien'}
                    </button>
                    <a href={`${APP_URL}/api/stripe/deposit/redirect?token=${contract.token}`} target="_blank" rel="noopener noreferrer" style={viewLink}>
                      Voir →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pas de paiements configurés */}
          {!contract.stripe_payment_enabled && depositAmount <= 0 && (
            <p style={hint}>Aucun paiement en ligne configuré pour ce contrat.</p>
          )}

          {/* Renvoyer l'email au voyageur */}
          {((!paymentStatus || paymentStatus === 'pending') || (!depositStatus || depositStatus === 'pending')) && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border, #1e3d2f)' }}>
              {resent ? (
                <div style={{ ...successBox, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} weight="bold" color="#34D399" />
                  <p style={{ margin: 0, fontSize: '13px', color: '#34D399', fontWeight: 500 }}>
                    Email renvoyé à {contract.locataire_prenom} {contract.locataire_nom} ✓
                  </p>
                </div>
              ) : (
                <button onClick={handleResend} disabled={resending} style={resendBtn}>
                  <PaperPlaneTilt size={14} weight="fill" />
                  {resending ? 'Envoi en cours…' : `Renvoyer l'email au voyageur`}
                </button>
              )}
            </div>
          )}

          {error && (
            <div style={errorBox}>
              <Warning size={14} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 500,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
}

const modal: React.CSSProperties = {
  background: 'var(--bg-2, #0f2018)',
  border: '1px solid var(--border-2, #1e3d2f)',
  borderRadius: '20px',
  width: '100%', maxWidth: '460px',
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
}

const header: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  padding: '20px 22px 16px',
  borderBottom: '1px solid var(--border, #1e3d2f)',
}

const tag: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '1px',
  textTransform: 'uppercase', color: '#a29bfe', margin: '0 0 4px',
}

const title: React.CSSProperties = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '18px', fontWeight: 400,
  color: 'var(--text, #f0ebe1)', margin: 0,
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-3, #6b9a7e)', padding: '4px',
}

const body: React.CSSProperties = {
  padding: '20px 22px 24px',
}

const sectionLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '11px', fontWeight: 600, letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#6b9a7e', margin: '0 0 10px',
}

const amountBox: React.CSSProperties = {
  background: 'rgba(99,91,255,0.08)',
  border: '1px solid rgba(99,91,255,0.2)',
  borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
}

const amountLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '1px',
  textTransform: 'uppercase', color: '#a29bfe', margin: '0 0 4px',
}

const amountValue: React.CSSProperties = {
  fontSize: '28px', fontWeight: 700, color: '#f0ebe1', margin: 0,
  fontVariantNumeric: 'tabular-nums',
}

const hint: React.CSSProperties = {
  fontSize: '13px', color: '#a5c4b0', lineHeight: 1.6, margin: '0 0 12px',
}

const captureBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '100%', padding: '13px',
  background: 'rgba(255,213,107,0.12)',
  border: '1px solid rgba(255,213,107,0.3)',
  borderRadius: '12px',
  fontSize: '14px', fontWeight: 600, color: '#FFD56B',
  cursor: 'pointer',
}

const releaseBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '100%', padding: '13px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: '12px',
  fontSize: '14px', fontWeight: 600, color: '#34D399',
  cursor: 'pointer',
}

const legal: React.CSSProperties = {
  fontSize: '11px', color: '#4a7260', lineHeight: 1.6, margin: 0,
}

const successBox: React.CSSProperties = {
  background: 'rgba(52,211,153,0.06)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '10px', padding: '14px',
}

const errorBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontSize: '13px', color: '#ef4444',
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: '8px', padding: '10px 14px', marginTop: '12px',
}

const linkRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
}

const copyBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', borderRadius: '10px',
  background: 'rgba(162,155,254,0.12)',
  border: '1px solid rgba(162,155,254,0.25)',
  color: '#a29bfe', fontSize: '13px', fontWeight: 500,
  cursor: 'pointer',
}

const viewLink: React.CSSProperties = {
  fontSize: '13px', color: '#6b9a7e',
  textDecoration: 'none', display: 'inline-block',
}

const resendBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '100%', padding: '11px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: '12px',
  fontSize: '13px', fontWeight: 500, color: '#34D399',
  cursor: 'pointer',
}
