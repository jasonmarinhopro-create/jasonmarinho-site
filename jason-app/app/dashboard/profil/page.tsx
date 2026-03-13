'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { Check, User, EnvelopeSimple, PencilSimple, Warning } from '@phosphor-icons/react'

export default function ProfilPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [editName, setEditName] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const user = session.user
      setUserId(user.id)
      setEmail(user.email ?? '')
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        if (data?.full_name) {
          const parts = data.full_name.trim().split(' ')
          setFirstName(parts[0] ?? '')
          setLastName(parts.slice(1).join(' ') ?? '')
        }
      })
    })
  }, [])

  async function handleSave() {
    if (!userId) return
    setSaveError('')
    setLoading(true)
    const supabase = createClient()
    const fullName = [firstName, lastName].filter(Boolean).join(' ')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId)
    setLoading(false)
    if (error) {
      setSaveError('Erreur lors de la sauvegarde. Réessaie.')
      return
    }
    setSaved(true)
    setEditName(false)
    router.refresh() // Invalide le Router Cache → les autres pages re-fetched le profil à jour
    setTimeout(() => setSaved(false), 2500)
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase()

  return (
    <>
      <Header title="Mon profil" userName={fullName || undefined} />

      <div style={styles.page} className="dash-page">
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>Mon <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>profil</em></h2>
          <p style={styles.pageDesc}>Gère tes informations personnelles.</p>
        </div>

        <div style={styles.content} className="fade-up d1">
          {/* Avatar */}
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>
              <span style={styles.avatarText}>{initials}</span>
            </div>
            <div>
              <div style={styles.avatarName}>{fullName || email}</div>
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
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    style={styles.input}
                    placeholder="Prénom"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    style={styles.input}
                    placeholder="Nom"
                  />
                </div>
                {saveError && (
                  <div style={styles.errorBox}>
                    <Warning size={14} />
                    {saveError}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary"
                    style={{ fontSize: '13px', padding: '10px 18px' }}
                  >
                    {saved
                      ? <><Check size={14} weight="bold" /> Sauvegardé</>
                      : loading ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                  <button onClick={() => { setEditName(false); setSaveError('') }} style={styles.cancelBtn}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.valueRow}>
                <span style={styles.value}>
                  {fullName || <span style={{ color: 'rgba(240,244,255,0.28)' }}>Non renseigné</span>}
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
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '32px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)' },
  content: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: 'clamp(24px,3vw,40px)',
    maxWidth: '600px',
  },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' },
  avatar: {
    width: '64px', height: '64px', flexShrink: 0,
    background: 'rgba(0,76,63,0.5)', border: '2px solid rgba(255,213,107,0.25)',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 600, color: '#FFD56B' },
  avatarName: { fontSize: '17px', fontWeight: 600, color: '#f0f4ff', marginBottom: '3px' },
  avatarSub: { fontSize: '13px', color: 'rgba(240,244,255,0.38)' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 24px' },
  field: { marginBottom: '24px' },
  label: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'rgba(240,244,255,0.45)', marginBottom: '10px',
  },
  valueRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  value: { fontSize: '15px', color: '#f0f4ff', fontWeight: 400 },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, color: 'rgba(240,244,255,0.45)',
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
  },
  nameRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: {
    flex: 1, minWidth: '140px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,213,107,0.3)',
    borderRadius: '10px', padding: '10px 14px',
    fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#f0f4ff',
    outline: 'none',
  },
  cancelBtn: {
    fontSize: '13px', fontWeight: 400, color: 'rgba(240,244,255,0.38)',
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', color: '#F87171',
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
    borderRadius: '8px', padding: '10px 14px',
  },
  readOnly: {
    fontSize: '11px', fontWeight: 500, color: 'rgba(240,244,255,0.25)',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '6px', padding: '4px 10px',
  },
}
