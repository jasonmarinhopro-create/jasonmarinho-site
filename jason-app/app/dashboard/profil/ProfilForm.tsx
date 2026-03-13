'use client'

import { useState, useTransition } from 'react'
import { saveProfileName } from './actions'
import { Check, User, EnvelopeSimple, PencilSimple, Warning } from '@phosphor-icons/react'

interface Props {
  initialFullName: string
  email: string
}

export default function ProfilForm({ initialFullName, email }: Props) {
  const [isPending, startTransition] = useTransition()
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

  const displayName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase()

  function handleSave() {
    setSaveError('')
    const name = [firstName, lastName].filter(Boolean).join(' ')
    startTransition(async () => {
      const result = await saveProfileName(name)
      if (result.error) {
        setSaveError(result.error)
        return
      }
      setFullNameState(name)
      setSaved(true)
      setEditName(false)
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
                disabled={isPending}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '10px 18px' }}
              >
                {saved
                  ? <><Check size={14} weight="bold" /> Sauvegardé</>
                  : isPending ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
              <button onClick={handleCancel} style={styles.cancelBtn}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.valueRow}>
            <span style={styles.value}>
              {displayName || <span style={{ color: 'rgba(240,244,255,0.28)' }}>Non renseigné</span>}
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
  )
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: 'clamp(24px,3vw,40px)',
    maxWidth: '600px',
  },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' },
  avatarWrap: {
    position: 'relative', width: '64px', height: '64px', flexShrink: 0,
    borderRadius: '50%', overflow: 'hidden',
  },
  avatar: {
    width: '64px', height: '64px',
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
