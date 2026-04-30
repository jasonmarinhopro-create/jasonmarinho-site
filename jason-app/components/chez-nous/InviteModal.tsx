'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Copy, Check, WhatsappLogo, EnvelopeSimple, Link as LinkIcon, ShareNetwork, FacebookLogo } from '@phosphor-icons/react'

interface Props {
  open: boolean
  onClose: () => void
  inviterName: string
  inviterUserId: string
}

export default function InviteModal({ open, onClose, inviterName, inviterUserId }: Props) {
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Lien d'invitation : pointe vers l'app avec ?ref=USERID
  const baseUrl   = typeof window !== 'undefined' ? window.location.origin : 'https://app.jasonmarinho.com'
  const fromParam = inviterName ? `&from=${encodeURIComponent(inviterName)}` : ''
  const inviteUrl = `${baseUrl}/auth/register?ref=${inviterUserId}${fromParam}`
  const greeting  = inviterName ? `${inviterName} t'invite` : 'Tu es invité(e)'
  const message   = `Salut ! ${greeting} à rejoindre Chez Nous, la communauté privée des hôtes en location courte durée. Entraide, partage d'expériences, contacts par ville — tout ce qu'il faut pour bien gérer son activité.\n\nRejoins-nous ici : ${inviteUrl}`

  // Lock body scroll & escape key
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback : sélection
      const el = document.createElement('textarea')
      el.value = inviteUrl
      document.body.appendChild(el)
      el.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Rejoins Chez Nous',
          text:  message,
          url:   inviteUrl,
        })
      } catch { /* user cancelled */ }
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  const emailUrl    = `mailto:?subject=${encodeURIComponent(`${greeting} sur Chez Nous`)}&body=${encodeURIComponent(message)}`
  const fbUrl       = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}&quote=${encodeURIComponent(message)}`
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div
      style={s.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-title"
    >
      <div ref={dialogRef} style={s.dialog} className="invite-dialog">
        <button onClick={onClose} style={s.close} aria-label="Fermer">
          <X size={18} />
        </button>

        <div style={s.header}>
          <div style={s.iconCircle}>
            <ShareNetwork size={26} weight="fill" color="#FFD56B" />
          </div>
          <h2 id="invite-title" style={s.title}>Invite des amis hôtes</h2>
          <p style={s.subtitle}>
            Plus on est nombreux, plus on s&apos;entraide. Partage Chez Nous avec d&apos;autres hôtes
            que tu connais — un voisin de location, un ami sur Airbnb, une connaissance qui se lance…
          </p>
        </div>

        {/* Aperçu du message */}
        <div style={s.preview}>
          <span style={s.previewLabel}>Aperçu du message</span>
          <p style={s.previewText}>{message}</p>
        </div>

        {/* Boutons de partage */}
        <div style={s.actions}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.actionBtn, background: 'rgba(37,211,102,0.10)', borderColor: 'rgba(37,211,102,0.3)', color: '#25d366' }}
          >
            <WhatsappLogo size={18} weight="fill" /> WhatsApp
          </a>
          <a
            href={emailUrl}
            style={{ ...s.actionBtn, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }}
          >
            <EnvelopeSimple size={18} weight="fill" /> E-mail
          </a>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.actionBtn, background: 'rgba(24,119,242,0.10)', borderColor: 'rgba(24,119,242,0.3)', color: '#1877f2' }}
          >
            <FacebookLogo size={18} weight="fill" /> Facebook
          </a>
          {hasNativeShare && (
            <button
              type="button"
              onClick={nativeShare}
              style={{ ...s.actionBtn, background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
            >
              <ShareNetwork size={18} weight="fill" /> Plus…
            </button>
          )}
        </div>

        {/* Copie du lien */}
        <div style={s.linkBox}>
          <LinkIcon size={15} color="var(--text-3)" />
          <span style={s.linkText}>{inviteUrl}</span>
          <button onClick={copyLink} style={s.copyBtn}>
            {copied ? <><Check size={13} weight="bold" /> Copié</> : <><Copy size={13} /> Copier</>}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .invite-dialog { padding: 24px 20px !important; max-width: 100% !important; border-radius: 16px 16px 0 0 !important; }
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  dialog: {
    position: 'relative',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: '32px',
    width: '100%', maxWidth: '500px',
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  close: {
    position: 'absolute', top: '16px', right: '16px',
    width: '32px', height: '32px', borderRadius: '50%',
    border: 'none', background: 'var(--bg)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  header: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    marginBottom: '20px',
  },
  iconCircle: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'rgba(255,213,107,0.10)',
    border: '1px solid rgba(255,213,107,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '14px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '22px', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 6px',
  },
  subtitle: {
    fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6,
    margin: 0, maxWidth: '380px',
  },
  preview: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '12px 14px',
    marginBottom: '18px',
  },
  previewLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    display: 'block', marginBottom: '6px',
  },
  previewText: {
    fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6,
    margin: 0, whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '8px', marginBottom: '14px',
  },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    padding: '11px 14px', borderRadius: '12px',
    fontSize: '13px', fontWeight: 600, textDecoration: 'none',
    border: '1px solid', cursor: 'pointer',
  },
  linkBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '8px 10px',
  },
  linkText: {
    flex: 1, minWidth: 0,
    fontSize: '12px', color: 'var(--text-3)',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  copyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'var(--accent-text)', color: 'var(--bg)',
    border: 'none', borderRadius: '7px',
    padding: '6px 12px', fontSize: '11px', fontWeight: 700,
    cursor: 'pointer', flexShrink: 0,
  },
}
