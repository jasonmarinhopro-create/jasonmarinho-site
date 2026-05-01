'use client'

import { useState, useTransition } from 'react'
import { Flag, X, Check } from '@phosphor-icons/react'
import { reportContent } from '@/app/dashboard/chez-nous/actions'

type Props = {
  postId?: string
  replyId?: string
}

const REASONS: Array<{ id: string; label: string; desc: string }> = [
  { id: 'off_topic',  label: 'Hors sujet',     desc: 'Ne correspond pas à la catégorie ou à Chez Nous' },
  { id: 'spam',       label: 'Spam ou pub',    desc: 'Auto-promo déguisée, message commercial' },
  { id: 'aggressive', label: 'Agressif',       desc: 'Injures, attaques personnelles, manque de respect' },
  { id: 'other',      label: 'Autre',          desc: 'Autre raison à préciser ci-dessous' },
]

export default function ReportButton({ postId, replyId }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('off_topic')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await reportContent({ postId, replyId, reason, message })
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setOpen(false)
          setSubmitted(false)
          setMessage('')
          setReason('off_topic')
        }, 1800)
      } else {
        setError(res.error ?? 'Erreur')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={s.trigger}
        title="Signaler ce contenu"
      >
        <Flag size={11} />
      </button>

      {open && (
        <div style={s.overlay} onClick={() => !pending && setOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.head}>
              <h3 style={s.title}>Signaler ce contenu</h3>
              <button onClick={() => !pending && setOpen(false)} style={s.closeBtn} disabled={pending}>
                <X size={14} />
              </button>
            </div>

            {submitted ? (
              <div style={s.success}>
                <Check size={28} weight="bold" color="#10b981" />
                <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--text)' }}>Merci, signalement envoyé.</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>L'admin sera prévenu.</p>
              </div>
            ) : (
              <>
                <p style={s.intro}>
                  Aide-nous à garder Chez Nous propre et utile.
                </p>

                <div style={s.reasons}>
                  {REASONS.map(r => (
                    <label key={r.id} style={{
                      ...s.reasonRow,
                      borderColor: reason === r.id ? 'rgba(255,213,107,0.4)' : 'var(--border)',
                      background: reason === r.id ? 'rgba(255,213,107,0.06)' : 'var(--bg)',
                    }}>
                      <input
                        type="radio"
                        name="reason"
                        value={r.id}
                        checked={reason === r.id}
                        onChange={() => setReason(r.id)}
                        style={s.radio}
                      />
                      <div>
                        <div style={s.reasonLabel}>{r.label}</div>
                        <div style={s.reasonDesc}>{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Précisions (optionnel), 500 caractères max"
                  rows={3}
                  maxLength={500}
                  style={s.textarea}
                />

                {error && <p style={s.error}>{error}</p>}

                <div style={s.actions}>
                  <button onClick={() => setOpen(false)} style={s.btnGhost} disabled={pending}>Annuler</button>
                  <button onClick={submit} style={s.btnPrimary} disabled={pending}>
                    {pending ? 'Envoi…' : 'Signaler'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  trigger: {
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    padding: '2px 5px', display: 'inline-flex', alignItems: 'center',
    opacity: 0.6,
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px',
    width: '100%', maxWidth: '440px',
    display: 'flex', flexDirection: 'column', gap: '14px',
    maxHeight: '90vh', overflowY: 'auto',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0,
  },
  closeBtn: {
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    width: '28px', height: '28px', borderRadius: '6px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  intro: {
    fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: 1.6,
  },
  reasons: { display: 'flex', flexDirection: 'column', gap: '6px' },
  reasonRow: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    border: '1px solid', borderRadius: '10px', padding: '10px 12px',
    cursor: 'pointer',
  },
  radio: { marginTop: '2px', accentColor: '#ffd56b' },
  reasonLabel: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  reasonDesc:  { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  textarea: {
    background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', fontSize: '13px', resize: 'vertical',
    fontFamily: 'inherit', lineHeight: 1.5,
  },
  error: {
    color: '#fb7185', fontSize: '12px', margin: 0,
    background: 'rgba(251,113,133,0.08)',
    padding: '6px 10px', borderRadius: '6px',
    border: '1px solid rgba(251,113,133,0.2)',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  btnGhost: {
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
  },
  btnPrimary: {
    background: '#ffd56b', color: '#1a1a0e',
    border: 'none', borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
  success: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '24px 16px', textAlign: 'center',
  },
}
