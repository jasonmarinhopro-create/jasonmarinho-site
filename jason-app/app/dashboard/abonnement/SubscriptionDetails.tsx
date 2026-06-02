'use client'

import { useState } from 'react'
import {
  CalendarBlank, Receipt, CreditCard, CheckCircle, WarningCircle,
  ArrowRight, ArrowSquareOut, CircleNotch, ArrowsCounterClockwise,
} from '@phosphor-icons/react/dist/ssr'
import type { SubscriptionDetails, InvoiceSummary } from '@/lib/stripe/subscription-info'

type Props = {
  details: SubscriptionDetails
  invoices: InvoiceSummary[]
}

function fmtDate(unix: number | null | undefined): string {
  if (!unix) return '—'
  try {
    return new Date(unix * 1000).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return '—' }
}

function fmtMoney(cents: number, currency: string): string {
  const v = cents / 100
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(v)
  } catch {
    return `${v.toFixed(2)} ${currency.toUpperCase()}`
  }
}

const INVOICE_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  paid: { label: 'Payée', color: '#34D399' },
  open: { label: 'En attente', color: '#fbbf24' },
  void: { label: 'Annulée', color: 'var(--text-muted)' },
  uncollectible: { label: 'Impayée', color: '#fb923c' },
  draft: { label: 'Brouillon', color: 'var(--text-muted)' },
}

export default function SubscriptionDetails({ details, invoices }: Props) {
  const [switching, setSwitching] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCancelScheduled = details.cancelAtPeriodEnd === true
  const isPastDue = details.status === 'past_due'
  const renewalUnix = details.cancelAt ?? details.currentPeriodEnd

  async function handleSwitchInterval() {
    const target = details.isMonthly ? 'annuel' : 'mensuel'
    if (!confirm(`Passer ton abonnement en ${target} ? Le changement est immédiat — la différence est calculée au prorata et appliquée à ta prochaine facture.`)) return
    setSwitching(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/subscribe/switch-interval', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
      window.location.reload()
    } catch (e) {
      setSwitching(false)
      setError(e instanceof Error ? e.message : 'Erreur lors du changement.')
    }
  }

  async function handleReactivate() {
    if (!confirm("Réactiver ton abonnement ? La résiliation programmée sera annulée et l'abonnement continue.")) return
    setReactivating(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/subscribe/reactivate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
      window.location.reload()
    } catch (e) {
      setReactivating(false)
      setError(e instanceof Error ? e.message : 'Erreur lors de la réactivation.')
    }
  }

  async function handlePortal() {
    try {
      const res = await fetch('/api/stripe/subscribe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
  }

  return (
    <div style={s.wrap}>
      {/* ── État + date renouvellement ───────────────────────────── */}
      <div style={s.statusRow}>
        {isPastDue ? (
          <div style={{ ...s.statusBadge, ...s.statusWarn }}>
            <WarningCircle size={14} weight="fill" /> Paiement en échec
          </div>
        ) : isCancelScheduled ? (
          <div style={{ ...s.statusBadge, ...s.statusWarn }}>
            <WarningCircle size={14} weight="fill" /> Résiliation programmée
          </div>
        ) : (
          <div style={{ ...s.statusBadge, ...s.statusOk }}>
            <CheckCircle size={14} weight="fill" /> Actif
          </div>
        )}
      </div>

      {/* ── Date clé ─────────────────────────────────────────────── */}
      <div style={s.keyRow}>
        <div style={s.keyIcon}><CalendarBlank size={18} weight="duotone" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.keyLabel}>
            {isCancelScheduled ? "Fin de l'accès" : 'Prochain renouvellement'}
          </div>
          <div style={s.keyValue}>{fmtDate(renewalUnix)}</div>
        </div>
        {details.amount != null && details.currency && !isCancelScheduled && (
          <div style={s.keyAmount}>
            {fmtMoney(details.amount, details.currency)}
            <span style={s.keyAmountSuffix}>
              / {details.interval === 'year' ? 'an' : 'mois'}
            </span>
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────── */}
      {error && <div style={s.error}>{error}</div>}

      <div style={s.actions}>
        {isCancelScheduled && (
          <button onClick={handleReactivate} disabled={reactivating} style={{ ...s.btn, ...s.btnPrimary }}>
            {reactivating ? (
              <><CircleNotch size={13} style={{ animation: 'spin 1s linear infinite' }} /> Réactivation…</>
            ) : (
              <><ArrowsCounterClockwise size={14} weight="bold" /> Réactiver mon abonnement</>
            )}
          </button>
        )}

        {!isCancelScheduled && (details.isMonthly || details.isYearly) && (
          <button onClick={handleSwitchInterval} disabled={switching} style={{ ...s.btn, ...s.btnAccent }}>
            {switching ? (
              <><CircleNotch size={13} style={{ animation: 'spin 1s linear infinite' }} /> Migration…</>
            ) : details.isMonthly ? (
              <><ArrowRight size={13} weight="bold" /> Passer à l'annuel · économise ~18 %</>
            ) : (
              <><ArrowRight size={13} weight="bold" /> Repasser au mensuel</>
            )}
          </button>
        )}

        <button onClick={handlePortal} style={{ ...s.btn, ...s.btnGhost }}>
          <CreditCard size={13} weight="bold" /> Gérer (résiliation, paiement, factures)
          <ArrowSquareOut size={11} weight="bold" />
        </button>
      </div>

      {/* ── Factures récentes ────────────────────────────────────── */}
      {invoices.length > 0 && (
        <div style={s.invoicesBlock}>
          <div style={s.invoicesHead}>
            <Receipt size={14} weight="duotone" />
            <span>Dernières factures</span>
          </div>
          <ul style={s.invoicesList}>
            {invoices.map(inv => {
              const status = INVOICE_STATUS_LABEL[inv.status] ?? { label: inv.status, color: 'var(--text-muted)' }
              return (
                <li key={inv.id} style={s.invoiceItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.invoiceTop}>
                      <span style={s.invoiceNumber}>{inv.number ?? inv.id.slice(0, 12)}</span>
                      <span style={{ ...s.invoiceStatus, color: status.color, borderColor: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={s.invoiceMeta}>
                      {fmtDate(inv.created)} · {fmtMoney(inv.amountPaid || 0, inv.currency)}
                    </div>
                  </div>
                  <div style={s.invoiceActions}>
                    {inv.invoicePdf && (
                      <a href={inv.invoicePdf} target="_blank" rel="noopener noreferrer" style={s.invoiceLink}>
                        PDF <ArrowSquareOut size={11} weight="bold" />
                      </a>
                    )}
                    {inv.hostedInvoiceUrl && (
                      <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" style={s.invoiceLinkAlt}>
                        Voir
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statusRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: '999px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.2px',
    border: '1px solid',
  },
  statusOk: { color: '#34D399', borderColor: 'rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.08)' },
  statusWarn: { color: '#fb923c', borderColor: 'rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.08)' },

  keyRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  keyIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    flexShrink: 0,
  },
  keyLabel: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: '2px',
  },
  keyValue: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif',
  },
  keyAmount: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    fontFamily: 'var(--font-fraunces), serif',
    whiteSpace: 'nowrap',
  },
  keyAmountSuffix: {
    fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)',
    fontFamily: 'inherit',
  },

  error: {
    fontSize: '12.5px', color: '#fb923c',
    background: 'rgba(251,146,60,0.08)',
    border: '1px solid rgba(251,146,60,0.25)',
    padding: '8px 12px', borderRadius: '8px',
  },

  actions: { display: 'flex', flexDirection: 'column', gap: '8px' },
  btn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '7px',
    padding: '11px 16px',
    borderRadius: '10px',
    fontSize: '13px', fontWeight: 600,
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all .15s ease',
  },
  btnPrimary: { background: '#34D399', borderColor: '#34D399', color: '#012618' },
  btnAccent: { background: 'var(--accent-text)', borderColor: 'var(--accent-text)', color: 'var(--bg)' },
  btnGhost: { background: 'var(--surface)', borderColor: 'var(--border-2)', color: 'var(--text-2)' },

  invoicesBlock: {
    borderTop: '1px solid var(--border)',
    paddingTop: '14px',
  },
  invoicesHead: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: '10px',
  },
  invoicesList: {
    listStyle: 'none', margin: 0, padding: 0,
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  invoiceItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  },
  invoiceTop: {
    display: 'flex', alignItems: 'center', gap: '8px',
    flexWrap: 'wrap',
  },
  invoiceNumber: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  invoiceStatus: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.3px',
    padding: '2px 7px', borderRadius: '999px',
    border: '1px solid',
    background: 'transparent',
  },
  invoiceMeta: {
    fontSize: '11.5px', color: 'var(--text-muted)',
    marginTop: '3px',
  },
  invoiceActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  invoiceLink: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)',
    textDecoration: 'none',
    padding: '5px 9px',
    borderRadius: '7px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
  },
  invoiceLinkAlt: {
    fontSize: '11.5px', color: 'var(--text-muted)',
    textDecoration: 'none',
  },
}
