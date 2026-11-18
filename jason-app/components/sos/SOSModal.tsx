'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  X, Lock, ArrowRight, Warning,
  Cat, Cigarette, ProhibitInset, ShieldCheck, MagnifyingGlass, WarningOctagon,
} from '@phosphor-icons/react/dist/ssr'
import { SOS_SCENARIOS, type Channel } from '@/lib/sos/scenarios'

/* SOS Modal — Module d'urgence accessible depuis le header.
   Affiche les scénarios SOS, sur 4 canaux : Airbnb, Booking, Vrbo, Direct.

   Plan d'accès :
   - Découverte : voit la liste mais avec cadenas + CTA Standard
   - Standard / Driing : accès complet aux pas-à-pas

   Click sur une carte → navigation vers /dashboard/sos/[scenario]

   IMPORTANT : pour importer SOS_SCENARIOS depuis un Server Component,
   utiliser '@/lib/sos/scenarios' directement (ce module est 'use client',
   ses exports deviennent des client references côté serveur).
*/

const CHANNEL_LABELS: Record<Channel, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking',
  vrbo: 'Vrbo / Abritel',
  direct: 'Direct (sans plateforme)',
}

interface Props {
  open: boolean
  onClose: () => void
  plan: 'decouverte' | 'standard' | 'driing'
}

export default function SOSModal({ open, onClose, plan }: Props) {
  const router = useRouter()
  const [selectedChannel, setSelectedChannel] = useState<Channel>('airbnb')
  const [verifyQuery, setVerifyQuery] = useState('')
  const isLocked = plan === 'decouverte'

  // Fermeture sur Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSelect(slug: string) {
    if (isLocked) {
      router.push('/dashboard/abonnement?source=sos')
      return
    }
    router.push(`/dashboard/sos/${slug}?canal=${selectedChannel}`)
    onClose()
  }

  // Sécurité voyageur (18/11/2026) : sortie du menu de gauche, elle ouvre le
  // SOS. La recherche mène à la page Sécurité (?q=, déjà lue par la page).
  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const q = verifyQuery.trim()
    router.push(q ? `/dashboard/securite?q=${encodeURIComponent(q)}` : '/dashboard/securite')
    onClose()
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <style>{`
        @keyframes sos-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sos-modal-in {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @media (max-width: 720px) {
          .sos-modal { max-width: 100% !important; max-height: 100% !important;
            border-radius: 0 !important; height: 100dvh !important; }
        }
      `}</style>
      <div style={s.modal} className="sos-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={s.modalHeader}>
          <div style={s.titleBlock}>
            <div style={s.badge}>
              <Warning size={11} weight="fill" />
              SOS Hôte
            </div>
            <h2 style={s.title}>Vérifie avant de dire oui, agis si ça tourne mal</h2>
            <p style={s.subtitle}>
              La base des hôtes pour vérifier un voyageur, puis le pas-à-pas pour chaque problème.
            </p>
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Avant d'accepter : Sécurité voyageur */}
        <section style={s.verify} aria-label="Vérifier un voyageur">
          <div style={s.verifyHead}>
            <ShieldCheck size={16} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
            <span style={s.sectionTitle}>Avant d&apos;accepter un voyageur</span>
          </div>
          <form onSubmit={handleVerify} style={s.verifyForm}>
            <label htmlFor="sos-verify" style={s.srOnly}>E-mail, téléphone ou nom du voyageur</label>
            <div style={s.verifyField}>
              <MagnifyingGlass size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <input
                id="sos-verify"
                type="search"
                value={verifyQuery}
                onChange={e => setVerifyQuery(e.target.value)}
                placeholder="E-mail, téléphone ou prénom et nom"
                style={s.verifyInput}
                autoComplete="off"
              />
            </div>
            <button type="submit" style={s.verifyBtn}>Vérifier</button>
          </form>
          <div style={s.verifyLinks}>
            <Link prefetch={false} href="/dashboard/securite?signaler=1" onClick={onClose} style={s.verifyLink}>
              <WarningOctagon size={13} weight="bold" /> Signaler un voyageur
            </Link>
            <Link href="/dashboard/securite" onClick={onClose} style={s.verifyLink}>
              Ouvrir Sécurité voyageur <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        </section>

        <div style={s.sectionTitleRow}>
          <Warning size={15} weight="fill" style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={s.sectionTitle}>J&apos;ai un problème</span>
        </div>

        {/* Channel selector */}
        <div style={s.channelRow}>
          <span style={s.channelLabel}>Canal concerné :</span>
          {(Object.keys(CHANNEL_LABELS) as Channel[]).map(ch => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              style={{
                ...s.channelChip,
                ...(selectedChannel === ch ? s.channelChipActive : {}),
              }}
            >
              {CHANNEL_LABELS[ch]}
            </button>
          ))}
        </div>

        {/* Locked banner pour Découverte */}
        {isLocked && (
          <div style={s.lockBanner}>
            <Lock size={14} weight="fill" />
            <span>
              <strong>Accès complet réservé aux plans Standard & Driing.</strong>
              {' '}Tu peux consulter la liste mais le pas-à-pas est verrouillé.
            </span>
          </div>
        )}

        {/* Scenarios grid */}
        <div style={s.grid}>
          {SOS_SCENARIOS.map(sc => {
            const Icon = sc.icon
            const channelSupported = sc.channels.includes(selectedChannel)
            return (
              <button
                key={sc.slug}
                onClick={() => handleSelect(sc.slug)}
                disabled={!channelSupported}
                style={{
                  ...s.card,
                  ...(channelSupported ? {} : s.cardDisabled),
                  ...(isLocked ? s.cardLocked : {}),
                }}
              >
                <div style={s.cardHeader}>
                  <div style={{
                    ...s.cardIcon,
                    background: sc.urgency === 'high' ? 'rgba(220,38,38,0.10)' : 'rgba(217,119,6,0.10)',
                    color: sc.urgency === 'high' ? 'var(--danger)' : '#b45309',
                  }}>
                    <Icon size={20} weight="bold" />
                  </div>
                  {isLocked && <Lock size={13} style={{ color: 'var(--text-3)' }} />}
                </div>
                <div style={s.cardTitle}>{sc.title}</div>
                <div style={s.cardShort}>{sc.short}</div>
                {!channelSupported && (
                  <div style={s.cardUnsupported}>
                    <ProhibitInset size={11} /> Pas applicable sur {CHANNEL_LABELS[selectedChannel]}
                  </div>
                )}
                {channelSupported && !isLocked && (
                  <div style={s.cardCta}>
                    Ouvrir le pas-à-pas <ArrowRight size={12} weight="bold" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer disclaimer + contact direct */}
        <div style={s.footer}>
          <span style={s.footerText}>
            Guide pédagogique mis à jour régulièrement. Pour les cas complexes ou montants &gt; 5 000 €,
            consulte un avocat. Besoin d&apos;aide directe&nbsp;?{' '}
            <Link href="/dashboard/aide" style={s.footerLink}>Contacte Jason</Link>.
          </span>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  verify: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 20,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  verifyHead: { display: 'flex', alignItems: 'center', gap: 8 },
  sectionTitleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  verifyForm: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  verifyField: {
    flex: '1 1 220px', minWidth: 0,
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: 9, padding: '0 12px', height: 40,
  },
  verifyInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
    color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', height: '100%',
  },
  verifyBtn: {
    height: 40, padding: '0 18px', borderRadius: 9,
    border: '1px solid var(--accent-text)', background: 'var(--accent-text)', color: 'var(--bg)',
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  },
  verifyLinks: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  verifyLink: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none',
  },
  srOnly: {
    position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
    overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
    animation: 'sos-overlay-in 0.2s ease forwards',
  },
  modal: {
    background: 'var(--bg)',
    border: '1px solid var(--border-2)',
    borderRadius: '16px',
    width: '100%', maxWidth: '760px',
    maxHeight: 'calc(100vh - 32px)',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    animation: 'sos-modal-in 0.28s cubic-bezier(.22,.61,.36,1) forwards',
  },
  modalHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '12px', marginBottom: '20px',
  },
  titleBlock: { flex: 1 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10.5px', fontWeight: 700,
    letterSpacing: '0.6px', textTransform: 'uppercase' as const,
    color: 'var(--danger)',
    background: 'rgba(220,38,38,0.10)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: '999px',
    padding: '3px 9px',
    marginBottom: '10px',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '22px', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 6px',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '13px', color: 'var(--text-2)',
    margin: 0, lineHeight: 1.55,
  },
  closeBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', cursor: 'pointer',
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-2)', flexShrink: 0,
  },

  channelRow: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
    marginBottom: '16px',
  },
  channelLabel: {
    fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    color: 'var(--text-3)', marginRight: '4px',
  },
  channelChip: {
    padding: '6px 12px', borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-2)',
    fontSize: '12.5px', fontFamily: 'inherit',
    cursor: 'pointer', transition: 'all 0.12s',
  },
  channelChipActive: {
    background: 'var(--accent-bg-2)',
    borderColor: 'var(--accent-border-2)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },

  lockBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: '10px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--text-2)',
    fontSize: '12.5px', lineHeight: 1.5,
    marginBottom: '16px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
    marginBottom: '18px',
  },
  card: {
    display: 'flex', flexDirection: 'column' as const,
    gap: '6px', textAlign: 'left' as const,
    padding: '14px 14px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  cardDisabled: {
    opacity: 0.4, cursor: 'not-allowed',
  },
  cardLocked: {
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '6px',
  },
  cardIcon: {
    width: '36px', height: '36px', borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '13.5px', fontWeight: 600,
    color: 'var(--text)', lineHeight: 1.35,
  },
  cardShort: {
    fontSize: '12px', color: 'var(--text-3)',
    lineHeight: 1.5,
  },
  cardUnsupported: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', color: 'var(--text-3)',
    marginTop: '6px',
  },
  cardCta: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11.5px', fontWeight: 600,
    color: 'var(--accent-text)',
    marginTop: '6px',
  },

  footer: {
    padding: '12px 14px',
    background: 'var(--surface-2)',
    borderRadius: '10px',
    fontSize: '11.5px', color: 'var(--text-3)',
    lineHeight: 1.6,
  },
  footerText: {},
  footerLink: {
    color: 'var(--accent-text)', textDecoration: 'underline',
    fontWeight: 500,
  },
}
