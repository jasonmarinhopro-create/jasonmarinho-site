'use client'

// Caution du voyageur (empreinte bancaire). Refonte du 05/10/2026 : Jason
// et ses hôtes avaient peur que la carte soit débitée. La page explique en
// 3 temps ce qui se passe (blocage sans débit, décision du propriétaire après
// le départ, fin automatique au plus tard 7 jours après), avec la date exacte
// donnée par la banque quand Stripe la connaît (capture_before).

import { useState } from 'react'
import { LockKey, House, ClockCountdown, ShieldCheck, CheckCircle, HourglassMedium, Info } from '@phosphor-icons/react/dist/ssr'
import { SIGN_UI, formatDateLang, type UiLang } from '@/lib/sign-ui-i18n'
import type { DepositWindowState } from '@/lib/stripe/deposit-window'

interface Props {
  token: string
  amount: number
  depositParam?: string
  depositAlreadyHeld: boolean
  /** Statut lu chez Stripe : held, captured, released, expired, pending… */
  status?: string | null
  /** Fin du blocage donnée par la banque (ISO), si connue */
  holdUntil?: string | null
  /** Somme retenue par le propriétaire et motif */
  captured?: { amount: number; reason: string | null } | null
  /** Le lien ne s'ouvre que 2 jours avant l'arrivée (lib/stripe/deposit-window.ts) */
  windowState: DepositWindowState
  opensOn: string
  lang: UiLang
}

const money = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export default function DepositSection({ token, amount, depositParam, depositAlreadyHeld, status, holdUntil, captured, windowState, opensOn, lang }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = SIGN_UI[lang]
  const amountLabel = money(amount)

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

  // Encaissée (en tout ou partie) par le propriétaire
  if (status === 'captured') {
    return (
      <div style={box('warning')}>
        <Head icon={<Info size={22} weight="fill" color="#FFD56B" />} title={t.depositCapturedTitle} color="#FFD56B" />
        <p style={hint}>
          {captured ? t.depositCapturedHint(money(captured.amount), captured.reason) : t.depositCapturedHint(amountLabel, null)}
        </p>
      </div>
    )
  }

  // Carte bloquée
  if (depositAlreadyHeld) {
    const until = holdUntil ? formatDateLang(holdUntil, lang) : null
    return (
      <div style={box('success')}>
        <Head icon={<CheckCircle size={22} weight="fill" color="var(--success-1)" />} title={t.depositRegistered} color="var(--success-1)" />
        <p style={hint}>{t.depositRegisteredHint(amountLabel)}</p>
        <p style={{ ...hint, marginTop: '8px' }}>{until ? t.depositHeldUntil(until) : t.depositStep3}</p>
        <Secure t={t} />
      </div>
    )
  }

  // Levée par le propriétaire
  if (status === 'released') {
    return (
      <div style={box('success')}>
        <Head icon={<CheckCircle size={22} weight="fill" color="var(--success-1)" />} title={t.depositReleasedTitle} color="var(--success-1)" />
        <p style={hint}>{t.depositReleasedHint}</p>
      </div>
    )
  }

  // Retour de Stripe, confirmation de la banque pas encore reçue : jamais de
  // bouton ici (sinon la carte pourrait être bloquée deux fois)
  if (depositParam === 'success') {
    return (
      <div style={box('warning')}>
        <Head icon={<HourglassMedium size={22} weight="fill" color="#FFD56B" />} title={t.depositProcessingTitle} color="#FFD56B" />
        <p style={hint}>{t.depositProcessingHint}</p>
      </div>
    )
  }

  // Séjour terminé
  if (windowState === 'closed') {
    return (
      <div style={box('default')}>
        <Head title={status === 'expired' ? t.depositExpiredTitle : t.depositClosed} />
        <p style={hint}>{status === 'expired' ? t.depositExpiredHint : t.depositClosedHint}</p>
      </div>
    )
  }

  // Trop tôt : la carte ne resterait pas bloquée jusqu'au séjour
  if (windowState === 'not_yet') {
    return (
      <div style={box('default')}>
        <Head icon={<LockKey size={22} weight="fill" color="#FFD56B" />} title={t.depositNotYet} />
        <p style={hint}>{t.depositNotYetHint(amountLabel, formatDateLang(`${opensOn}T12:00:00Z`, lang))}</p>
        <HowItWorks t={t} amountLabel={amountLabel} />
        <Secure t={t} />
      </div>
    )
  }

  // Invite à valider la caution (aussi après une annulation ou un blocage terminé)
  return (
    <div style={box(depositParam === 'cancel' ? 'warning' : 'default')}>
      <Head
        icon={<LockKey size={22} weight="fill" color="#FFD56B" />}
        title={depositParam === 'cancel' ? t.depositCancelled : status === 'expired' ? t.depositExpiredTitle : t.depositRequired}
      />
      <p style={hint}>
        {depositParam === 'cancel' ? t.depositCancelledHint : status === 'expired' ? t.depositExpiredHint : t.depositRequiredHint(amountLabel)}
      </p>
      <HowItWorks t={t} amountLabel={amountLabel} />
      {error && <p style={errStyle}>{error}</p>}
      <button
        onClick={handlePayDeposit}
        disabled={loading}
        style={{
          display: 'block', width: '100%',
          padding: '14px 20px',
          background: loading ? 'rgba(255,213,107,0.15)' : 'rgba(255,213,107,0.18)',
          border: '1px solid rgba(255,213,107,0.4)',
          borderRadius: '12px',
          fontSize: '15px', fontWeight: 600, fontFamily: 'inherit',
          color: loading ? '#b89a3e' : '#FFD56B',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? t.redirecting : t.payDeposit(amountLabel)}
      </button>
      <Secure t={t} />
    </div>
  )
}

function Head({ icon, title, color = '#f0ebe1' }: { icon?: React.ReactNode; title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      {icon}
      <strong style={{ color, fontSize: '16px', lineHeight: 1.35 }}>{title}</strong>
    </div>
  )
}

function HowItWorks({ t, amountLabel }: { t: typeof SIGN_UI['fr']; amountLabel: string }) {
  const steps = [
    { icon: <LockKey size={18} weight="fill" />, title: t.depositStep1Title, text: t.depositStep1(amountLabel) },
    { icon: <House size={18} weight="fill" />, title: t.depositStep2Title, text: t.depositStep2(amountLabel) },
    { icon: <ClockCountdown size={18} weight="fill" />, title: t.depositStep3Title, text: t.depositStep3 },
  ]
  return (
    <div style={{ margin: '16px 0 18px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFD56B', margin: '0 0 10px' }}>
        {t.depositHowTitle}
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px' }}>
        {steps.map((s, i) => (
          <li key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e3d2f', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#63D683' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99,214,131,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </span>
              <strong style={{ fontSize: '13.5px', color: '#f0ebe1', lineHeight: 1.3 }}>{s.title}</strong>
            </div>
            <p style={{ ...hint, fontSize: '12.5px', lineHeight: 1.6 }}>{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Secure({ t }: { t: typeof SIGN_UI['fr'] }) {
  return (
    <p style={{ ...hint, fontSize: '12px', marginTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
      <ShieldCheck size={15} weight="fill" color="#63D683" style={{ flexShrink: 0, marginTop: '2px' }} />
      <span>{t.depositSecure}</span>
    </p>
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
    borderRadius: '16px', padding: 'clamp(18px, 4vw, 24px) clamp(16px, 4vw, 28px)',
    marginBottom: '24px',
  }
}

const hint: React.CSSProperties = {
  fontSize: '13px', color: '#a5c4b0', lineHeight: 1.7, margin: 0,
}

const errStyle: React.CSSProperties = {
  fontSize: '13px', color: 'var(--danger)', margin: '0 0 12px',
}
