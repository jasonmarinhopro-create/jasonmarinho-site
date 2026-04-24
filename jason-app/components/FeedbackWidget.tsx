'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatTeardrop, X, PaperPlaneTilt, Bug, Lightbulb, ChatCircle, Check } from '@phosphor-icons/react'
import { sendFeedback } from '@/app/dashboard/feedback/actions'

type FeedbackType = 'bug' | 'idee' | 'autre'

const TYPES: { key: FeedbackType; label: string; Icon: React.ElementType; color: string }[] = [
  { key: 'bug',  label: 'Bug',  Icon: Bug,        color: '#F97583' },
  { key: 'idee', label: 'Idée', Icon: Lightbulb,  color: '#FFD56B' },
  { key: 'autre',label: 'Autre',Icon: ChatCircle,  color: '#60BEFF' },
]

export default function FeedbackWidget() {
  const [open, setOpen]         = useState(false)
  const [type, setType]         = useState<FeedbackType>('bug')
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOutside) }
  }, [open])

  function handleOpen() {
    setSent(false); setError(null); setMessage(''); setType('bug')
    setOpen(o => !o)
  }

  async function handleSubmit() {
    if (!message.trim()) return
    setSending(true); setError(null)
    try {
      const result = await sendFeedback(type, message)
      if (result.error) { setError(result.error); setSending(false); return }
      setSent(true)
      setTimeout(() => setOpen(false), 2200)
    } catch {
      setError("Erreur lors de l'envoi. Réessaie.")
    }
    setSending(false)
  }

  const selectedType = TYPES.find(t => t.key === type)!

  return (
    <div style={s.root} ref={panelRef}>

      {/* Panel */}
      {open && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <span style={s.panelTitle}>Un retour à partager ?</span>
            <button onClick={() => setOpen(false)} style={s.closeBtn}><X size={16} /></button>
          </div>

          {sent ? (
            <div style={s.success}>
              <div style={s.successIcon}><Check size={22} color="#34D399" weight="bold" /></div>
              <p style={s.successText}>Merci ! Ton retour a bien été envoyé.</p>
            </div>
          ) : (
            <>
              {/* Type selector */}
              <div style={s.typeRow}>
                {TYPES.map(({ key, label, Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    style={{
                      ...s.typeBtn,
                      ...(type === key ? { background: `${color}18`, border: `1px solid ${color}40`, color } : {}),
                    }}
                  >
                    <Icon size={13} weight={type === key ? 'fill' : 'regular'} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'  ? 'Décris le bug : sur quelle page, ce qui s\'est passé…' :
                  type === 'idee' ? 'Quelle fonctionnalité ou amélioration tu imagines ?' :
                  'Ton message…'
                }
                style={s.textarea}
                rows={4}
                autoFocus
              />

              {error && <p style={s.errorText}>{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={sending || !message.trim()}
                style={{
                  ...s.sendBtn,
                  ...(message.trim() ? { background: `${selectedType.color}18`, borderColor: `${selectedType.color}40`, color: selectedType.color } : {}),
                  opacity: sending ? 0.6 : 1,
                }}
              >
                <PaperPlaneTilt size={14} weight="fill" />
                {sending ? 'Envoi…' : 'Envoyer'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={handleOpen}
        style={{ ...s.fab, ...(open ? s.fabOpen : {}) }}
        title="Partager un retour"
      >
        {open ? <X size={18} /> : <ChatTeardrop size={20} weight="fill" />}
      </button>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },

  fab: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'var(--yellow)',
    border: 'none',
    color: 'var(--green-deep)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  fabOpen: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: 'var(--text-2)',
  },

  panel: {
    width: '300px',
    background: 'rgba(8, 22, 18, 0.98)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  closeBtn: {
    width: '26px', height: '26px', borderRadius: '7px',
    background: 'var(--border)', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-3)',
  },

  typeRow: {
    display: 'flex',
    gap: '6px',
    padding: '12px 14px 8px',
  },
  typeBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 500, padding: '6px 4px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', cursor: 'pointer',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },

  textarea: {
    margin: '0 14px',
    width: 'calc(100% - 28px)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 12px',
    fontFamily: 'var(--font-outfit), sans-serif',
    fontSize: '16px',
    color: '#fff',
    outline: 'none',
    resize: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },

  errorText: {
    margin: '4px 14px 0',
    fontSize: '12px',
    color: '#F97583',
  },

  sendBtn: {
    margin: '10px 14px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    padding: '9px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-2)',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },

  success: {
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
  },
  successIcon: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'rgba(52,211,153,0.12)',
    border: '1px solid rgba(52,211,153,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  successText: {
    fontSize: '14px',
    color: 'var(--text-2)',
    margin: 0,
    lineHeight: 1.5,
  },
}
