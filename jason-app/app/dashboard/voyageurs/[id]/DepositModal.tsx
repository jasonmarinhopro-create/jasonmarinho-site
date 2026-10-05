'use client'

import { useState, useTransition } from 'react'
import { X, LockKey, LockKeyOpen, Warning, CurrencyEur, Copy, Check, PaperPlaneTilt, Bank, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useRouter } from 'next/navigation'
import { depositWindow, depositOpensOn, depositActBefore, holdMayExpireBeforeCheckout } from '@/lib/stripe/deposit-window'

const fmtDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

type DepositStatus = 'pending' | 'held' | 'captured' | 'released' | 'expired' | 'failed' | null
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | null

interface Contract {
  id: string
  token: string
  statut: string
  locataire_prenom: string
  locataire_nom: string
  montant_loyer: number | null
  montant_caution: number | null
  modalites_paiement: string | null
  stripe_payment_enabled: boolean
  stripe_payment_status: PaymentStatus
  stripe_deposit_status: DepositStatus
  date_arrivee: string
  date_depart: string
}

interface Props {
  contract: Contract
  hostIban: string | null
  hostBic: string | null
  onClose: () => void
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'

const DEPOSIT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'En attente de paiement', color: 'var(--text-2)', bg: 'var(--bg-2)' },
  held:     { label: 'Carte bloquée, rien n’a été débité', color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  captured: { label: 'Somme retenue',           color: '#8A5A12', bg: 'rgba(255,213,107,0.08)' },
  released: { label: 'Libérée : rien n’a été prélevé', color: 'var(--text-2)', bg: 'var(--bg-2)' },
  expired:  { label: 'Expirée : la carte n’est plus bloquée', color: '#8A5A12', bg: 'color-mix(in srgb, #B7791F 10%, transparent)' },
  failed:   { label: 'Échec paiement',           color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 8%, transparent)' },
}

const PAYMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'En attente de paiement', color: 'var(--text-2)', bg: 'var(--bg-2)' },
  paid:     { label: 'Réglé',                color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  refunded: { label: 'Remboursé',              color: '#8A5A12', bg: 'rgba(255,213,107,0.08)' },
  failed:   { label: 'Échec paiement',          color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 8%, transparent)' },
}

export default function DepositModal({ contract, hostIban, hostBic, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState<'capture' | 'release' | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<'captured' | 'released' | null>(null)
  const [copied, setCopied] = useState<'payment' | 'deposit' | 'iban' | 'bic' | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  // Retenue : formulaire montant + motif avant tout encaissement (05/10/2026)
  const [keepOpen, setKeepOpen] = useState(false)
  const [keepAmount, setKeepAmount] = useState('')
  const [keepReason, setKeepReason] = useState('')
  const { confirm, dialog } = useConfirm()

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

  function copyText(text: string, field: 'iban' | 'bic') {
    const doFallback = () => {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(field)
        setTimeout(() => setCopied(null), 2000)
      } finally {
        document.body.removeChild(ta)
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(field)
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
      setError('Erreur réseau. Réessaie.')
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
  // Calendrier de la caution (lib/stripe/deposit-window.ts) : lien ouvert de
  // J-2 au départ, carte bloquée ~7 jours
  const depositState = depositWindow(contract.date_arrivee, contract.date_depart)
  const opensLabel = fmtDay(depositOpensOn(contract.date_arrivee))
  const actBeforeLabel = fmtDay(depositActBefore(contract.date_arrivee))
  const longStay = holdMayExpireBeforeCheckout(contract.date_arrivee, contract.date_depart)

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const keepValue = keepAmount.trim() === '' ? depositAmount : Math.round(Number(keepAmount.replace(',', '.')) * 100) / 100
  const keepValid = Number.isFinite(keepValue) && keepValue > 0 && keepValue <= depositAmount && keepReason.trim().length >= 3

  async function handleAction(type: 'capture' | 'release') {
    setError('')
    if (type === 'release') {
      const ok = await confirm({
        title: 'Libérer la caution ?',
        message: `Le blocage de ${fmt(depositAmount)} € est levé tout de suite et ${contract.locataire_prenom} reçoit un e-mail : rien n’est prélevé. Tu ne pourras plus rien retenir ensuite.`,
        confirmLabel: 'Libérer la caution',
      })
      if (!ok) return
    }
    setAction(type)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/stripe/deposit/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(type === 'capture'
            ? { contract_id: contract.id, amount: keepValue, motif: keepReason.trim() }
            : { contract_id: contract.id }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Une erreur est survenue.')
        } else {
          setDone(type === 'capture' ? 'captured' : 'released')
          router.refresh()
        }
      } catch {
        setError('Erreur réseau. Réessaie.')
      } finally {
        setAction(null)
      }
    })
  }

  return (
    <div style={overlay}>
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
                <p style={{ ...amountLabel, color: '#8A5A12' }}>Loyer total</p>
                <p style={amountValue}>{paymentAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
              </div>
              {paymentStatusMeta && (
                <div style={{ background: paymentStatusMeta.bg, borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: paymentStatusMeta.color, fontWeight: 500 }}>
                    {paymentStatusMeta.label}
                  </p>
                </div>
              )}
              {paymentStatus !== 'paid' && paymentStatus !== 'refunded' && paymentStatus !== 'failed' && (
                <div>
                  {!paymentStatusMeta && (
                    <p style={hint}>Le paiement en ligne n&apos;a pas encore été effectué par le locataire.</p>
                  )}
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

              {/* Comment ça marche, toujours visible : l'hôte aussi avait peur
                  que la carte soit débitée (05/10/2026) */}
              {depositStatus !== 'captured' && depositStatus !== 'released' && !done && (
                <div style={explainBox}>
                  <ShieldCheck size={16} weight="fill" color="var(--accent-text)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0 }}>
                    <strong>Rien n’est débité au voyageur.</strong> Sa banque bloque la somme jusqu’à ta décision, 7 jours au plus après qu’il l’a validée. Toi seul décides : libérer (rien n’est prélevé) ou retenir une somme justifiée. Sans action de ta part, le blocage tombe tout seul.
                  </p>
                </div>
              )}

              {/* Actions si la carte est bloquée */}
              {depositStatus === 'held' && !done && (
                <>
                  <p style={hint}>
                    Décide au plus tard le <strong>{actBeforeLabel}</strong>, après l’état des lieux de sortie.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    <button onClick={() => handleAction('release')} disabled={isPending} style={releaseBtn}>
                      <LockKeyOpen size={16} weight="bold" />
                      {action === 'release' ? 'Libération…' : 'Tout va bien : libérer la caution'}
                    </button>
                    {!keepOpen && (
                      <button onClick={() => { setKeepOpen(true); setKeepAmount(fmt(depositAmount).replace(/\s/g, '')) }} disabled={isPending} style={captureBtn}>
                        <LockKey size={16} weight="fill" />
                        Dommages constatés : retenir une somme
                      </button>
                    )}
                  </div>
                  {keepOpen && (
                    <div style={keepBox}>
                      <p style={{ ...sectionLabel, margin: '0 0 8px' }}>Retenir une somme</p>
                      <label style={fieldLabel} htmlFor="keep-amount">Montant à retenir (max {fmt(depositAmount)} €)</label>
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input id="keep-amount" inputMode="decimal" value={keepAmount} onChange={e => setKeepAmount(e.target.value)} style={{ ...field, paddingRight: '30px' }} />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '14px' }}>€</span>
                      </div>
                      <label style={fieldLabel} htmlFor="keep-reason">Motif (envoyé au voyageur)</label>
                      <textarea id="keep-reason" value={keepReason} onChange={e => setKeepReason(e.target.value.slice(0, 300))} rows={3}
                        placeholder="Ex. : verre de la table basse cassé, devis de remplacement joint par e-mail"
                        style={{ ...field, resize: 'vertical', minHeight: '76px' }} />
                      <p style={{ ...legal, margin: '8px 0 12px' }}>
                        Définitif. {Number.isFinite(keepValue) && keepValue > 0 && keepValue < depositAmount ? `Le reste (${fmt(depositAmount - keepValue)} €) est libéré tout de suite. ` : ''}
                        {contract.locataire_prenom} reçoit un e-mail avec le montant et le motif. Garde tes preuves (photos, factures ou devis) : le contrat prévoit de les lui transmettre.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleAction('capture')} disabled={isPending || !keepValid} style={{ ...captureBtn, flex: '1 1 200px', width: 'auto', opacity: keepValid ? 1 : 0.55, cursor: keepValid ? 'pointer' : 'not-allowed' }}>
                          {action === 'capture' ? 'Retenue en cours…' : `Retenir ${Number.isFinite(keepValue) ? fmt(keepValue) : '…'} €`}
                        </button>
                        <button onClick={() => setKeepOpen(false)} disabled={isPending} style={cancelBtn}>Annuler</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {done === 'captured' && (
                <div style={successBox}>
                  <strong style={{ color: '#8A5A12' }}>Somme retenue</strong>
                  <p style={{ ...hint, margin: '4px 0 0' }}>{fmt(keepValue)} € versés sur ton compte Stripe{keepValue < depositAmount ? ', le reste est libéré' : ''}. {contract.locataire_prenom} a reçu un e-mail.</p>
                </div>
              )}
              {done === 'released' && (
                <div style={successBox}>
                  <strong style={{ color: 'var(--accent-text)' }}>Caution libérée</strong>
                  <p style={{ ...hint, margin: '4px 0 0' }}>Le blocage est levé, rien n’a été prélevé. {contract.locataire_prenom} a reçu un e-mail.</p>
                </div>
              )}

              {depositStatus === 'captured' && !done && (
                <p style={hint}>Une somme a déjà été retenue et versée sur ton compte Stripe ; le reste du blocage a été levé.</p>
              )}
              {depositStatus === 'released' && !done && (
                <p style={hint}>Le blocage a été levé : le voyageur n&apos;a rien payé.</p>
              )}
              {longStay && depositStatus !== 'captured' && depositStatus !== 'released' && (
                <p style={{ ...hint, color: '#8A5A12' }}>
                  <Warning size={13} weight="fill" style={{ verticalAlign: '-2px', marginRight: '5px' }} />
                  Séjour de plus de 4 nuits : la carte ne reste bloquée qu&apos;environ 7 jours, elle sera débloquée avant l&apos;état des lieux de sortie. Pour ce séjour, une caution par virement est plus sûre.
                </p>
              )}
              {depositStatus === 'expired' && depositState === 'open' && (
                <p style={hint}>Le séjour n&apos;est pas terminé : renvoie le lien au voyageur pour bloquer à nouveau sa carte.</p>
              )}
              {(depositStatus === 'pending' || depositStatus === 'expired' || !depositStatus) && depositState !== 'closed' && (
                <div>
                  <p style={hint}>
                    {depositState === 'not_yet'
                      ? <>Le lien de caution s&apos;ouvre le <strong>{opensLabel}</strong>, 2 jours avant l&apos;arrivée, et part automatiquement par email au voyageur ce jour-là. Plus tôt, le blocage de la carte tomberait avant le séjour.</>
                      : depositStatus === 'expired' ? null : <>La caution n&apos;a pas encore été payée par le locataire.</>}
                  </p>
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

          {/* ── Virement bancaire ────────────────────────────────────────── */}
          {hostIban && !contract.stripe_payment_enabled && (
            <div style={{ marginBottom: '20px' }}>
              <p style={sectionLabel}>
                <Bank size={13} weight="bold" />
                Coordonnées bancaires (virement)
              </p>
              <div style={ibanBox}>
                <IbanField label="IBAN" value={hostIban} field="iban" copied={copied} onCopy={copyText} />
                {hostBic && <IbanField label="BIC / SWIFT" value={hostBic} field="bic" copied={copied} onCopy={copyText} />}
              </div>
              <p style={{ ...hint, marginTop: '8px', marginBottom: 0 }}>
                Le voyageur peut effectuer le virement directement vers ce compte.
              </p>
            </div>
          )}

          {/* Pas de paiements configurés */}
          {!contract.stripe_payment_enabled && depositAmount <= 0 && !hostIban && (
            <p style={hint}>Aucun paiement en ligne configuré pour ce contrat.</p>
          )}

          {/* Renvoyer l'email au voyageur */}
          {((!paymentStatus || paymentStatus === 'pending') || (!depositStatus || depositStatus === 'pending')) && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {resent ? (
                <div style={{ ...successBox, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} weight="bold" color="var(--accent-text)" />
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--accent-text)', fontWeight: 500 }}>
                    E-mail renvoyé à {contract.locataire_prenom} {contract.locataire_nom}
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

          {dialog}
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
  background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--s-4)',
  animation: 'fadeIn var(--d-base) var(--ease-smooth)',
}

const modal: React.CSSProperties = {
  background: 'var(--bg-2)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-xl)',
  width: '100%', maxWidth: '460px',
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: 'var(--shadow-xl)',
  animation: 'scaleIn var(--d-base) var(--ease-out)',
}

const header: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  padding: '20px 22px 16px',
  borderBottom: '1px solid var(--border)',
}

const tag: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '1px',
  textTransform: 'uppercase', color: 'var(--accent-text)', margin: '0 0 4px',
}

const title: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), Georgia, serif',
  fontSize: '18px', fontWeight: 400,
  color: 'var(--text)', margin: 0,
}

const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-3)', padding: '4px',
}

const body: React.CSSProperties = {
  padding: '20px 22px 24px',
}

const sectionLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '11px', fontWeight: 600, letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: 'var(--text-2)', margin: '0 0 10px',
}

const amountBox: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-2)',
  borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
}

const amountLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '1px',
  textTransform: 'uppercase', color: 'var(--text-2)', margin: '0 0 4px',
}

const amountValue: React.CSSProperties = {
  fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0,
  fontVariantNumeric: 'tabular-nums',
}

const hint: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px',
}

const captureBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '100%', padding: '13px',
  background: 'rgba(255,213,107,0.12)',
  border: '1px solid rgba(255,213,107,0.3)',
  borderRadius: '12px',
  fontSize: '14px', fontWeight: 600, color: '#8A5A12',
  cursor: 'pointer',
}

const releaseBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '100%', padding: '13px',
  background: 'var(--accent-bg)',
  border: '1px solid color-mix(in srgb, var(--accent-text) 20%, transparent)',
  borderRadius: '12px',
  fontSize: '14px', fontWeight: 600, color: 'var(--accent-text)',
  cursor: 'pointer',
}

const explainBox: React.CSSProperties = {
  display: 'flex', gap: '8px', alignItems: 'flex-start',
  fontSize: '12.5px', lineHeight: 1.6, color: 'var(--text-2)',
  background: 'var(--accent-bg)',
  border: '1px solid color-mix(in srgb, var(--accent-text) 18%, transparent)',
  borderRadius: '10px', padding: '10px 12px', marginBottom: '14px',
}

const keepBox: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid rgba(183,121,31,0.35)',
  borderRadius: '12px', padding: '14px', marginBottom: '14px',
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', margin: '0 0 5px',
}

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: '10px',
  fontSize: '15px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
}

const cancelBtn: React.CSSProperties = {
  padding: '12px 16px', borderRadius: '12px', background: 'transparent',
  border: '1px solid var(--border-2)', color: 'var(--text-2)', fontSize: '14px', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
}

const legal: React.CSSProperties = {
  fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.6, margin: 0,
}

const successBox: React.CSSProperties = {
  background: 'var(--accent-bg)',
  border: '1px solid color-mix(in srgb, var(--accent-text) 15%, transparent)',
  borderRadius: '10px', padding: '14px',
}

const errorBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontSize: '13px', color: 'var(--danger)',
  background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
  border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
  borderRadius: '8px', padding: '10px 14px', marginTop: '12px',
}

const linkRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
}

const copyBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', borderRadius: '10px',
  background: 'color-mix(in srgb, var(--accent-text) 12%, transparent)',
  border: '1px solid color-mix(in srgb, var(--accent-text) 25%, transparent)',
  color: 'var(--accent-text)', fontSize: '13px', fontWeight: 500,
  cursor: 'pointer',
}

const viewLink: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text-3)',
  textDecoration: 'none', display: 'inline-block',
}

const resendBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  width: '100%', padding: '11px',
  background: 'var(--accent-bg)',
  border: '1px solid color-mix(in srgb, var(--accent-text) 20%, transparent)',
  borderRadius: '12px',
  fontSize: '13px', fontWeight: 500, color: 'var(--accent-text)',
  cursor: 'pointer',
}

const ibanBox: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '2px',
}

// ─── IbanField helper ────────────────────────────────────────────────────────

function IbanField({
  label, value, field, copied, onCopy,
}: {
  label: string
  value: string
  field: 'iban' | 'bic'
  copied: string | null
  onCopy: (text: string, field: 'iban' | 'bic') => void
}) {
  const isCopied = copied === field
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      padding: '10px 14px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-2)', margin: '0 0 3px' }}>
          {label}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, fontFamily: 'monospace', letterSpacing: '0.5px', wordBreak: 'break-all' }}>
          {value}
        </p>
      </div>
      <button
        onClick={() => onCopy(value, field)}
        style={{
          flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', borderRadius: '8px',
          background: isCopied ? 'var(--accent-border)' : 'color-mix(in srgb, var(--accent-text) 20%, transparent)',
          border: isCopied ? '1px solid color-mix(in srgb, var(--accent-text) 30%, transparent)' : '1px solid color-mix(in srgb, var(--accent-text) 35%, transparent)',
          fontSize: '12px', fontWeight: 600,
          color: isCopied ? 'var(--accent-text)' : 'var(--accent-text)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {isCopied ? <Check size={11} weight="bold" /> : <Copy size={11} />}
        {isCopied ? 'Copié' : 'Copier'}
      </button>
    </div>
  )
}
