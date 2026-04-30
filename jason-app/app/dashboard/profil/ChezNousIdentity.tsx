'use client'

import { useState, useTransition } from 'react'
import { House, Check, Eye, EyeSlash } from '@phosphor-icons/react'
import { updateProfilePseudo } from '../chez-nous/actions'

type Props = {
  initialPseudo: string
  initialBio: string
  firstName: string
  initialPrivacy: {
    show_logements: boolean
    show_platforms: boolean
    show_city:      boolean
  }
}

export default function ChezNousIdentity({ initialPseudo, initialBio, firstName, initialPrivacy }: Props) {
  const [pseudo,  setPseudo]  = useState(initialPseudo)
  const [bio,     setBio]     = useState(initialBio)
  const [privacy, setPrivacy] = useState(initialPrivacy)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null); setSuccess(false)
    startTransition(async () => {
      const res = await updateProfilePseudo({
        pseudo: pseudo.trim() || null,
        bio:    bio.trim() || null,
        privacy_show_logements: privacy.show_logements,
        privacy_show_platforms: privacy.show_platforms,
        privacy_show_city:      privacy.show_city,
      })
      if (res.ok) { setSuccess(true); setTimeout(() => setSuccess(false), 2500) }
      else setError(res.error ?? 'Erreur')
    })
  }

  const displayed = pseudo.trim() || firstName || 'Anonyme'

  return (
    <div style={s.card}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.iconWrap}>
          <House size={20} color="#FFD56B" weight="fill" />
        </div>
        <div>
          <h3 style={s.title}>Profil Chez Nous</h3>
          <p style={s.desc}>Comment tu apparais dans la communauté d&apos;hôtes LCD</p>
        </div>
      </div>

      <div style={s.body}>
        {/* Pseudo */}
        <div style={s.field}>
          <label style={s.label}>Pseudo (optionnel)</label>
          <input
            type="text"
            value={pseudo}
            onChange={e => setPseudo(e.target.value)}
            placeholder={firstName ? `Par défaut : ${firstName}` : 'Comment veux-tu t\'appeler ?'}
            style={s.input}
            maxLength={30}
          />
          <p style={s.helper}>
            Tu apparaîtras comme <strong style={{ color: 'var(--accent-text)' }}>{displayed}</strong>
          </p>
        </div>

        {/* Bio */}
        <div style={s.field}>
          <label style={s.label}>Bio (optionnel)</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Quelques mots sur toi en tant qu'hôte LCD…"
            style={s.textarea}
            rows={3}
            maxLength={500}
          />
          <p style={s.helper}>{bio.length}/500</p>
        </div>

        {/* Confidentialité */}
        <div style={s.privacyBlock}>
          <div style={s.privacyHead}>
            <Eye size={13} color="var(--text-3)" />
            <span style={s.privacyTitle}>Confidentialité</span>
          </div>
          <p style={s.privacyDesc}>Choisis ce qui est visible pour les autres membres.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <PrivacyToggle label="Nombre de logements" value={privacy.show_logements} onChange={v => setPrivacy(p => ({ ...p, show_logements: v }))} />
            <PrivacyToggle label="Plateformes utilisées"  value={privacy.show_platforms} onChange={v => setPrivacy(p => ({ ...p, show_platforms: v }))} />
            <PrivacyToggle label="Ville principale"       value={privacy.show_city}      onChange={v => setPrivacy(p => ({ ...p, show_city: v }))} />
          </div>
        </div>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.actions}>
          {success && (
            <span style={s.successMsg}>
              <Check size={13} weight="bold" /> Enregistré
            </span>
          )}
          <button onClick={submit} style={s.btn} disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PrivacyToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
        border: `1px solid ${value ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
        background: value ? 'rgba(52,211,153,0.05)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{label}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px',
        color: value ? '#34d399' : 'var(--text-muted)',
        background: value ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.08)',
      }}>
        {value ? <><Eye size={11} /> Visible</> : <><EyeSlash size={11} /> Masqué</>}
      </span>
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
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
    background: 'rgba(255,213,107,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' },
  desc:  { fontSize: '12px', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 },
  body:  { padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-3)' },
  helper: { fontSize: '11px', color: 'var(--text-muted)', margin: 0 },
  input: {
    background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', fontSize: '14px',
    fontFamily: 'var(--font-outfit), sans-serif',
    outline: 'none',
  },
  textarea: {
    background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', fontSize: '14px', resize: 'vertical',
    fontFamily: 'var(--font-outfit), sans-serif', lineHeight: 1.6,
    outline: 'none',
  },
  privacyBlock: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  privacyHead:  { display: 'flex', alignItems: 'center', gap: '6px' },
  privacyTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  privacyDesc:  { fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 },
  error: {
    color: '#fb7185', fontSize: '12px', margin: 0,
    background: 'rgba(251,113,133,0.08)', padding: '8px 12px',
    borderRadius: '8px', border: '1px solid rgba(251,113,133,0.2)',
  },
  actions: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' },
  successMsg: { display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '12px', fontWeight: 600 },
  btn: {
    background: 'var(--accent-text)', color: 'var(--bg)',
    border: 'none', borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
}
