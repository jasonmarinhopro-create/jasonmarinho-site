'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { House, Check, Eye, EyeSlash, ArrowSquareOut, UsersThree } from '@phosphor-icons/react/dist/ssr'
import { updateProfilePseudo } from '../chez-nous/actions'

type Props = {
  initialPseudo: string
  initialBio: string
  firstName: string
  userId: string
  initialPrivacy: {
    show_logements: boolean
    show_platforms: boolean
    show_city:      boolean
  }
}

export default function ChezNousIdentity({ initialPseudo, initialBio, firstName, userId, initialPrivacy }: Props) {
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
          <House size={20} color="var(--accent-text)" weight="fill" />
        </div>
        <div>
          <h3 style={s.title}>Profil public</h3>
          <p style={s.desc}>Ton pseudo et ce que les autres hôtes voient quand tu poses une question</p>
        </div>
      </div>

      <div style={s.body}>
        {/* Bandeau explicatif Entre Hôtes */}
        <Link href="/dashboard/chez-nous" style={s.infoBanner}>
          <UsersThree size={18} weight="fill" color="var(--accent-text)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.infoTitle}>Questions &amp; réponses</p>
            <p style={s.infoDesc}>
              Pose tes questions à Jason et aux autres hôtes : réponse sous 48 h. Ton pseudo
              s&apos;affiche à côté de tes questions et de tes réponses.
            </p>
          </div>
          <ArrowSquareOut size={14} color="var(--accent-text)" />
        </Link>

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
          <Link
            href={`/dashboard/chez-nous/membre/${userId}`}
            style={s.publicLink}
            title="Voir comment ton profil apparaît aux autres membres"
          >
            <Eye size={13} /> Voir mon profil public
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        border: `1px solid ${value ? 'var(--success-border)' : 'var(--border)'}`,
        background: value ? 'var(--success-bg)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{label}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px',
        color: value ? 'var(--success-1)' : 'var(--text-muted)',
        background: value ? 'var(--success-bg)' : 'rgba(148,163,184,0.08)',
      }}>
        {value ? <><Eye size={11} /> Visible</> : <><EyeSlash size={11} /> Masqué</>}
      </span>
    </button>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl, 18px)', padding: 'clamp(16px, 2.2vw, 22px)', minWidth: 0,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px',
  },
  iconWrap: {
    width: '36px', height: '36px', borderRadius: '11px',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', fontWeight: 500, color: 'var(--text)', margin: '0 0 2px', letterSpacing: '-0.01em' },
  desc:  { fontSize: '13px', color: 'var(--text-3)', margin: 0, lineHeight: 1.45 },
  body:  { display: 'flex', flexDirection: 'column', gap: '18px' },
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
    color: 'var(--danger)', fontSize: '12px', margin: 0,
    background: 'var(--danger-bg)', padding: '8px 12px',
    borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
  },
  actions: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
  },
  successMsg: { display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600 },
  btn: {
    background: 'var(--accent-text)', color: 'var(--bg)',
    border: 'none', borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  infoBanner: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', borderRadius: '12px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    textDecoration: 'none', cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },
  infoTitle: {
    margin: '0 0 2px', fontSize: '13px', fontWeight: 600,
    color: 'var(--text)',
  },
  infoDesc: {
    margin: 0, fontSize: '11px', color: 'var(--text-3)',
    lineHeight: 1.5,
  },
  publicLink: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '7px 12px',
    textDecoration: 'none', cursor: 'pointer',
  },
}
