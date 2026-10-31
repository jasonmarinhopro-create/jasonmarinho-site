'use client'

import { useEffect, useState } from 'react'
import type { UserIdentity } from '@supabase/supabase-js'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { Check, EnvelopeSimple, PencilSimple, Warning, Lock, Eye, EyeSlash, Key } from '@phosphor-icons/react/dist/ssr'
import { SectionCard, FieldRow, f } from './ProfilForm'

// Connexion : e-mail et mot de passe (sept. 2026, sortis de la carte
// « Identité », qui ne garde que ce qui figure sur les contrats), et compte
// Google associé (31/10/2026). Un compte Google à la même adresse e-mail est
// associé tout seul à la première connexion « Continuer avec Google » ; ici on
// peut en associer un autre, ou le retirer (si un autre moyen de connexion reste).

export default function AccountCard({ email, google = false }: { email: string; google?: boolean }) {
  const { confirm, dialog } = useConfirm()
  const [identities, setIdentities] = useState<UserIdentity[] | null>(null)
  const [gBusy, setGBusy] = useState(false)
  const [gError, setGError] = useState('')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('google') === 'echec') {
      setGError('L’association avec Google n’a pas abouti. Si ce compte Google sert déjà à un autre compte, connecte-toi avec lui ou écris-nous.')
    }
    createClient().auth.getUserIdentities().then(({ data }) => setIdentities(data?.identities ?? []))
  }, [])

  const googleId = identities?.find(i => i.provider === 'google') ?? null
  const googleEmail = (googleId?.identity_data?.email as string | undefined) ?? null

  async function associerGoogle() {
    setGBusy(true); setGError('')
    const { error } = await createClient().auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard/profil#connexion')}` },
    })
    if (error) { setGBusy(false); setGError('Impossible d’ouvrir Google pour le moment. Réessaie dans quelques minutes.') }
  }

  async function retirerGoogle() {
    if (!googleId) return
    if (!(await confirm({ title: 'Retirer Google', message: 'Tu te connecteras ensuite avec ton e-mail et ton mot de passe.', confirmLabel: 'Retirer', danger: true }))) return
    const avant = identities
    setIdentities(ids => (ids ?? []).filter(i => i.identity_id !== googleId.identity_id))
    const { error } = await createClient().auth.unlinkIdentity(googleId)
    if (error) { setIdentities(avant); setGError('Impossible de retirer Google pour le moment.') }
  }
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

      {(google || googleId) && (
        <FieldRow label="Google" icon={<GoogleG />}>
          {gError && <div style={f.errorBox}><Warning size={13} />{gError}</div>}
          {identities === null ? (
            <span style={{ ...f.value, color: 'var(--text-3)' }}>…</span>
          ) : googleId ? (
            <div style={f.valueRow}>
              <span style={{ ...f.value, overflowWrap: 'anywhere' }}>
                <Check size={13} weight="bold" color="var(--accent-text)" style={{ verticalAlign: '-2px', marginRight: 6 }} />
                Associé{googleEmail ? ` : ${googleEmail}` : ''}
              </span>
              {identities.length > 1 && (
                <button onClick={retirerGoogle} className="jm-profil-edit-btn" style={f.editBtn}>Retirer</button>
              )}
            </div>
          ) : (
            <div style={f.valueRow}>
              <span style={{ ...f.value, color: 'var(--text-2)' }}>Connecte-toi en un clic avec ton compte Google.</span>
              <button onClick={associerGoogle} disabled={gBusy} className="jm-profil-edit-btn" style={f.editBtn}>
                {gBusy ? 'Ouverture…' : 'Associer Google'}
              </button>
            </div>
          )}
        </FieldRow>
      )}
      {dialog}
    </SectionCard>
  )
}

function GoogleG() {
  return (
    <svg width="12" height="12" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
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
