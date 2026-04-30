'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveProfileName, saveIban, saveAdresse } from './actions'
import {
  Check, User, EnvelopeSimple, PencilSimple, Warning, Lock,
  Eye, EyeSlash, CreditCard, Bank, MapPin, IdentificationCard,
  Wallet,
} from '@phosphor-icons/react'

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
  icon, iconColor, iconBg, title, description, children,
}: {
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div style={sc.card}>
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
    borderRadius: '18px', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '20px 24px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  iconWrap: {
    width: '40px', height: '40px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' },
  desc: { fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 },
  body: { padding: '24px' },
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
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase', color: 'var(--text-3)',
    marginBottom: '8px',
  },
  valueRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' },
  value: { fontSize: '14px', color: 'var(--text)', fontWeight: 400 },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-3)',
    background: 'none', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '5px 12px', cursor: 'pointer',
    flexShrink: 0,
  },
  input: {
    flex: 1, minWidth: '120px',
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'var(--font-outfit), sans-serif',
    fontSize: '14px', color: 'var(--text)', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  } as React.CSSProperties,
  cancelBtn: { fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' },
  readOnly: {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '4px 10px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '12px', color: '#F87171',
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
    borderRadius: '8px', padding: '9px 12px', marginTop: '8px',
  },
  saveRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' },
}

function stripeBanner(type: 'success' | 'pending' | 'error'): React.CSSProperties {
  const c = {
    success: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', color: '#34D399' },
    pending: { bg: 'rgba(255,213,107,0.08)', border: 'rgba(255,213,107,0.2)', color: '#FFD56B' },
    error:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   color: '#ef4444' },
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
        iconColor="#34D399"
        iconBg="rgba(52,211,153,0.12)"
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
                <button onClick={handleCancel} style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={f.valueRow}>
              <span style={f.value}>{displayName || <span style={{ color: 'var(--text-muted)' }}>Non renseigné</span>}</span>
              <button onClick={() => setEditName(true)} style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
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
                <button onClick={() => { setEditPassword(false); setNewPassword(''); setConfirmPassword(''); setPwError('') }} style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={f.valueRow}>
              <span style={{ ...f.value, letterSpacing: '3px' }}>••••••••</span>
              <button onClick={() => setEditPassword(true)} style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
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
                <button onClick={handleAdresseCancel} style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : adresseValue ? (
            <div style={f.valueRow}>
              <span style={f.value}>{adresseValue}</span>
              <button onClick={() => setEditAdresse(true)} style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
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
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
                <span style={{ ...f.value, color: '#34D399' }}>Compte connecté</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{stripeAccountId?.slice(0, 20)}…</span>
              </div>
              <button onClick={handleStripeConnect} disabled={stripeLoading} style={f.editBtn}>{stripeLoading ? '…' : 'Gérer'}</button>
            </div>
          ) : stripeAccountId && !stripeComplete ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD56B', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#FFD56B' }}>Onboarding incomplet</span>
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
                <button onClick={handleIbanCancel} style={f.cancelBtn}>Annuler</button>
              </div>
            </div>
          ) : ibanValue ? (
            <div style={f.valueRow}>
              <div>
                <p style={{ margin: '0 0 2px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text)', letterSpacing: '0.5px' }}>{ibanValue}</p>
                {bicValue && <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-3)' }}>BIC : {bicValue}</p>}
              </div>
              <button onClick={() => setEditIban(true)} style={f.editBtn}><PencilSimple size={13} /> Modifier</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '10px' }}>
                Ajoute ton IBAN pour proposer le virement comme option de paiement dans tes contrats.
              </p>
              <button onClick={() => setEditIban(true)} style={addBtn('#34D399', 'rgba(52,211,153,0.1)', 'rgba(52,211,153,0.25)')}>
                + Ajouter mon IBAN
              </button>
            </div>
          )}
        </FieldRow>
      </SectionCard>
    </>
  )
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
