'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { requestDriingUpgrade } from './actions'
import { Star, EnvelopeSimple, Warning, Check, ArrowSquareOut } from '@phosphor-icons/react'

interface Props {
  userEmail: string
  driingStatus: 'none' | 'pending' | 'confirmed'
  needsFix?: boolean   // driing_status=confirmed mais plan pas encore mis à jour
}

export default function DriingRequestForm({ userEmail, driingStatus: initialStatus, needsFix = false }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [driingEmail, setDriingEmail] = useState(userEmail)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  // Auto-correction de l'état incohérent au montage
  useEffect(() => {
    if (!needsFix) return
    requestDriingUpgrade(userEmail).then(result => {
      if (!result.error) router.refresh()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (needsFix) {
    return (
      <div style={s.pendingBox}>
        <div style={s.pendingIcon}>🔄</div>
        <div>
          <div style={s.pendingTitle}>Synchronisation en cours…</div>
          <div style={s.pendingDesc}>Ton adhésion est confirmée, on met à jour ton compte.</div>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div style={s.pendingBox}>
        <div style={s.pendingIcon}>⏳</div>
        <div>
          <div style={s.pendingTitle}>Demande en cours de traitement</div>
          <div style={s.pendingDesc}>Nous vérifions ton statut Driing. Tu seras notifié par e-mail dès la confirmation.</div>
        </div>
      </div>
    )
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    const result = await requestDriingUpgrade(driingEmail)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setSent(true)
    setStatus('pending')
  }

  if (sent) {
    return (
      <div style={s.successBox}>
        <Check size={16} color="#34D399" weight="bold" />
        Demande envoyée ! Nous la traitons sous 24–48h.
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      {!showForm ? (
        <div style={s.ctaRow}>
          <button onClick={() => setShowForm(true)} style={s.btnRequest}>
            <Star size={14} weight="fill" />
            Faire la demande
          </button>
          <a href="https://driing.co" target="_blank" rel="noopener noreferrer" style={s.btnBecome}>
            Pas encore client Driing ?
            <ArrowSquareOut size={13} />
          </a>
        </div>
      ) : (
        <div style={s.form}>
          <p style={s.formDesc}>
            Renseigne l'e-mail associé à ton compte Driing pour que nous puissions vérifier ton statut.
          </p>
          <div style={s.inputWrap}>
            <EnvelopeSimple size={15} style={s.inputIcon} />
            <input
              type="email"
              value={driingEmail}
              onChange={e => setDriingEmail(e.target.value)}
              placeholder="ton@email-driing.com"
              style={s.input}
              autoFocus
            />
          </div>
          {error && (
            <div style={s.errorBox}>
              <Warning size={14} />
              {error}
            </div>
          )}
          <div style={s.formButtons}>
            <button onClick={handleSubmit} disabled={loading} style={s.btnSubmit}>
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }} style={s.btnCancel}>
              Annuler
            </button>
          </div>
          <p style={s.notClient}>
            Pas encore client Driing ?{' '}
            <a href="https://driing.co" target="_blank" rel="noopener noreferrer" style={s.link}>
              Devenir client Driing <ArrowSquareOut size={11} />
            </a>
          </p>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { marginTop: '4px' },
  ctaRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  btnRequest: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '9px 18px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
  },
  btnBecome: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 400, color: 'rgba(240,244,255,0.4)',
    textDecoration: 'none',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formDesc: { fontSize: '13px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', lineHeight: 1.6, margin: 0 },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '13px', color: 'rgba(240,244,255,0.35)', flexShrink: 0 },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,213,107,0.25)',
    borderRadius: '10px', padding: '10px 14px 10px 38px',
    fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#f0f4ff', outline: 'none',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', color: '#F87171',
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
    borderRadius: '8px', padding: '10px 14px',
  },
  formButtons: { display: 'flex', alignItems: 'center', gap: '10px' },
  btnSubmit: {
    padding: '10px 20px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.15)', border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
  },
  btnCancel: {
    fontSize: '13px', fontWeight: 400, color: 'rgba(240,244,255,0.38)',
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px', fontFamily: 'Outfit, sans-serif',
  },
  notClient: { fontSize: '12px', color: 'rgba(240,244,255,0.3)', margin: 0, lineHeight: 1.6 },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    color: 'rgba(255,213,107,0.5)', textDecoration: 'none',
  },
  pendingBox: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    background: 'rgba(255,213,107,0.06)', border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '12px', padding: '14px 16px',
  },
  pendingIcon: { fontSize: '18px', flexShrink: 0 },
  pendingTitle: { fontSize: '13px', fontWeight: 600, color: 'rgba(255,213,107,0.7)', marginBottom: '4px' },
  pendingDesc: { fontSize: '12px', fontWeight: 300, color: 'rgba(240,244,255,0.4)', lineHeight: 1.6 },
  successBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', color: '#34D399',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)',
    borderRadius: '8px', padding: '12px 14px',
  },
}
