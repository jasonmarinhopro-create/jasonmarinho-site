'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CurrencyEur, ArrowsClockwise, Bank, CheckCircle, Warning,
  Calendar, EnvelopeSimple, Info, ArrowSquareOut, Receipt, Clock, PaperPlaneTilt, PenNib,
} from '@phosphor-icons/react/dist/ssr'
import type { EncaissementsSummary, ContractImpaye } from '@/lib/stripe/connect-queries'
import TourTrigger from '@/components/dashboard/TourTrigger'

interface Props {
  summary: EncaissementsSummary
  impayes: ContractImpaye[]
  planLabel: string
  /** Précision quand un logement est sélectionné (le solde Stripe est celui du compte) */
  scopeNote?: string
}

const PAYOUT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  paid:       { label: 'Versé',           color: 'var(--accent-text)' },
  in_transit: { label: 'En transit',      color: 'var(--accent-text)' },
  pending:    { label: 'En attente',      color: 'var(--text-3)' },
  failed:     { label: 'Échec',           color: 'var(--danger)' },
  canceled:   { label: 'Annulé',          color: 'var(--text-3)' },
}

function fmtEur(centimes: number): string {
  return (centimes / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' €'
}

function fmtDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtRelativeDate(unixSeconds: number): string {
  const days = Math.round((unixSeconds * 1000 - Date.now()) / (24 * 3600 * 1000))
  if (days === 0) return 'aujourd\'hui'
  if (days === 1) return 'demain'
  if (days === -1) return 'hier'
  if (days > 0) return `dans ${days} j`
  return `il y a ${Math.abs(days)} j`
}

function buildRappelMailto(c: ContractImpaye): string {
  if (!c.locataire_email) return '#'
  const subject = encodeURIComponent(`Rappel paiement : séjour à ${c.logement_nom ?? 'votre logement'}`)
  const arrivee = c.date_arrivee
    ? new Date(c.date_arrivee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const body = encodeURIComponent(
`Bonjour ${c.locataire_prenom ?? ''},

Je n'ai pas encore reçu le paiement pour votre séjour à ${c.logement_nom ?? 'mon logement'} prévu le ${arrivee}.

Pour finaliser votre réservation, merci de procéder au règlement de ${c.montant_du ? `${c.montant_du.toLocaleString('fr-FR')} €` : 'votre acompte'} via le lien sécurisé qui vous a été envoyé.

Si vous avez perdu le lien ou rencontrez un problème, n'hésitez pas à me répondre, je vous le renvoie.

Merci d'avance,
`)
  return `mailto:${c.locataire_email}?subject=${subject}&body=${body}`
}

function ResendPaymentButton({ contractId, name }: { contractId: string; name: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/contracts/resend-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contractId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? "L'envoi a échoué.")
      setState('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'envoi a échoué.")
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <span style={{ ...s.btnGhost, color: 'var(--accent-text)', borderColor: 'var(--accent-border)' }} role="status">
        <CheckCircle size={13} weight="fill" />
        Lien envoyé
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <button
        type="button"
        onClick={send}
        disabled={state === 'sending'}
        style={{ ...s.btnRappel, border: 'none', cursor: state === 'sending' ? 'wait' : 'pointer', opacity: state === 'sending' ? 0.7 : 1 }}
        aria-label={`Renvoyer le lien de paiement à ${name}`}
      >
        <PaperPlaneTilt size={13} weight="fill" />
        {state === 'sending' ? 'Envoi…' : 'Renvoyer le lien'}
      </button>
      {error && <span style={{ fontSize: '11px', color: 'var(--danger)', maxWidth: '240px', textAlign: 'right' }}>{error}</span>}
    </span>
  )
}

export default function EncaissementsView({ summary, impayes, scopeNote }: Props) {
  const isOnboarded = summary.hasOnboarded

  // Total impayé attendu (pour la stat en haut)
  const totalImpaye = useMemo(
    () => impayes.reduce((sum, c) => sum + (c.montant_du ?? 0), 0),
    [impayes],
  )

  // L'hôte est onboarded mais n'a strictement rien encaissé encore :
  // empty state explicite pour ne pas laisser croire à un bug.
  const isOnboardedButEmpty =
    isOnboarded &&
    summary.balance.available === 0 &&
    summary.balance.pending === 0 &&
    summary.monthToDate.chargeCount === 0 &&
    summary.recentPayouts.length === 0 &&
    summary.recentFailedCharges.length === 0 &&
    impayes.length === 0

  return (
    <div style={s.page}>
      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-3)', lineHeight: 1.55, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
        <span>Les loyers et acomptes payés par carte sur tes contrats directs (Stripe).{scopeNote ? ` ${scopeNote}` : ''} Les versements Airbnb et Booking n&apos;apparaissent pas ici : ils sont dans Revenus et Journal.</span>
        <TourTrigger />
      </p>

      {!summary.hasAccount && (
        <div style={s.banner}>
          <div style={s.bannerIcon} aria-hidden="true">
            <Warning size={20} weight="duotone" color="#B7791F" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={s.bannerTitle}>Compte Stripe non configuré</div>
            <div style={s.bannerBody}>
              Pour encaisser tes loyers par carte et suivre tes virements ici, connecte ton compte Stripe (10 min environ).
            </div>
          </div>
          <Link href="/dashboard/profil#stripe" style={s.bannerCta}>
            Configurer →
          </Link>
        </div>
      )}

      {summary.hasAccount && !isOnboarded && (
        <div style={s.banner}>
          <div style={s.bannerIcon} aria-hidden="true">
            <Clock size={20} weight="duotone" color="#B7791F" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={s.bannerTitle}>Inscription Stripe à terminer</div>
            <div style={s.bannerBody}>
              Ton compte Stripe est créé, mais l'inscription n'est pas terminée : tu ne peux pas encore recevoir de virements.
            </div>
          </div>
          <Link href="/dashboard/profil#stripe" style={s.bannerCta}>
            Terminer →
          </Link>
        </div>
      )}

      {/* ─── Empty state quand l'hôte est prêt mais n'a encore rien encaissé ─── */}
      {isOnboardedButEmpty && (
        <div style={s.emptyReady}>
          <div style={s.emptyReadyIcon} aria-hidden="true">
            <CheckCircle size={32} weight="duotone" color="var(--accent-text)" />
          </div>
          <h2 style={s.emptyReadyTitle}>Tu es prêt à encaisser</h2>
          <p style={s.emptyReadyBody}>
            Ton compte Stripe est configuré et opérationnel. Dès ton premier paiement reçu (loyer, caution),
            il apparaîtra ici avec le détail du virement, la date d'arrivée et le statut.
          </p>
          <div style={s.emptyReadyHint}>
            En attendant, le paiement en ligne s'active à la création d'un contrat, depuis{' '}
            <Link href="/dashboard/contrats" style={{ color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600 }}>
              Contrats & paiements
            </Link>.
          </div>
        </div>
      )}

      {/* ─── Stats top : Solde + Prochain virement + Encaissé mois + Impayés ─── */}
      <div style={s.statsGrid}>
        <StatBox
          label="Solde disponible"
          value={isOnboarded ? fmtEur(summary.balance.available) : '-'}
          sub={isOnboarded && summary.balance.pending > 0 ? `+ ${fmtEur(summary.balance.pending)} en attente` : isOnboarded ? 'Aucun montant en attente' : 'Inscription Stripe à terminer'}
          icon={<CurrencyEur size={16} weight="fill" />}
          accent
        />
        <StatBox
          label="Prochain virement"
          value={summary.nextPayout ? fmtEur(summary.nextPayout.amount) : isOnboarded ? 'Aucun prévu' : '-'}
          sub={summary.nextPayout?.arrivalDate
            ? `Arrivée ${fmtDate(summary.nextPayout.arrivalDate)} (${fmtRelativeDate(summary.nextPayout.arrivalDate)})`
            : isOnboarded ? 'Tu seras payé dès que tu auras du solde disponible' : ''}
          icon={<Bank size={16} weight="fill" />}
        />
        <StatBox
          label="Encaissé ce mois"
          value={fmtEur(summary.monthToDate.grossEur)}
          sub={summary.monthToDate.chargeCount > 0
            ? `${summary.monthToDate.chargeCount} paiement${summary.monthToDate.chargeCount > 1 ? 's' : ''} · Net ~${fmtEur(summary.monthToDate.netEur)}`
            : 'Aucun encaissement ce mois-ci'}
          icon={<Receipt size={16} weight="fill" />}
        />
        <StatBox
          label="À relancer"
          value={impayes.length === 0 ? '0' : String(impayes.length)}
          sub={impayes.length > 0
            ? `${fmtEur(totalImpaye * 100)} à encaisser`
            : 'Tout est à jour'}
          icon={<Warning size={16} weight="fill" />}
          tone={impayes.length > 0 ? 'warning' : undefined}
        />
      </div>

      {/* ─── Impayés à relancer ─── */}
      {impayes.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            <Warning size={18} weight="fill" color="#B7791F" /> Paiements à relancer
          </h2>
          <p style={s.sectionDesc}>
            Séjours dont l'arrivée est dans 7 jours ou moins (ou passée) et dont le paiement en ligne n'est pas encaissé.
            « Renvoyer le lien » envoie au voyageur l'email de paiement avec le lien sécurisé, dans la langue du contrat.
          </p>
          <div style={s.list}>
            {impayes.map(c => {
              const fullName = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Voyageur'
              const isLate = c.daysOverdue > 0
              return (
                <div key={c.id} style={{ ...s.row, ...(isLate ? s.rowDanger : {}) }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.rowTitle}>
                      {fullName}
                      {isLate && (
                        <span style={s.lateBadge}>
                          En retard de {c.daysOverdue} j
                        </span>
                      )}
                      {!isLate && (
                        <span style={s.soonBadge}>
                          Arrivée {c.daysOverdue === 0 ? "aujourd'hui" : c.daysOverdue === -1 ? 'demain' : `dans ${-c.daysOverdue} j`}
                        </span>
                      )}
                    </div>
                    <div style={s.rowSub}>
                      {c.logement_nom ?? '-'} · {c.montant_du ? `${c.montant_du.toLocaleString('fr-FR')} €` : '-'}
                      {c.acompte_percent < 100 && ` (acompte ${c.acompte_percent} %)`}
                      {c.date_arrivee && ` · ${new Date(`${c.date_arrivee}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC' })}`}
                    </div>
                  </div>
                  <div style={s.rowActions}>
                    {c.statut !== 'signe' ? (
                      <Link href="/dashboard/contrats" style={s.btnGhost} title="Le lien de paiement part avec la signature">
                        <PenNib size={13} weight="fill" />
                        Pas encore signé
                      </Link>
                    ) : c.locataire_email ? (
                      <>
                        <ResendPaymentButton contractId={c.id} name={fullName} />
                        <a
                          href={buildRappelMailto(c)}
                          style={s.btnGhost}
                          aria-label={`Écrire à ${fullName} depuis ta messagerie`}
                          title="Écrire depuis ta messagerie"
                        >
                          <EnvelopeSimple size={13} weight="fill" />
                          Écrire
                        </a>
                      </>
                    ) : (
                      <span style={{ ...s.btnRappel, opacity: 0.4, cursor: 'not-allowed' }} title="Email du voyageur manquant">
                        <EnvelopeSimple size={13} weight="fill" />
                        Email manquant
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── Échecs de paiement récents ─── */}
      {summary.recentFailedCharges.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            <Warning size={18} weight="fill" color="var(--danger)" /> Échecs de paiement (30 derniers jours)
          </h2>
          <div style={s.list}>
            {summary.recentFailedCharges.map(c => (
              <div key={c.id} style={{ ...s.row, ...s.rowDanger }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.rowTitle}>
                    {fmtEur(c.amount)} · {c.customerEmail ?? c.description ?? 'Paiement'}
                  </div>
                  <div style={s.rowSub}>
                    {fmtDate(c.created)}
                    {c.failureMessage && ` · ${c.failureMessage}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Payouts récents ─── */}
      {isOnboarded && summary.recentPayouts.length > 0 && (
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            <ArrowsClockwise size={18} weight="fill" color="var(--accent-text)" /> Virements récents
          </h2>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Montant</th>
                  <th style={s.th}>Statut</th>
                  <th style={s.th}>Méthode</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentPayouts.map(p => {
                  const status = PAYOUT_STATUS_LABEL[p.status] ?? { label: p.status, color: 'var(--text-3)' }
                  return (
                    <tr key={p.id}>
                      <td style={s.td}>
                        <div style={{ fontWeight: 500 }}>{fmtDate(p.arrivalDate)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{fmtRelativeDate(p.arrivalDate)}</div>
                      </td>
                      <td style={{ ...s.td, fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', fontWeight: 500 }}>
                        {fmtEur(p.amount)}
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.statusPill, color: status.color, borderColor: status.color + '33' }}>
                          {p.status === 'paid' && <CheckCircle size={11} weight="fill" />}
                          {p.status === 'failed' && <Warning size={11} weight="fill" />}
                          {(p.status === 'in_transit' || p.status === 'pending') && <Clock size={11} weight="fill" />}
                          {status.label}
                        </span>
                        {p.failureMessage && (
                          <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '3px' }}>{p.failureMessage}</div>
                        )}
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: '12px', color: 'var(--text-2)', textTransform: 'capitalize' as const }}>
                          {p.method === 'standard' ? 'Virement standard' : p.method}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={12} weight="fill" />
            Pour le détail complet, ouvre ton <a href="https://dashboard.stripe.com/payouts" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>tableau de bord Stripe <ArrowSquareOut size={10} weight="bold" /></a>.
          </p>
        </section>
      )}

      <p style={s.footer}>
        <Calendar size={11} weight="fill" />
        Chiffres lus en direct chez Stripe. Stripe verse ton solde sur ton compte bancaire tous les jours ouvrés (2 à 3 jours de délai en Europe).
      </p>
    </div>
  )
}

function StatBox({ label, value, sub, icon, accent, tone }: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent?: boolean
  tone?: 'warning'
}) {
  const isWarning = tone === 'warning'
  return (
    <div style={{
      ...s.statBox,
      ...(accent ? s.statBoxAccent : {}),
      ...(isWarning ? s.statBoxWarning : {}),
    }}>
      <div style={s.statHead}>
        <span style={s.statLabel}>{label}</span>
        <span aria-hidden="true" style={{ ...s.statIcon, ...(accent ? { color: 'var(--accent-text)' } : {}), ...(isWarning ? { color: '#B7791F' } : {}) }}>
          {icon}
        </span>
      </div>
      <div style={{ ...s.statValue, ...(accent ? { color: 'var(--accent-text)' } : {}) }}>{value}</div>
      <div style={s.statSub}>{sub}</div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '20px var(--dash-page-px) 48px', width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 16 },
  hero: { marginBottom: '4px' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase' as const,
    color: 'var(--accent-text)', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '12px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 8px',
  },
  heroDesc: { fontSize: '14px', lineHeight: 1.6, color: 'var(--text-2)', maxWidth: '620px', margin: 0 },

  banner: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 18px', borderRadius: '14px',
    background: 'rgba(255,213,107,0.14)',
    border: '1px solid rgba(255,213,107,0.4)',
    flexWrap: 'wrap' as const,
  },
  bannerIcon: {
    width: '40px', height: '40px', borderRadius: '12px',
    background: 'rgba(255,213,107,0.22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bannerTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  bannerBody: { fontSize: '12.5px', color: 'var(--text-2)', marginTop: '2px', lineHeight: 1.5 },
  bannerCta: {
    padding: '9px 16px', borderRadius: '10px',
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontSize: '12.5px', fontWeight: 700,
    textDecoration: 'none', whiteSpace: 'nowrap' as const,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'clamp(10px, 1.5vw, 14px)',
  },

  emptyReady: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', textAlign: 'center' as const,
    padding: 'clamp(28px, 4vw, 44px) 24px',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: 'var(--r-xl, 18px)',
    gap: '10px',
  },
  emptyReadyIcon: {
    width: '64px', height: '64px', borderRadius: '20px',
    background: 'var(--accent-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '6px',
  },
  emptyReadyTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '22px', fontWeight: 400, color: 'var(--text)',
    margin: 0, letterSpacing: '-0.01em',
  },
  emptyReadyBody: {
    fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.6,
    margin: 0, maxWidth: '440px',
  },
  emptyReadyHint: {
    fontSize: '12.5px', color: 'var(--text-3)', lineHeight: 1.6,
    marginTop: '4px', padding: '10px 14px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  statBox: {
    padding: '18px 20px', borderRadius: 'var(--r-xl, 18px)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column' as const, gap: '4px', minWidth: 0,
  },
  statBoxAccent: {
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
  },
  statBoxWarning: {
    background: 'rgba(255,213,107,0.10)',
    border: '1px solid rgba(255,213,107,0.4)',
  },
  statHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  statLabel: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
  },
  statIcon: { color: 'var(--text-3)', display: 'inline-flex' },
  statValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '24px', fontWeight: 400, color: 'var(--text)',
    letterSpacing: '-0.01em',
  },
  statSub: { fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.5 },

  section: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl, 18px)', padding: 'clamp(16px, 2.2vw, 24px)', minWidth: 0,
  },
  sectionTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 500, color: 'var(--text)',
    margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  sectionDesc: { fontSize: '13px', color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.5 },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '12px 14px', borderRadius: '10px',
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    flexWrap: 'wrap' as const,
  },
  rowDanger: {
    background: 'var(--danger-bg)',
    borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)',
  },
  rowTitle: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  rowSub: { fontSize: '11.5px', color: 'var(--text-3)', marginTop: '2px' },
  rowActions: { display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap' as const },
  btnRappel: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px',
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontSize: '12px', fontWeight: 600,
    textDecoration: 'none', fontFamily: 'inherit',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 12px', borderRadius: '8px',
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)',
    fontSize: '12px', fontWeight: 600,
    textDecoration: 'none', fontFamily: 'inherit',
  },
  lateBadge: {
    fontSize: '10.5px', fontWeight: 700, padding: '2px 8px',
    borderRadius: '999px', background: 'var(--danger-bg)',
    color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
    letterSpacing: '0.2px',
  },
  soonBadge: {
    fontSize: '10.5px', fontWeight: 700, padding: '2px 8px',
    borderRadius: '999px', background: 'rgba(255,213,107,0.2)',
    color: '#8A5A12', border: '1px solid rgba(255,213,107,0.45)',
    letterSpacing: '0.2px',
  },

  tableWrap: { overflowX: 'auto' as const, WebkitOverflowScrolling: 'touch' as const },
  table: { width: '100%', minWidth: '480px', borderCollapse: 'collapse' as const, fontSize: '13px' },
  th: {
    textAlign: 'left' as const, padding: '10px 12px',
    fontSize: '11px', fontWeight: 700, color: 'var(--text-3)',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '12px', borderBottom: '1px solid var(--border)',
    fontSize: '13px', color: 'var(--text)',
  },
  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '2px 8px', borderRadius: '999px',
    background: 'transparent', border: '1px solid',
    fontSize: '11px', fontWeight: 600,
  },
  footer: {
    fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.6,
    display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
    margin: 0,
  },
}
