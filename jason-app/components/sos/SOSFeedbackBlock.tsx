'use client'

import { useState } from 'react'
import { WarningOctagon, ChatCircleDots, Lightbulb, X, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { submitSOSFeedback } from '@/app/actions/sos-feedback'

/* Bloc communauté en bas d'un scénario SOS.
   3 boutons → ouvre une modale → soumet via server action.
   UI discrète : repliée par défaut.
*/

interface Props {
  scenario: string
  channel: string
}

type FeedbackType = 'error' | 'testimony' | 'suggestion'

const TYPES: Array<{
  key: FeedbackType
  icon: typeof WarningOctagon
  label: string
  subtitle: string
  placeholder: string
}> = [
  {
    key: 'error',
    icon: WarningOctagon,
    label: 'Signaler une erreur',
    subtitle: 'Info inexacte, lien mort, procédure obsolète',
    placeholder: 'Décris ce qui est inexact ou périmé. Si possible, indique la source à jour (URL d\'Airbnb, etc.).',
  },
  {
    key: 'testimony',
    icon: ChatCircleDots,
    label: 'Témoigner mon cas',
    subtitle: 'Partager ton expérience pour aider d\'autres hôtes',
    placeholder: 'Raconte ce qui t\'est arrivé, comment tu as réagi, ce qui a marché et ce qui n\'a pas marché. Avec ton accord, ton témoignage pourra enrichir ce guide (anonymisé si tu le souhaites).',
  },
  {
    key: 'suggestion',
    icon: Lightbulb,
    label: 'Proposer une amélioration',
    subtitle: 'Étape manquante, template à ajouter, recours à mentionner',
    placeholder: 'Que pourrait-on ajouter ou améliorer dans ce scénario ?',
  },
]

export default function SOSFeedbackBlock({ scenario, channel }: Props) {
  const [openType, setOpenType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    setOpenType(null)
    setMessage('')
    setSuccess(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!openType || submitting) return
    setSubmitting(true)
    setError(null)
    const res = await submitSOSFeedback({
      scenario,
      channel,
      feedbackType: openType,
      message,
    })
    setSubmitting(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setSuccess(true)
    setMessage('')
  }

  const activeType = TYPES.find(t => t.key === openType)

  return (
    <>
      <div style={s.wrap}>
        <div style={s.intro}>
          <strong style={{ color: 'var(--text)' }}>Ce scénario t&apos;a aidé ?</strong>
          <span style={{ marginLeft: '6px' }}>
            Aide-nous à l&apos;améliorer pour les autres hôtes.
          </span>
        </div>
        <div style={s.buttons}>
          {TYPES.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setOpenType(t.key)}
                style={s.btn}
                type="button"
              >
                <Icon size={16} weight="bold" style={{ flexShrink: 0 }} />
                <span style={s.btnLabel}>{t.label}</span>
                <span style={s.btnSub}>{t.subtitle}</span>
              </button>
            )
          })}
        </div>
      </div>

      {openType && activeType && (
        <div
          style={s.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div style={s.modal} role="dialog" aria-modal="true">
            <div style={s.modalHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <activeType.icon size={20} weight="fill" style={{ color: 'var(--accent-text)' }} />
                <h3 style={s.modalTitle}>{activeType.label}</h3>
              </div>
              <button onClick={close} style={s.closeBtn} aria-label="Fermer">
                <X size={18} weight="bold" />
              </button>
            </div>

            {success ? (
              <div style={s.successWrap}>
                <CheckCircle size={48} weight="fill" style={{ color: '#059669', marginBottom: '12px' }} />
                <h4 style={s.successTitle}>Merci !</h4>
                <p style={s.successText}>
                  Ton retour a bien été enregistré. Jason le relira et l&apos;intégrera si pertinent
                  lors de la prochaine mise à jour du scénario.
                </p>
                <button onClick={close} style={s.successBtn} type="button">Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={s.form}>
                <p style={s.formIntro}>{activeType.subtitle}</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeType.placeholder}
                  style={s.textarea}
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={8}
                  autoFocus
                />
                <div style={s.counter}>{message.length} / 4000</div>
                {error && <div style={s.errorMsg}>{error}</div>}
                <div style={s.formActions}>
                  <button type="button" onClick={close} style={s.cancelBtn}>Annuler</button>
                  <button
                    type="submit"
                    disabled={submitting || message.trim().length < 10}
                    style={{
                      ...s.submitBtn,
                      ...(submitting || message.trim().length < 10 ? s.submitBtnDisabled : {}),
                    }}
                  >
                    {submitting ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '18px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
  },
  intro: {
    fontSize: '13.5px',
    color: 'var(--text-2)',
    marginBottom: '14px',
    lineHeight: 1.55,
  },
  buttons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '8px',
  },
  btn: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
    padding: '12px 14px',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    background: 'var(--bg)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    color: 'var(--text-2)',
    transition: 'all 0.12s',
  },
  btnLabel: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
  },
  btnSub: {
    fontSize: '11.5px', color: 'var(--text-3)', lineHeight: 1.4,
  },

  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    width: '100%', maxWidth: '540px',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.30)',
  },
  modalHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 500,
    margin: 0, color: 'var(--text)',
  },
  closeBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)',
    padding: '4px', display: 'flex',
  },

  form: {
    padding: '18px',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  },
  formIntro: {
    fontSize: '13px', color: 'var(--text-3)',
    margin: '0 0 4px', lineHeight: 1.5,
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    lineHeight: 1.55,
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    resize: 'vertical' as const,
    minHeight: '160px',
  },
  counter: {
    fontSize: '11px', color: 'var(--text-3)',
    textAlign: 'right' as const,
  },
  errorMsg: {
    padding: '10px 12px', borderRadius: '8px',
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.25)',
    color: '#dc2626',
    fontSize: '12.5px',
  },
  formActions: {
    display: 'flex', justifyContent: 'flex-end', gap: '8px',
    marginTop: '4px',
  },
  cancelBtn: {
    padding: '9px 16px', borderRadius: '8px',
    border: '1px solid var(--border-2)',
    background: 'transparent',
    color: 'var(--text-2)',
    fontSize: '13px', fontFamily: 'inherit',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '9px 18px', borderRadius: '8px',
    border: '1px solid var(--accent-border)',
    background: 'var(--accent-bg-2)',
    color: 'var(--accent-text)',
    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer',
  },
  submitBtnDisabled: {
    opacity: 0.5, cursor: 'not-allowed',
  },

  successWrap: {
    padding: '32px 24px',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    textAlign: 'center' as const,
  },
  successTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '20px', fontWeight: 500,
    margin: '0 0 10px', color: 'var(--text)',
  },
  successText: {
    fontSize: '13.5px', color: 'var(--text-2)',
    lineHeight: 1.6, margin: '0 0 18px', maxWidth: '380px',
  },
  successBtn: {
    padding: '9px 22px', borderRadius: '8px',
    border: '1px solid var(--accent-border)',
    background: 'var(--accent-bg-2)',
    color: 'var(--accent-text)',
    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer',
  },
}
