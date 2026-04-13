'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveProfileName } from './actions'
import { Check, User, EnvelopeSimple, PencilSimple, Warning, Lock, Eye, EyeSlash, CreditCard } from '@phosphor-icons/react'

interface Props {
  initialFullName: string
  email: string
  stripeAccountId: string | null
  stripeComplete: boolean
}

export default function ProfilForm({ initialFullName, email, stripeAccountId, stripeComplete }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullNameState] = useState(initialFullName)
  const [firstName, setFirstName] = useState(() => {
    const parts = initialFullName.trim().split(' ')
    return parts[0] ?? ''
  })
  const [lastName, setLastName] = useState(() => {
    const parts = initialFullName.trim().split(' ')
    return parts.slice(1).join(' ') ?? ''
  })
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [editName, setEditName] = useState(false)

  // Mot de passe
  const [editPassword, setEditPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  // Stripe Connect
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState('')
  const stripeStatus = searchParams.get('stripe') // 'success' | 'pending' | 'error'
  const isStripeConnected = !!stripeAccountId && stripeComplete

  async function handleStripeConnect() {
    setStripeLoading(true)
    setStripeError('')
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setStripeError(data.error ?? 'Erreur lors de la connexion Stripe.')
      } else {
        window.location.href = data.url
      }
    } catch {
      setStripeError('Erreur réseau. Réessayez.')
    } finally {
      setStripeLoading(false)
    }
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase()

  function handleSave() {
    setSaveError('')
    const name = [firstName, lastName].filter(Boolean).join(' ')
    startTransition(async () => {
      const result = await saveProfileName(name)
      if (result.error) { setSaveError(result.error); return }
      setFullNameState(name)
      setSaved(true)
      setEditName(false)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    })
  }

  function handleCancel() {
    const parts = fullName.trim().split(' ')
    setFirstName(parts[0] ?? '')
    setLastName(parts.slice(1).join(' ') ?? '')
    setEditName(false)
    setSaveError('')
  }

  async function handlePasswordSave() {
    setPwError('')
    if (newPassword.length < 8) { setPwError('Le mot de passe doit faire au moins 8 caractères.'); return }
    if (newPassword !== confirmPassword) { setPwError('Les mots de passe ne correspondent pas.'); return }
    setPwLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) { setPwError(error.message); return }
    setPwSaved(true)
    setNewPassword('')
    setConfirmPassword('')
    setEditPassword(false)
    setTimeout(() => setPwSaved(false), 3000)
  }

  function handlePasswordCancel() {
    setNewPassword('')
    setConfirmPassword('')
    setPwError('')
    setEditPassword(false)
  }

  return (
    <div style={styles.content} className="fade-up d1">
      {/* Avatar */}
      <div style={styles.avatarSection}>
        <div style={styles.avatarWrap} className="avatar-wrap">
          <div style={styles.avatar}>
            <span style={styles.avatarText}>{initials}</span>
          </div>
          <div className="avatar-shine" />
        </div>
        <div>
          <div style={styles.avatarName}>{displayName || email}</div>
          <div style={styles.avatarSub}>{email}</div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Prénom & Nom */}
      <div style={styles.field}>
        <label style={styles.label}>
          <User size={15} />
          Prénom &amp; Nom
        </label>

        {editName ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={styles.nameRow}>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={styles.input} placeholder="Prénom" autoFocus />
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={styles.input} placeholder="Nom" />
            </div>
            {saveError && <div style={styles.errorBox}><Warning size={14} />{saveError}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handleSave} disabled={isPending} className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
                {saved ? <><Check size={14} weight="bold" /> Sauvegardé</> : isPending ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              <button onClick={handleCancel} style={styles.cancelBtn}>Annuler</button>
            </div>
          </div>
        ) : (
          <div style={styles.valueRow}>
            <span style={styles.value}>
              {displayName || <span style={{ color: 'var(--text-muted)' }}>Non renseigné</span>}
            </span>
            <button onClick={() => setEditName(true)} style={styles.editBtn}>
              <PencilSimple size={14} />
              Modifier
            </button>
          </div>
        )}
      </div>

      <div style={styles.divider} />

      {/* Email */}
      <div style={styles.field}>
        <label style={styles.label}>
          <EnvelopeSimple size={15} />
          Adresse e-mail
        </label>
        <div style={styles.valueRow}>
          <span style={styles.value}>{email}</span>
          <span style={styles.readOnly}>Non modifiable</span>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Stripe Connect */}
      <div style={styles.field}>
        <label style={styles.label}>
          <CreditCard size={15} />
          Paiements &amp; Cautions (Stripe)
        </label>

        {/* Bannière retour Stripe */}
        {stripeStatus === 'success' && (
          <div style={stripeBanner('success')}>
            <Check size={14} weight="bold" />
            Compte Stripe connecté avec succès ! Vous pouvez maintenant collecter des cautions.
          </div>
        )}
        {stripeStatus === 'pending' && (
          <div style={stripeBanner('pending')}>
            Finalisation en cours... Revenez ici une fois votre onboarding Stripe terminé.
          </div>
        )}
        {stripeStatus === 'error' && (
          <div style={stripeBanner('error')}>
            Une erreur est survenue. Réessayez depuis ce bouton.
          </div>
        )}

        {isStripeConnected ? (
          <div style={styles.valueRow}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ ...styles.value, color: '#34D399' }}>Compte connecté</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 0 16px' }}>
                {stripeAccountId}
              </p>
            </div>
            <button onClick={handleStripeConnect} disabled={stripeLoading} style={styles.editBtn}>
              {stripeLoading ? 'Chargement...' : 'Gérer'}
            </button>
          </div>
        ) : stripeAccountId && !stripeComplete ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD56B', display: 'inline-block' }} />
              <span style={{ fontSize: '14px', color: '#FFD56B' }}>Onboarding incomplet</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px' }}>
              Finalisez la configuration de votre compte Stripe pour activer les cautions.
            </p>
            <button onClick={handleStripeConnect} disabled={stripeLoading} style={stripeBtn}>
              {stripeLoading ? 'Chargement...' : 'Finaliser mon compte Stripe →'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '14px' }}>
              Connectez un compte Stripe pour collecter les cautions directement depuis vos contrats.
              La carte de vos locataires est bloquée à la signature — vous encaissez uniquement en cas de dommages.
            </p>
            {stripeError && (
              <div style={{ ...styles.errorBox, marginBottom: '12px' }}>
                <Warning size={14} />{stripeError}
              </div>
            )}
            <button onClick={handleStripeConnect} disabled={stripeLoading} style={stripeBtn}>
              {stripeLoading ? 'Connexion en cours...' : 'Connecter mon compte Stripe →'}
            </button>
          </div>
        )}
      </div>

      <div style={styles.divider} />

      {/* Mot de passe */}
      <div style={styles.field}>
        <label style={styles.label}>
          <Lock size={15} />
          Mot de passe
        </label>

        {editPassword ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Nouveau mot de passe */}
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ ...styles.input, width: '100%', paddingRight: '44px', boxSizing: 'border-box' }}
                placeholder="Nouveau mot de passe"
                autoFocus
              />
              <button type="button" onClick={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                {showNew ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Confirmation */}
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ ...styles.input, width: '100%', paddingRight: '44px', boxSizing: 'border-box' }}
                placeholder="Confirmer le mot de passe"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                {showConfirm ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwError && <div style={styles.errorBox}><Warning size={14} />{pwError}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handlePasswordSave} disabled={pwLoading} className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
                {pwSaved ? <><Check size={14} weight="bold" /> Modifié</> : pwLoading ? 'Mise à jour...' : 'Enregistrer'}
              </button>
              <button onClick={handlePasswordCancel} style={styles.cancelBtn}>Annuler</button>
            </div>
          </div>
        ) : (
          <div style={styles.valueRow}>
            <span style={styles.value}>••••••••</span>
            <button onClick={() => setEditPassword(true)} style={styles.editBtn}>
              <PencilSimple size={14} />
              Modifier
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: 'clamp(24px,3vw,40px)',
    maxWidth: '600px',
  },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' },
  avatarWrap: { position: 'relative', width: '64px', height: '64px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden' },
  avatar: { width: '64px', height: '64px', background: 'rgba(0,76,63,0.5)', border: '2px solid rgba(255,213,107,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 600, color: 'var(--accent-text)' },
  avatarName: { fontSize: '17px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' },
  avatarSub: { fontSize: '13px', color: 'var(--text-3)' },
  divider: { height: '1px', background: 'var(--border)', margin: '0 0 24px' },
  field: { marginBottom: '24px' },
  label: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' },
  valueRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  value: { fontSize: '15px', color: 'var(--text)', fontWeight: 400 },
  editBtn: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-3)', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' },
  nameRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: '140px', background: 'var(--border)', border: '1px solid rgba(255,213,107,0.3)', borderRadius: '10px', padding: '10px 14px', fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: 'var(--text)', outline: 'none' },
  cancelBtn: { fontSize: '13px', fontWeight: 400, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '8px', padding: '10px 14px' },
  readOnly: { fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--surface-2)', borderRadius: '6px', padding: '4px 10px' },
  eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px', display: 'flex', alignItems: 'center' },
}

const stripeBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'rgba(99,91,255,0.15)',
  border: '1px solid rgba(99,91,255,0.35)',
  borderRadius: '10px', padding: '10px 18px',
  fontSize: '13px', fontWeight: 600,
  color: '#a29bfe', cursor: 'pointer',
}

function stripeBanner(type: 'success' | 'pending' | 'error'): React.CSSProperties {
  const colors = {
    success: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', color: '#34D399' },
    pending: { bg: 'rgba(255,213,107,0.08)', border: 'rgba(255,213,107,0.2)', color: '#FFD56B' },
    error:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   color: '#ef4444' },
  }
  const c = colors[type]
  return {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: c.bg, border: `1px solid ${c.border}`,
    borderRadius: '10px', padding: '10px 14px',
    fontSize: '13px', color: c.color, marginBottom: '14px',
  }
}
