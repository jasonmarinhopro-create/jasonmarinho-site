'use client'

import { useState, useEffect } from 'react'
import {
  X, Copy, Check, WhatsappLogo, EnvelopeSimple,
  Link as LinkIcon, ShareNetwork, FacebookLogo, UsersThree, CaretDown,
} from '@phosphor-icons/react'

interface Props {
  open: boolean
  onClose: () => void
  inviterName: string
  inviterUserId: string
}

export default function InviteModal({ open, onClose, inviterName, inviterUserId }: Props) {
  const [copied,        setCopied]        = useState<'link' | 'message' | null>(null)
  const [showPreview,   setShowPreview]   = useState(false)

  // Lien d'invitation : pointe vers /auth/register avec ?ref=USERID&from=NAME
  const baseUrl   = typeof window !== 'undefined' ? window.location.origin : 'https://app.jasonmarinho.com'
  const fromParam = inviterName ? `&from=${encodeURIComponent(inviterName)}` : ''
  const inviteUrl = `${baseUrl}/auth/register?ref=${inviterUserId}${fromParam}`
  const greeting  = inviterName ? `${inviterName} t'invite` : 'Tu es invité(e)'
  const message   = `Salut ! ${greeting} à rejoindre Chez Nous, la communauté privée des hôtes en location courte durée. Entraide entre pros, partage d'expériences, contacts par ville. Tout ce qu'il faut pour bien gérer son activité.\n\nRejoins-nous ici : ${inviteUrl}`

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

  async function copyToClipboard(text: string, kind: 'link' | 'message') {
    const fallback = () => {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(el)
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        fallback()
      }
    } catch {
      fallback()
    }
    setCopied(kind)
    setTimeout(() => setCopied(null), 2200)
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

  const shareCards: Array<{
    label: string
    sub:   string
    icon:  React.ReactNode
    bg:    string
    color: string
    href?: string
    onClick?: () => void
  }> = [
    {
      label: 'WhatsApp',
      sub:   'Le plus rapide',
      icon:  <WhatsappLogo size={28} weight="fill" />,
      bg:    'rgba(37,211,102,0.10)',
      color: '#25d366',
      href:  whatsappUrl,
    },
    {
      label: 'E-mail',
      sub:   'Avec un mot perso',
      icon:  <EnvelopeSimple size={28} weight="fill" />,
      bg:    'var(--accent-bg)',
      color: 'var(--accent-text)',
      href:  emailUrl,
    },
    {
      label: 'Facebook',
      sub:   'Sur ton mur',
      icon:  <FacebookLogo size={28} weight="fill" />,
      bg:    'rgba(24,119,242,0.10)',
      color: '#1877f2',
      href:  fbUrl,
    },
    ...(hasNativeShare
      ? [{
          label: 'Plus…',
          sub:   'SMS, Slack, etc.',
          icon:  <ShareNetwork size={28} weight="fill" />,
          bg:    'var(--bg)',
          color: 'var(--text-2)',
          onClick: nativeShare,
        }]
      : []),
  ]

  return (
    <div
      style={s.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-title"
    >
      <div style={s.dialog} className="invite-dialog">
        <button onClick={onClose} style={s.close} aria-label="Fermer">
          <X size={18} />
        </button>

        {/* Hero */}
        <div style={s.header}>
          <div style={s.iconCircle}>
            <UsersThree size={30} weight="fill" color="var(--accent-text)" />
            <span style={s.iconBadge}>+</span>
          </div>
          <h2 id="invite-title" style={s.title}>Invite des amis hôtes</h2>
          <p style={s.subtitle}>
            Plus on est nombreux, plus l&apos;entraide est riche. Ils créeront leur compte
            gratuit en 30 secondes et auront accès à toute la communauté.
          </p>
        </div>

        {/* Cards de partage */}
        <div style={s.shareGrid} className="cn-share-grid">
          {shareCards.map((card) => {
            const inner = (
              <>
                <div style={{ ...s.shareIcon, background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <span style={s.shareLabel}>{card.label}</span>
                <span style={s.shareSub}>{card.sub}</span>
              </>
            )
            const baseStyle = s.shareCard
            if (card.href) {
              return (
                <a
                  key={card.label}
                  href={card.href}
                  target={card.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  style={baseStyle}
                  className="cn-share-card"
                >
                  {inner}
                </a>
              )
            }
            return (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                style={{ ...baseStyle, cursor: 'pointer' } as React.CSSProperties}
                className="cn-share-card"
              >
                {inner}
              </button>
            )
          })}
        </div>

        {/* Lien direct + Copier */}
        <div style={s.linkSection}>
          <span style={s.sectionLabel}>Ou copie le lien</span>
          <div style={s.linkBox}>
            <LinkIcon size={14} color="var(--text-3)" />
            <span style={s.linkText}>{inviteUrl}</span>
            <button onClick={() => copyToClipboard(inviteUrl, 'link')} style={s.copyBtn}>
              {copied === 'link'
                ? <><Check size={13} weight="bold" /> Copié</>
                : <><Copy size={13} /> Copier</>
              }
            </button>
          </div>
        </div>

        {/* Aperçu message (collapsible) */}
        <button
          type="button"
          onClick={() => setShowPreview(v => !v)}
          style={s.previewToggle}
        >
          <CaretDown
            size={13}
            style={{ transition: 'transform 0.2s', transform: showPreview ? 'rotate(180deg)' : 'rotate(0)' }}
          />
          {showPreview ? 'Masquer' : 'Voir'} l&apos;aperçu du message
        </button>
        {showPreview && (
          <div style={s.preview}>
            <p style={s.previewText}>{message}</p>
            <button
              onClick={() => copyToClipboard(message, 'message')}
              style={s.copyMessageBtn}
            >
              {copied === 'message'
                ? <><Check size={12} weight="bold" /> Message copié</>
                : <><Copy size={12} /> Copier le message complet</>
              }
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes invite-pop-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .invite-dialog { animation: invite-pop-in 0.22s ease-out; }
        .cn-share-card { transition: transform 0.15s, border-color 0.15s, background 0.15s; }
        .cn-share-card:hover { transform: translateY(-2px); border-color: var(--accent-border); background: var(--bg); }
        @media (max-width: 560px) {
          .invite-dialog {
            padding: 24px 20px !important;
            max-width: 100% !important;
            border-radius: 16px 16px 0 0 !important;
            margin-top: auto;
          }
          .cn-share-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  dialog: {
    position: 'relative',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '20px', padding: '32px',
    width: '100%', maxWidth: '520px',
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  close: {
    position: 'absolute', top: '16px', right: '16px',
    width: '32px', height: '32px', borderRadius: '50%',
    border: 'none', background: 'var(--bg)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    marginBottom: '24px',
  },
  iconCircle: {
    position: 'relative',
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'var(--accent-bg)',
    border: '1.5px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '16px',
  },
  iconBadge: {
    position: 'absolute', bottom: '-2px', right: '-2px',
    width: '24px', height: '24px', borderRadius: '50%',
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontSize: '16px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid var(--surface)',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '24px', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '13.5px', color: 'var(--text-3)', lineHeight: 1.65,
    margin: 0, maxWidth: '400px',
  },

  shareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '10px',
    marginBottom: '22px',
  },
  shareCard: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    gap: '6px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '16px 10px',
    textDecoration: 'none', color: 'var(--text)',
    fontFamily: 'inherit',
  },
  shareIcon: {
    width: '50px', height: '50px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '4px',
  },
  shareLabel: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
  },
  shareSub: {
    fontSize: '11px', color: 'var(--text-muted)',
  },

  linkSection: {
    marginBottom: '14px',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--text-muted)',
    marginBottom: '8px',
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
    fontFamily: 'inherit',
  },

  previewToggle: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', fontSize: '12px',
    cursor: 'pointer', padding: '4px 0',
    fontFamily: 'inherit',
  },
  preview: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 14px',
    marginTop: '8px',
  },
  previewText: {
    fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.65,
    margin: '0 0 10px', whiteSpace: 'pre-wrap' as const,
  },
  copyMessageBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'transparent',
    border: '1px solid var(--border)', borderRadius: '7px',
    padding: '5px 10px', fontSize: '11px', fontWeight: 600,
    color: 'var(--text-2)', cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
