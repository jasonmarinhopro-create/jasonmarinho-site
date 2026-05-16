'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveProfileName, saveIban, saveAdresse, deleteAccount } from './actions'
import {
  Check, User, EnvelopeSimple, PencilSimple, Warning, Lock,
  Eye, EyeSlash, CreditCard, Bank, MapPin, IdentificationCard,
  Wallet, Trash, X,
} from '@phosphor-icons/react/dist/ssr'

interface Props {
  initialFullName: string
  email: string
  stripeAccountId: string | null
  stripeComplete: boolean
  initialIban?: string
  initialBic?: string
  initialAdresse?: string
}

// ─── Shared section card wrapper ───────────────────────────────────────────
function SectionCard({
  icon, iconColor, iconBg, title, description, children, anchorId,
}: {
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  title: string
  description: string
  children: React.ReactNode
  anchorId?: string
}) {
  return (
    <div id={anchorId} className="jm-profil-card" style={sc.card}>
      <div style={sc.header}>
        <div style={{ ...sc.iconWrap, background: iconBg, color: iconColor }}>
          {icon}
        </div>
        <div>
          <h3 style={sc.title}>{title}</h3>
          <p style={sc.desc}>{description}</p>
        </div>
      </div>
      <div style={sc.body}>{children}</div>
    </div>
  )
}

const sc: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)', overflow: 'hidden',
    transition: 'border-color var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-4)',
    padding: 'var(--s-5) var(--s-6)', borderBottom: '1px solid var(--border)',
    background: 'var(--bg-2)',
  },
  iconWrap: {
    width: '42px', height: '42px', borderRadius: 'var(--r-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 'var(--t-md)', fontWeight: 600, color: 'var(--text)',
    margin: '0 0 var(--s-1)', letterSpacing: 'var(--ls-snug)',
  },
  desc: {
    fontSize: 'var(--t-xs)', color: 'var(--text-3)', margin: 0,
    lineHeight: 'var(--lh-snug)',
  },
  body: { padding: 'var(--s-6)' },
}

// ─── Field row ──────────────────────────────────────────────────────────────
function FieldRow({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={f.label}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}

const f: Record<string, React.CSSProperties> = {
  label: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
    marginBottom: 'var(--s-2)',
  },
  valueRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 'var(--s-3)', flexWrap: 'wrap' as const,
  },
  value: { fontSize: 'var(--t-base)', color: 'var(--text)', fontWeight: 500 },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-xs)', fontWeight: 600, color: 'var(--text-2)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)', padding: '6px 12px', cursor: 'pointer',
    flexShrink: 0,
    transition: 'background var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth)',
  },
  input: {
    flex: 1, minWidth: '120px',
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    borderRadius: 'var(--r-md)', padding: '11px 14px',
    fontFamily: 'var(--font-outfit), sans-serif',
    fontSize: 'var(--t-base)', color: 'var(--text)', outline: 'none',
    width: '100%', boxSizing: 'border-box' as const,
    transition: 'border-color var(--d-base) var(--ease-smooth), background var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth)',
  } as React.CSSProperties,
  cancelBtn: {
    fontSize: 'var(--t-sm)', color: 'var(--text-muted)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--s-2)',
    transition: 'color var(--d-base) var(--ease-smooth)',
  },
  readOnly: {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '4px 10px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '12px', color: 'var(--danger)',
    background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.18)',
    borderRadius: '8px', padding: '9px 12px', marginTop: '8px',
  },
  saveRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' },
}

function stripeBanner(type: 'success' | 'pending' | 'error'): React.CSSProperties {
  const c = {
    success: { bg: 'var(--success-bg)', border: 'var(--success-border)', color: 'var(--success-1)' },
    pending: { bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.28)', color: '#b45309' },
    error:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   color: 'var(--danger)' },
  }[type]
  return {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: c.bg, border: `1px solid ${c.border}`,
    borderRadius: '10px', padding: '10px 14px',
    fontSize: '13px', color: c.color, marginBottom: '14px',
  }
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function ProfilForm({
  initialFullName, email, stripeAccountId, stripeComplete,
  initialIban = '', initialBic = '', initialAdresse = '',
}: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [fullName, setFullNameState] = useState(initialFullName)
  const [firstName, setFirstName] = useState(() => initialFullName.trim().split(' ')[0] ?? '')
  const [lastName,  setLastName]  = useState(() => initialFullName.trim().split(' ').slice(1).join(' ') ?? '')
  const [saved, setSaved]         = useState(false)
  const [saveError, setSaveError] = useState('')
  const [editName, setEditName]   = useState(false)

  const [editPassword,    setEditPassword]    = useState(false)
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew,         setShowNew]         = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [pwLoading,       setPwLoading]       = useState(false)
  const [pwError,         setPwError]         = useState('')
  const [pwSaved,         setPwSaved]         = useState(false)

  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError,   setStripeError]   = useState('')
  const stripeStatus  = searchParams.get('stripe')
  const isStripeConnected = !!stripeAccountId && stripeComplete

  const [editIban, setEditIban]     = useState(false)
  const [ibanValue, setIbanValue]   = useState(initialIban)
  const [bicValue,  setBicValue]    = useState(initialBic)
  const [ibanPending, startIbanTransition] = useTransition()
  const [ibanSaved,   setIbanSaved] = useState(false)
  const [ibanError,   setIbanError] = useState('')

  const [editAdresse, setEditAdresse]   = useState(false)
  const [adresseValue, setAdresseValue] = useState(initialAdresse)
  const [adressePending, startAdresseTransition] = useTransition()
  const [adresseSaved,   setAdresseSaved] = useState(false)
  const [adresseError,   setAdresseError] = useState('')

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
      setSaved(true); setEditName(false)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    })
  }
  function handleCancel() {
    const parts = fullName.trim().split(' ')
    setFirstName(parts[0] ?? ''); setLastName(parts.slice(1).join(' ') ?? '')
    setEditName(false); setSaveError('')
  }

  async function handlePasswordSave() {
    setPwError('')
    if (newPassword.length < 8) { setPwError('Au moins 8 caractères requis.'); return }
    if (newPassword !== confirmPassword) { setPwError('Les mots de passe ne correspondent pas.'); return }
    setPwLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) { setPwError(error.message); return }
    setPwSaved(true); setNewPassword(''); setConfirmPassword(''); setEditPassword(false)
    setTimeout(() => setPwSaved(false), 3000)
  }

  async function handleStripeConnect() {
    setStripeLoading(true); setStripeError('')
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) setStripeError(data.error ?? 'Erreur Stripe.')
      else window.location.href = data.url
    } catch { setStripeError('Erreur réseau.') }
    finally { setStripeLoading(false) }
  }

  function handleIbanSave() {
    setIbanError('')
    const raw = ibanValue.replace(/\s/g, '').toUpperCase()
    if (raw && raw.length < 14) { setIbanError('IBAN invalide (trop court).'); return }
    startIbanTransition(async () => {
      const result = await saveIban(raw, bicValue.trim().toUpperCase())
      if (result.error) { setIbanError(result.error); return }
      setIbanValue(raw); setIbanSaved(true); setEditIban(false)
      router.refresh()
      setTimeout(() => setIbanSaved(false), 2500)
    })
  }
  function handleIbanCancel() { setIbanValue(initialIban); setBicValue(initialBic); setIbanError(''); setEditIban(false) }

  function handleAdresseSave() {
    setAdresseError('')
    startAdresseTransition(async () => {
      const result = await saveAdresse(adresseValue)
      if (result.error) { setAdresseError(result.error); return }
      setAdresseSaved(true); setEditAdresse(false)
      setTimeout(() => setAdresseSaved(false), 2500)
    })
  }
  function handleAdresseCancel() { setAdresseValue(initialAdresse); setAdresseError(''); setEditAdresse(false) }

  return (
    <>
      {/* ── Carte 1 : Identité ─────────────────────────────────────────── */}
      <SectionCard
        icon={<IdentificationCard size={20} weight="fill" />}
        iconColor="var(--success-1)"
        iconBg="var(--success-bg)"
        title="Identité personnelle"
        description="Nom affiché, e-mail et mot de passe du compte"
      >
        {/* Prénom & Nom */}
        <FieldRow label="Prénom & Nom" icon={<User size={12} />}>
          {editName ? (
            <div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text" value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  style={{ ...f.input, flex: '1 1 120px' }}
                  placeholder="Prénom" autoFocus
                />
                <input
                  type="text" value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  style={{ ...f.input, flex: '1 1 120px' }}
                  placeholder="Nom"
                />
              </div>
              {saveError && <div style={f.errorBox}><Warning size={13} />{saveError}</div>}
              <div style={f.saveRow}>
                <button onClick={handleSave} disabled={isPending} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
                  {saved ? <><Check size={13} weight="bold" /> Sauvegardé</> : isPending ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button onClick={handleCancel} className="jm-profil-cancel-btn" style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={f.valueRow}>
              <span style={f.value}>{displayName || <span style={{ color: 'var(--text-muted)' }}>Non renseigné</span>}</span>
              <button onClick={() => setEditName(true)} className="jm-profil-edit-btn" style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
            </div>
          )}
        </FieldRow>

        {/* Email */}
        <FieldRow label="Adresse e-mail" icon={<EnvelopeSimple size={12} />}>
          <div style={f.valueRow}>
            <span style={f.value}>{email}</span>
            <span style={f.readOnly}>Non modifiable</span>
          </div>
        </FieldRow>

        {/* Mot de passe */}
        <FieldRow label="Mot de passe" icon={<Lock size={12} />}>
          {editPassword ? (
            <div>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  style={{ ...f.input, paddingRight: '44px' }}
                  placeholder="Nouveau mot de passe" autoFocus
                />
                <button type="button" onClick={() => setShowNew(v => !v)} style={eyeBtn}>
                  {showNew ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  style={{ ...f.input, paddingRight: '44px' }}
                  placeholder="Confirmer le mot de passe"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeBtn}>
                  {showConfirm ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwError && <div style={f.errorBox}><Warning size={13} />{pwError}</div>}
              <div style={f.saveRow}>
                <button onClick={handlePasswordSave} disabled={pwLoading} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
                  {pwSaved ? <><Check size={13} weight="bold" /> Modifié</> : pwLoading ? 'Mise à jour…' : 'Enregistrer'}
                </button>
                <button onClick={() => { setEditPassword(false); setNewPassword(''); setConfirmPassword(''); setPwError('') }} className="jm-profil-cancel-btn" style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={f.valueRow}>
              <span style={{ ...f.value, letterSpacing: '3px' }}>••••••••</span>
              <button onClick={() => setEditPassword(true)} className="jm-profil-edit-btn" style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
            </div>
          )}
        </FieldRow>
      </SectionCard>

      {/* ── Carte 2 : Coordonnées légales ──────────────────────────────── */}
      <SectionCard
        icon={<MapPin size={20} weight="fill" />}
        iconColor="var(--accent-text)"
        iconBg="var(--accent-bg)"
        title="Coordonnées légales"
        description="Apparaît sur tes contrats de location. Adresse du bailleur ou siège social."
      >
        <FieldRow label="Adresse (bailleur)" icon={<MapPin size={12} />}>
          {adresseSaved && <div style={{ ...stripeBanner('success'), marginBottom: '10px' }}><Check size={13} weight="bold" /> Adresse enregistrée.</div>}
          {editAdresse ? (
            <div>
              <input
                type="text" value={adresseValue}
                onChange={e => setAdresseValue(e.target.value)}
                style={f.input}
                placeholder="12 rue de la Paix, 75001 Paris" autoFocus
              />
              {adresseError && <div style={f.errorBox}><Warning size={13} />{adresseError}</div>}
              <div style={f.saveRow}>
                <button onClick={handleAdresseSave} disabled={adressePending} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
                  {adressePending ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button onClick={handleAdresseCancel} className="jm-profil-cancel-btn" style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : adresseValue ? (
            <div style={f.valueRow}>
              <span style={f.value}>{adresseValue}</span>
              <button onClick={() => setEditAdresse(true)} className="jm-profil-edit-btn" style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
            </div>
          ) : (
            <button onClick={() => setEditAdresse(true)} style={addBtn('var(--accent-text)', 'var(--accent-bg)', 'var(--accent-border)')}>
              + Ajouter mon adresse
            </button>
          )}
        </FieldRow>
      </SectionCard>

      {/* ── Carte 3 : Encaissements ────────────────────────────────────── */}
      <SectionCard
        anchorId="stripe"
        icon={<Wallet size={20} weight="fill" />}
        iconColor="#a29bfe"
        iconBg="rgba(99,91,255,0.12)"
        title="Encaissements"
        description="Stripe pour les cautions automatiques, IBAN pour les virements dans tes contrats"
      >
        {/* Stripe */}
        <FieldRow label="Paiements & Cautions (Stripe)" icon={<CreditCard size={12} />}>
          {stripeStatus === 'success' && <div style={{ ...stripeBanner('success'), marginBottom: '10px' }}><Check size={13} weight="bold" /> Compte Stripe connecté !</div>}
          {stripeStatus === 'pending' && <div style={stripeBanner('pending')}>Finalisation en cours…</div>}
          {stripeStatus === 'error'   && <div style={stripeBanner('error')}>Une erreur est survenue.</div>}

          {isStripeConnected ? (
            <div style={f.valueRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-1)', flexShrink: 0 }} />
                <span style={{ ...f.value, color: 'var(--success-1)' }}>Compte connecté</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{stripeAccountId?.slice(0, 20)}…</span>
              </div>
              <button onClick={handleStripeConnect} disabled={stripeLoading} className="jm-profil-edit-btn" style={f.editBtn}>{stripeLoading ? '…' : 'Gérer'}</button>
            </div>
          ) : stripeAccountId && !stripeComplete ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 600 }}>Onboarding incomplet</span>
              </div>
              <button onClick={handleStripeConnect} disabled={stripeLoading} style={addBtn('#a29bfe', 'rgba(99,91,255,0.1)', 'rgba(99,91,255,0.3)')}>
                {stripeLoading ? 'Chargement…' : 'Finaliser mon compte Stripe →'}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '10px' }}>
                Connecte Stripe pour collecter loyers et cautions automatiquement. La carte de ton locataire est bloquée à la signature.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(99,91,255,0.07)', border: '1px solid rgba(99,91,255,0.18)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', flexShrink: 0 }}>ℹ️</span>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: 'var(--text-2)' }}>Commissions</strong> : 1,5 % + 0,25 € (UE) ou 2,9 % + 0,25 € (hors UE). Déduit automatiquement.
                </p>
              </div>
              {stripeError && <div style={{ ...f.errorBox, marginBottom: '10px' }}><Warning size={13} />{stripeError}</div>}
              <button onClick={handleStripeConnect} disabled={stripeLoading} style={addBtn('#a29bfe', 'rgba(99,91,255,0.1)', 'rgba(99,91,255,0.3)')}>
                {stripeLoading ? 'Connexion…' : 'Connecter mon compte Stripe →'}
              </button>
            </div>
          )}
        </FieldRow>

        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0 20px' }} />

        {/* IBAN */}
        <FieldRow label="Virement bancaire (IBAN)" icon={<Bank size={12} />}>
          {ibanSaved && <div style={{ ...stripeBanner('success'), marginBottom: '10px' }}><Check size={13} weight="bold" /> IBAN enregistré.</div>}
          {editIban ? (
            <div>
              <input
                type="text" value={ibanValue}
                onChange={e => setIbanValue(e.target.value)}
                style={{ ...f.input, fontFamily: 'monospace', letterSpacing: '0.5px', marginBottom: '8px' }}
                placeholder="FR76 1234 5678 9012 3456 7890 123" autoFocus
              />
              <input
                type="text" value={bicValue}
                onChange={e => setBicValue(e.target.value)}
                style={{ ...f.input, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                placeholder="BIC / SWIFT (ex : BNPAFRPP)"
              />
              {ibanError && <div style={f.errorBox}><Warning size={13} />{ibanError}</div>}
              <div style={f.saveRow}>
                <button onClick={handleIbanSave} disabled={ibanPending} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
                  {ibanPending ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
                <button onClick={handleIbanCancel} className="jm-profil-cancel-btn" style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : ibanValue ? (
            <div style={f.valueRow}>
              <div>
                <p style={{ margin: '0 0 2px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text)', letterSpacing: '0.5px' }}>{ibanValue}</p>
                {bicValue && <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-3)' }}>BIC : {bicValue}</p>}
              </div>
              <button onClick={() => setEditIban(true)} className="jm-profil-edit-btn" style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '10px' }}>
                Ajoute ton IBAN pour proposer le virement comme option de paiement dans tes contrats.
              </p>
              <button onClick={() => setEditIban(true)} style={addBtn('var(--success-1)', 'rgba(52,211,153,0.1)', 'var(--success-border)')}>
                + Ajouter mon IBAN
              </button>
            </div>
          )}
        </FieldRow>
      </SectionCard>

      {/* ── Zone de danger : suppression du compte (RGPD) ── */}
      <DangerZone />
    </>
  )
}

// ─── Zone de danger : suppression de compte ────────────────────────────────
function DangerZone() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirmation !== 'SUPPRIMER') return
    setSubmitting(true)
    setError(null)
    const res = await deleteAccount(confirmation)
    if (res.error) {
      setError(res.error)
      setSubmitting(false)
      return
    }
    // Compte supprimé : redirect vers la page login (la session a déjà été nettoyée)
    router.replace('/auth/login')
  }

  return (
    <>
      <div style={dz.card}>
        <div style={dz.header}>
          <div style={dz.iconWrap}>
            <Trash size={18} weight="bold" />
          </div>
          <div>
            <h3 style={dz.title}>Supprimer mon compte</h3>
            <p style={dz.desc}>
              Si tu ne veux plus utiliser ton espace, tu peux le supprimer en 1 clic.
              Toutes tes données (logements, voyageurs, séjours, contrats, posts) seront
              effacées et ton abonnement résilié. Conforme RGPD + droit de rétractation 14 jours.
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} style={dz.btn}>
          <Trash size={13} weight="bold" />
          Supprimer mon compte
        </button>
      </div>

      {open && (
        <div style={dz.overlay} onClick={() => !submitting && setOpen(false)}>
          <div style={dz.modal} onClick={e => e.stopPropagation()}>
            <div style={dz.modalHead}>
              <h3 style={dz.modalTitle}>Confirmer la suppression</h3>
              <button
                onClick={() => !submitting && setOpen(false)}
                disabled={submitting}
                style={dz.modalClose}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <p style={dz.modalText}>
              Tu t'apprêtes à supprimer <strong style={{ color: 'var(--text)' }}>définitivement</strong> ton
              compte. Cette action :
            </p>
            <ul style={dz.modalList}>
              <li>annule ton abonnement Stripe s'il est actif</li>
              <li>efface tous tes logements, voyageurs et séjours</li>
              <li>efface tes contrats, posts Facebook et préférences</li>
              <li>ne peut pas être annulée</li>
            </ul>

            <p style={dz.modalConfirmLabel}>
              Tape <code style={dz.code}>SUPPRIMER</code> pour confirmer :
            </p>
            <input
              type="text"
              value={confirmation}
              onChange={e => setConfirmation(e.target.value)}
              placeholder="SUPPRIMER"
              autoFocus
              disabled={submitting}
              style={dz.input}
            />

            {error && (
              <div style={dz.errorBox}>
                <Warning size={14} />
                <span>{error}</span>
              </div>
            )}

            <div style={dz.modalActions}>
              <button
                onClick={() => setOpen(false)}
                disabled={submitting}
                style={dz.btnCancel}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmation !== 'SUPPRIMER' || submitting}
                style={{
                  ...dz.btnDelete,
                  opacity: confirmation === 'SUPPRIMER' && !submitting ? 1 : 0.5,
                  cursor: confirmation === 'SUPPRIMER' && !submitting ? 'pointer' : 'not-allowed',
                }}
              >
                <Trash size={13} weight="bold" />
                {submitting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const dz: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
    padding: '18px 20px',
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  header: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  iconWrap: {
    width: '36px', height: '36px',
    background: 'var(--surface-2)', color: 'var(--text-3)',
    borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '14.5px', fontWeight: 600, color: 'var(--text)',
    margin: '0 0 4px',
  },
  desc: {
    fontSize: '12.5px', color: 'var(--text-2)', margin: 0, lineHeight: 1.55,
  },
  btn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
    background: 'rgba(220,38,38,0.10)', color: 'var(--danger)',
    border: '1px solid rgba(220,38,38,0.30)',
    cursor: 'pointer', width: 'fit-content',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
    padding: '22px 24px',
    width: '100%', maxWidth: '460px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  modalTitle: {
    fontSize: '17px', fontWeight: 600, color: 'var(--text)', margin: 0,
    fontFamily: 'var(--font-fraunces), serif',
  },
  modalClose: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', padding: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '6px',
  },
  modalText: { fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 10px' },
  modalList: {
    margin: '0 0 18px', paddingLeft: '20px',
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7,
  },
  modalConfirmLabel: { fontSize: '13px', color: 'var(--text-2)', margin: '0 0 8px' },
  code: {
    background: 'rgba(220,38,38,0.10)', color: 'var(--danger)',
    padding: '2px 8px', borderRadius: '5px',
    fontSize: '12.5px', fontFamily: 'ui-monospace, monospace', fontWeight: 600,
  },
  input: {
    width: '100%', padding: '10px 13px', borderRadius: '10px',
    border: '1px solid var(--border-2)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: '14px', fontFamily: 'ui-monospace, monospace',
    fontWeight: 600, letterSpacing: '1px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '14px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 12px', borderRadius: '10px',
    background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
    fontSize: '12.5px', color: 'var(--danger)', marginBottom: '14px',
  },
  modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  btnCancel: {
    padding: '9px 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 500, fontFamily: 'inherit',
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border-2)', cursor: 'pointer',
  },
  btnDelete: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
    background: 'var(--danger)', color: '#fff', border: 'none',
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const eyeBtn: React.CSSProperties = {
  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-2)', padding: '4px',
  display: 'flex', alignItems: 'center',
}

function addBtn(color: string, bg: string, border: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: bg, border: `1px solid ${border}`,
    borderRadius: '10px', padding: '9px 16px',
    fontSize: '13px', fontWeight: 600, color, cursor: 'pointer',
  }
}
