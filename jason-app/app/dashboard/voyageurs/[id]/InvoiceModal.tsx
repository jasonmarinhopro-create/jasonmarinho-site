'use client'

// Fenêtre « Facture » d'un séjour (05/10/2026, demande de Jason : « revoir la
// facture avec les partenaires »). Avant : une petite icône ouvrait
// directement la facture, sans rien expliquer. Maintenant : ce que contient
// la facture de l'app, pour qui elle suffit, puis les règles de la facture
// électronique avec Tiime et Indy (liens affiliés signalés).
import { useState } from 'react'
import Link from 'next/link'
import { X, Receipt, CheckCircle, ArrowSquareOut, Warning, IdentificationCard } from '@phosphor-icons/react/dist/ssr'
import HostInvoicingNotice from '@/components/finances/HostInvoicingNotice'

interface Props {
  guest: string
  logement: string | null
  dateArrivee: string
  dateDepart: string
  montant: number | null
  /** Pays du logement (FR par défaut) */
  pays: string
  loading: boolean
  onOpen: () => Promise<string | null>
  onClose: () => void
}

const fmtDay = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export default function InvoiceModal({ guest, logement, dateArrivee, dateDepart, montant, pays, loading, onOpen, onClose }: Props) {
  const [error, setError] = useState<string | null>(null)
  const isPT = pays === 'PT'

  async function open() {
    setError(null)
    const err = await onOpen()
    if (err) setError(err)
  }

  return (
    <div style={s.overlay} role="dialog" aria-modal="true" aria-labelledby="inv-title">
      <div style={s.modal}>
        <header style={s.header}>
          <div style={{ minWidth: 0 }}>
            <p style={s.eyebrow}><Receipt size={13} weight="fill" style={{ verticalAlign: '-2px', marginRight: 5 }} />Facture du séjour</p>
            <h2 id="inv-title" style={s.title}>{guest}</h2>
            <p style={s.sub}>
              {logement ? `${logement} · ` : ''}du {fmtDay(dateArrivee)} au {fmtDay(dateDepart)}
              {montant != null ? ` · ${montant.toLocaleString('fr-FR')} €` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} style={s.close} aria-label="Fermer"><X size={18} /></button>
        </header>

        <div style={s.body}>
          {isPT ? (
            <div style={s.warn}>
              <Warning size={18} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0 }}>
                <strong>Logement au Portugal :</strong> la vraie fatura se fait sur le Portail des Finances (e-fatura) ou avec un logiciel certifié AT.
                Le document de l&apos;app reste un récapitulatif pour ton voyageur, pas une fatura.
              </p>
            </div>
          ) : null}

          <section style={s.card}>
            <h3 style={s.cardTitle}>La facture de l&apos;app</h3>
            <ul style={s.list}>
              <li style={s.li}><CheckCircle size={16} weight="fill" color="var(--accent-text)" style={s.ic} /> Reprend le loyer du contrat signé, tes coordonnées et celles du voyageur. La caution n&apos;y figure jamais (ce n&apos;est pas un revenu).</li>
              <li style={s.li}><CheckCircle size={16} weight="fill" color="var(--accent-text)" style={s.ic} /> Numéro unique attribué à la première ouverture (FA2026-0001, puis 0002…), sans trou. Rouvrir la facture garde le même numéro.</li>
              <li style={s.li}><CheckCircle size={16} weight="fill" color="var(--accent-text)" style={s.ic} /> À imprimer ou enregistrer en PDF, puis à envoyer au voyageur.</li>
            </ul>
            <p style={s.hint}>
              <IdentificationCard size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Ton SIRET et ta mention de TVA viennent de <Link href="/dashboard/profil#facturation" style={s.link}>Mon compte → Factures</Link>. Vérifie-les avant la première facture.
            </p>
            {error && <p style={s.error} role="alert">{error}</p>}
            <button type="button" onClick={open} disabled={loading} style={{ ...s.primary, opacity: loading ? 0.7 : 1 }}>
              <ArrowSquareOut size={15} weight="bold" /> {loading ? 'Ouverture…' : 'Ouvrir la facture'}
            </button>
          </section>

          {!isPT && <HostInvoicingNotice />}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,20,14,0.5)',
    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px, 3vw, 28px)',
  },
  modal: {
    width: '100%', maxWidth: 640, maxHeight: 'calc(100dvh - 16px)', display: 'flex', flexDirection: 'column',
    background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 20, overflow: 'hidden',
    boxShadow: 'var(--shadow-xl)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexShrink: 0,
    padding: 'clamp(16px, 3vw, 22px) clamp(16px, 3vw, 24px)',
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
    borderBottom: '1px solid var(--accent-border)',
  },
  eyebrow: { fontSize: 11.5, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--accent-text)', margin: '0 0 6px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(21px, 3vw, 26px)', fontWeight: 400, margin: 0, color: 'var(--text)' },
  sub: { fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0', lineHeight: 1.5 },
  close: {
    width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 'clamp(14px, 3vw, 22px) clamp(16px, 3vw, 24px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 17, fontWeight: 500, margin: 0, color: 'var(--text)' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  li: { display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.55 },
  ic: { flexShrink: 0, marginTop: 2 },
  hint: { fontSize: 12.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.55 },
  link: { color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'none' },
  error: { fontSize: 13, color: 'var(--danger)', margin: 0 },
  primary: {
    alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 11,
    background: 'var(--accent-text)', color: 'var(--bg)', border: '1px solid var(--accent-text)',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  warn: {
    display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.55,
    background: 'rgba(255,213,107,0.16)', border: '1px solid rgba(183,121,31,0.3)', color: '#8A5A12',
  },
}
