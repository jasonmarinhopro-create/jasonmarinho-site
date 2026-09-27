'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, EnvelopeSimple, PencilSimple, Warning, Lock, Eye, EyeSlash, Key } from '@phosphor-icons/react/dist/ssr'
import { SectionCard, FieldRow, f } from './ProfilForm'

// Connexion : e-mail et mot de passe (sept. 2026, sortis de la carte
// « Identité », qui ne garde que ce qui figure sur les contrats).

export default function AccountCard({ email }: { email: string }) {
  const [editPassword, setEditPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

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

  function cancel() {
    setEditPassword(false); setNewPassword(''); setConfirmPassword(''); setPwError('')
  }

  return (
    <SectionCard
      anchorId="connexion"
      icon={<Key size={20} weight="fill" />}
      iconColor="var(--accent-text)"
      iconBg="var(--accent-bg)"
      title="Connexion"
      description="L'adresse e-mail et le mot de passe de ton compte."
    >
      <FieldRow label="Adresse e-mail" icon={<EnvelopeSimple size={12} />}>
        <div style={f.valueRow}>
          <span style={{ ...f.value, overflowWrap: 'anywhere' }}>{email}</span>
          <span style={f.readOnly}>Non modifiable</span>
        </div>
      </FieldRow>

      <FieldRow label="Mot de passe" icon={<Lock size={12} />}>
        {pwSaved && <div style={s.saved}><Check size={13} weight="bold" /> Mot de passe modifié.</div>}
        {editPassword ? (
          <div>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={{ ...f.input, paddingRight: '44px' }}
                placeholder="Nouveau mot de passe (8 caractères minimum)" autoFocus
              />
              <button type="button" onClick={() => setShowNew(v => !v)} style={s.eye} aria-label={showNew ? 'Masquer' : 'Afficher'}>
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
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={s.eye} aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                {showConfirm ? <EyeSlash size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pwError && <div style={f.errorBox}><Warning size={13} />{pwError}</div>}
            <div style={f.saveRow}>
              <button onClick={handlePasswordSave} disabled={pwLoading} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
                {pwLoading ? 'Mise à jour…' : 'Enregistrer'}
              </button>
              <button onClick={cancel} className="jm-profil-cancel-btn" style={f.cancelBtn}>Annuler</button>
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
  )
}

const s: Record<string, React.CSSProperties> = {
  eye: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px',
    display: 'flex', alignItems: 'center',
  },
  saved: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', marginBottom: '10px', borderRadius: '10px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', fontSize: '13px',
  },
}
