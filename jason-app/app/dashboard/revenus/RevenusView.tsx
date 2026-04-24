'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  CurrencyEur, Clock, TrendUp, CalendarBlank,
  House, Plus, Trash, X, Check,
  Info, Warning, ArrowRight, Scales,
} from '@phosphor-icons/react'
import { createRevenusEntry, deleteRevenusEntry } from './actions'

// ── types ────────────────────────────────────────────────────────────────────

interface Contract {
  id: string
  montant_loyer: number | null
  stripe_payment_status: string | null
  stripe_payment_enabled: boolean | null
  date_arrivee: string | null
  date_depart: string | null
  logement_nom: string | null
  logement_id: string | null
  statut: string | null
  locataire_prenom: string | null
  locataire_nom: string | null
}

interface RevenusEntry {
  id: string
  logement_nom: string
  montant: number
  date_paiement: string
  mode_paiement: string
  type_paiement: string | null
  description: string | null
}

interface Props {
  contracts: Contract[]
  initialEntries: RevenusEntry[]
  logementNoms: string[]
}

// ── constants ────────────────────────────────────────────────────────────────

const MODE_LABELS: Record<string, string> = {
  virement: 'Virement', especes: 'Espèces', cheque: 'Chèque', stripe: 'Stripe', autre: 'Autre',
}
const TYPE_LABELS: Record<string, string> = {
  loyer: 'Loyer', caution: 'Caution', frais_menage: 'Frais ménage', autre: 'Autre',
}
const MODE_OPTIONS = ['virement', 'especes', 'cheque', 'autre'] as const
const TYPE_OPTIONS = ['loyer', 'caution', 'frais_menage', 'autre'] as const

// ── helpers ──────────────────────────────────────────────────────────────────

function isPaid(c: Contract): boolean {
  return c.stripe_payment_status === 'paid' ||
    (!c.stripe_payment_enabled && c.statut === 'signe')
}

function isPending(c: Contract): boolean {
  if (isPaid(c)) return false
  if (!c.date_arrivee || (c.montant_loyer ?? 0) <= 0) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return new Date(c.date_arrivee) >= today
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function todayISO() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

// ── component ────────────────────────────────────────────────────────────────

export default function RevenusView({ contracts, initialEntries, logementNoms }: Props) {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()

  const [entries, setEntries]   = useState<RevenusEntry[]>(initialEntries)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState<'all' | 'encaisse' | 'attente'>('all')
  const [, startT]              = useTransition()

  // form fields
  const [fLogement, setFLogement] = useState('')
  const [fMontant,  setFMontant]  = useState('')
  const [fDate,     setFDate]     = useState(todayISO)
  const [fMode,     setFMode]     = useState<string>('virement')
  const [fType,     setFType]     = useState<string>('loyer')
  const [fDesc,     setFDesc]     = useState('')

  function resetForm() {
    setFLogement(''); setFMontant(''); setFDate(todayISO())
    setFMode('virement'); setFType('loyer'); setFDesc('')
    setShowForm(false)
  }

  function handleAdd() {
    const montant = parseFloat(fMontant)
    if (!fLogement.trim() || isNaN(montant) || montant <= 0 || !fDate) return
    const optimistic: RevenusEntry = {
      id: 'tmp-' + Date.now(),
      logement_nom: fLogement.trim(), montant,
      date_paiement: fDate, mode_paiement: fMode,
      type_paiement: fType, description: fDesc.trim() || null,
    }
    setEntries(prev => [optimistic, ...prev])
    resetForm()
    startT(async () => {
      const res = await createRevenusEntry({
        logement_nom: optimistic.logement_nom, montant: optimistic.montant,
        date_paiement: optimistic.date_paiement, mode_paiement: optimistic.mode_paiement,
        type_paiement: optimistic.type_paiement ?? 'loyer',
        description: optimistic.description,
      })
      if (res.error) {
        setEntries(prev => prev.filter(e => e.id !== optimistic.id))
      } else if (res.entry) {
        setEntries(prev => prev.map(e => e.id === optimistic.id ? (res.entry as RevenusEntry) : e))
      }
    })
  }

  function handleDelete(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
    startT(async () => { await deleteRevenusEntry(id) })
  }

  // ── KPIs ────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    let cesMoisEnc = 0, enAttente = 0, cetteAnneeEnc = 0
    const monthlyTotals: Record<string, number> = {}

    contracts.forEach(c => {
      const loyer = c.montant_loyer ?? 0; if (loyer <= 0) return
      const d = c.date_arrivee ? new Date(c.date_arrivee) : null
      if (isPaid(c) && d) {
        if (d.getFullYear() === thisYear) {
          cetteAnneeEnc += loyer
          if (d.getMonth() === thisMonth) cesMoisEnc += loyer
        }
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyTotals[k] = (monthlyTotals[k] ?? 0) + loyer
      } else if (isPending(c)) { enAttente += loyer }
    })

    entries.forEach(e => {
      const d = new Date(e.date_paiement)
      if (d.getFullYear() === thisYear) {
        cetteAnneeEnc += e.montant
        if (d.getMonth() === thisMonth) cesMoisEnc += e.montant
      }
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyTotals[k] = (monthlyTotals[k] ?? 0) + e.montant
    })

    const last6Keys = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    const last6Sum = last6Keys.reduce((acc, k) => acc + (monthlyTotals[k] ?? 0), 0)
    return { cesMoisEnc, enAttente, cetteAnneeEnc, moyMensuelle: last6Sum / 6 }
  }, [contracts, entries, thisMonth, thisYear])

  // ── Chart ───────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d     = new Date(thisYear, thisMonth - (5 - i), 1)
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('fr-FR', { month: 'short' })
      let total   = 0
      contracts.forEach(c => {
        if (!isPaid(c) || !c.date_arrivee) return
        const da = new Date(c.date_arrivee)
        if (`${da.getFullYear()}-${String(da.getMonth() + 1).padStart(2, '0')}` === key)
          total += c.montant_loyer ?? 0
      })
      entries.forEach(e => {
        const de = new Date(e.date_paiement)
        if (`${de.getFullYear()}-${String(de.getMonth() + 1).padStart(2, '0')}` === key)
          total += e.montant
      })
      return { key, label, total }
    })
  }, [contracts, entries, thisMonth, thisYear])

  // ── Logement stats ───────────────────────────────────────────────────────

  const logementStats = useMemo(() => {
    const stats: Record<string, { nom: string; encaisse: number; pending: number }> = {}
    contracts.forEach(c => {
      const nom = c.logement_nom ?? 'Sans nom'; const loyer = c.montant_loyer ?? 0
      if (!stats[nom]) stats[nom] = { nom, encaisse: 0, pending: 0 }
      if (isPaid(c)) stats[nom].encaisse += loyer
      else if (isPending(c)) stats[nom].pending += loyer
    })
    entries.forEach(e => {
      if (!stats[e.logement_nom]) stats[e.logement_nom] = { nom: e.logement_nom, encaisse: 0, pending: 0 }
      stats[e.logement_nom].encaisse += e.montant
    })
    return Object.values(stats)
      .filter(s => s.encaisse > 0 || s.pending > 0)
      .sort((a, b) => (b.encaisse + b.pending) - (a.encaisse + a.pending))
  }, [contracts, entries])

  // ── Unified transactions ─────────────────────────────────────────────────

  type Tx = {
    id: string; date: string; logement: string; guest?: string
    label: string; mode: string; montant: number
    statut: 'encaisse' | 'attente'; source: 'contrat' | 'manuel'
  }

  const allTx = useMemo((): Tx[] => {
    const list: Tx[] = []
    contracts.forEach(c => {
      if (!c.date_arrivee || (c.montant_loyer ?? 0) <= 0) return
      const paid = isPaid(c); const pending = isPending(c)
      if (!paid && !pending) return
      const guest = [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ') || undefined
      list.push({
        id: c.id, date: c.date_arrivee, logement: c.logement_nom ?? '–', guest,
        label: 'Loyer', mode: c.stripe_payment_enabled ? 'Stripe' : '–',
        montant: c.montant_loyer ?? 0, statut: paid ? 'encaisse' : 'attente',
        source: 'contrat',
      })
    })
    entries.forEach(e => list.push({
      id: e.id, date: e.date_paiement, logement: e.logement_nom,
      label: TYPE_LABELS[e.type_paiement ?? 'loyer'] ?? 'Paiement',
      mode: MODE_LABELS[e.mode_paiement] ?? e.mode_paiement,
      montant: e.montant, statut: 'encaisse', source: 'manuel',
    }))
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [contracts, entries])

  const filteredTx = useMemo(() =>
    filter === 'all' ? allTx : allTx.filter(tx => tx.statut === filter),
    [allTx, filter],
  )

  const maxChart    = Math.max(...chartData.map(m => m.total), 1)
  const formValid   = fLogement.trim() && fMontant && parseFloat(fMontant) > 0 && fDate

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <main style={s.main}>

      {/* Page heading */}
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>
          Mes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>revenus</em>
        </h1>
        <p style={s.pageSub}>Suivi de tes encaissements, paiements en attente et fiscalité.</p>
      </div>

      {/* KPI cards */}
      <div style={s.kpiGrid}>
        <KpiCard icon={<CurrencyEur size={20} weight="fill" />} label="Ce mois encaissé"  value={fmt(kpis.cesMoisEnc)}    colorClass="green"  />
        <KpiCard icon={<Clock       size={20} weight="fill" />} label="En attente"         value={fmt(kpis.enAttente)}     colorClass="yellow" />
        <KpiCard icon={<TrendUp     size={20} weight="fill" />} label="Cette année"        value={fmt(kpis.cetteAnneeEnc)} colorClass="accent" />
        <KpiCard icon={<CalendarBlank size={20} weight="fill" />} label="Moy. mensuelle"   value={fmt(kpis.moyMensuelle)}  colorClass="muted"  sub="6 derniers mois" />
      </div>

      {/* Chart + logement stats */}
      <div style={s.twoCol}>
        <section style={s.card}>
          <h2 style={s.cardTitle}>Revenus encaissés</h2>
          <p style={s.cardSub}>6 derniers mois</p>
          <div style={s.chart}>
            {chartData.map(month => (
              <div key={month.key} style={s.chartCol}>
                <div style={s.barWrap}>
                  <div style={{
                    ...s.bar,
                    height: `${Math.max((month.total / maxChart) * 100, month.total > 0 ? 4 : 2)}%`,
                    opacity: month.total === 0 ? 0.15 : 1,
                  }} />
                </div>
                <span style={s.barAmount}>
                  {month.total > 0 ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(month.total) : '–'}
                </span>
                <span style={s.barLabel}>{month.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={s.card}>
          <h2 style={s.cardTitle}>Par logement</h2>
          <p style={s.cardSub}>Encaissé vs. en attente</p>
          {logementStats.length === 0
            ? <p style={s.empty}>Aucune donnée</p>
            : <div style={s.logList}>
                {logementStats.map(ls => {
                  const total = ls.encaisse + ls.pending
                  const pct   = total > 0 ? (ls.encaisse / total) * 100 : 0
                  return (
                    <div key={ls.nom} style={s.logRow}>
                      <div style={s.logHeader}>
                        <div style={s.logName}>
                          <House size={14} weight="fill" style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ls.nom}</span>
                        </div>
                        <div style={s.logAmounts}>
                          <span style={{ color: '#4ade80', fontWeight: 600 }}>{fmt(ls.encaisse)}</span>
                          {ls.pending > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>+ {fmt(ls.pending)}</span>}
                        </div>
                      </div>
                      <div style={s.progressBg}>
                        <div style={{ ...s.progressFill, width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </section>
      </div>

      {/* ── Journal des paiements */}
      <section style={s.card}>
        <div style={s.journalHead}>
          <div>
            <h2 style={{ ...s.cardTitle, marginBottom: '2px' }}>Journal des paiements</h2>
            <p style={{ ...s.cardSub, margin: 0 }}>
              Encaissements Stripe, virements, espèces — tout en un seul endroit
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{ ...s.actionBtn, ...(showForm ? s.actionBtnCancel : {}) }}
          >
            {showForm ? <X size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
            {showForm ? 'Annuler' : 'Ajouter'}
          </button>
        </div>

        {/* Inline add form */}
        {showForm && (
          <div style={s.addForm}>
            <div className="rev-form-grid">
              <div style={s.formField}>
                <label style={s.formLabel}>Logement *</label>
                <input
                  list="log-list" value={fLogement} onChange={e => setFLogement(e.target.value)}
                  placeholder="Villa du Soleil" style={s.formInput} className="input-field"
                />
                <datalist id="log-list">
                  {logementNoms.map(n => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Montant (€) *</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={fMontant} onChange={e => setFMontant(e.target.value)}
                  placeholder="1 200" style={s.formInput} className="input-field"
                />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Date reçu *</label>
                <input
                  type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                  style={s.formInput} className="input-field"
                />
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Mode</label>
                <select value={fMode} onChange={e => setFMode(e.target.value)} style={s.formInput} className="input-field">
                  {MODE_OPTIONS.map(m => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
                </select>
              </div>
              <div style={s.formField}>
                <label style={s.formLabel}>Type</label>
                <select value={fType} onChange={e => setFType(e.target.value)} style={s.formInput} className="input-field">
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div style={{ ...s.formField, gridColumn: 'span 2' }}>
                <label style={s.formLabel}>Note (optionnel)</label>
                <input
                  value={fDesc} onChange={e => setFDesc(e.target.value)}
                  placeholder="Ex : acompte semaine 1…" style={s.formInput} className="input-field"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
              <button
                onClick={handleAdd}
                disabled={!formValid}
                style={{ ...s.actionBtn, opacity: formValid ? 1 : 0.45 }}
              >
                <Check size={14} weight="bold" />
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={s.filterRow}>
          {(['all', 'encaisse', 'attente'] as const).map(f => {
            const count = f === 'all' ? allTx.length : allTx.filter(t => t.statut === f).length
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}>
                {f === 'all' ? 'Tout' : f === 'encaisse' ? 'Encaissé' : 'En attente'}
                <span style={{ ...s.filterCount, ...(filter === f ? { color: 'var(--accent-text)' } : {}) }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Transaction list */}
        {filteredTx.length === 0
          ? <p style={s.empty}>Aucune transaction</p>
          : <div style={s.txList}>
              {filteredTx.map(tx => (
                <div key={tx.id + tx.source} style={s.txRow} className="tx-row">
                  <div style={s.txDate}>{fmtDate(tx.date)}</div>
                  <div style={s.txInfo}>
                    <span style={s.txLogement}>{tx.logement}</span>
                    {tx.guest && <span style={s.txGuest}>{tx.guest}</span>}
                  </div>
                  <div style={s.txMeta} className="tx-meta">
                    <span style={s.txLabel}>{tx.label}</span>
                    {tx.mode !== '–' && <span style={s.txMode}>{tx.mode}</span>}
                  </div>
                  <span style={s.txAmount}>{fmt(tx.montant)}</span>
                  <span style={{
                    ...s.txBadge,
                    ...(tx.statut === 'encaisse' ? s.badgeGreen : s.badgeYellow),
                  }}>
                    {tx.statut === 'encaisse' ? '✓ Encaissé' : '⏳ Attente'}
                  </span>
                  {tx.source === 'manuel'
                    ? <button onClick={() => handleDelete(tx.id)} style={s.deleteBtn} className="tx-del icon-btn" title="Supprimer">
                        <Trash size={13} />
                      </button>
                    : <div style={{ width: '24px', flexShrink: 0 }} />
                  }
                </div>
              ))}
            </div>
        }
      </section>

      <FiscaliteSection annuel={kpis.cetteAnneeEnc} />

      <style>{`
        .kpi-icon-green  { color: #16a34a; }
        .kpi-icon-yellow { color: var(--accent-text); }
        .kpi-icon-accent { color: var(--accent-text); }
        .kpi-icon-muted  { color: var(--text-muted); }
        .tx-row  { transition: background 0.1s; }
        .tx-row:hover { background: var(--surface) !important; border-radius: 10px; }
        .tx-del  { opacity: 0; transition: opacity 0.15s; }
        .tx-row:hover .tx-del { opacity: 1 !important; }
        @media (max-width: 640px) {
          .tx-meta { display: none !important; }
          .tx-guest { display: none !important; }
        }
        .fisc-card { transition: border-color 0.15s, background 0.15s; }
        .fisc-card:hover { border-color: rgba(0,76,63,0.5) !important; }
      `}</style>
    </main>
  )
}

// ── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, colorClass, sub }: {
  icon: React.ReactNode; label: string; value: string; colorClass: string; sub?: string
}) {
  return (
    <div style={s.kpiCard}>
      <div className={`kpi-icon-${colorClass}`} style={s.kpiIcon}>{icon}</div>
      <div style={s.kpiBody}>
        <span style={s.kpiLabel}>{label}</span>
        <span style={s.kpiValue}>{value}</span>
        {sub && <span style={s.kpiSub}>{sub}</span>}
      </div>
    </div>
  )
}

// ── FiscaliteSection ─────────────────────────────────────────────────────────

const REGIMES = [
  {
    key: 'micro-nc',
    label: 'Micro-BIC',
    sublabel: 'Meublé non classé',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.07)',
    border: 'rgba(96,165,250,0.2)',
    seuil: '15 000 €',
    abattement: '30 %',
    forWho: 'Tu loues sur Airbnb ou Booking sans classement officiel, et tes revenus restent sous 15 000 €/an.',
    avantage: 'Zéro compta — abattement automatique à la déclaration.',
    attention: 'Si tes charges réelles dépassent 30 % de tes loyers, le régime réel sera plus avantageux.',
  },
  {
    key: 'micro-cl',
    label: 'Micro-BIC',
    sublabel: 'Meublé classé / Ch. d\'hôtes',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.2)',
    seuil: '83 600 €',
    abattement: '50 % — 71 %',
    forWho: 'Ton logement a obtenu un classement tourisme (étoiles) ou tu gères des chambres d\'hôtes.',
    avantage: 'Abattement de 50 % (classé) ou 71 % (chambres d\'hôtes) — un classement peut diviser ta base imposable par deux.',
    attention: 'Le classement implique une démarche officielle auprès d\'un organisme agréé.',
  },
  {
    key: 'reel',
    label: 'Régime réel',
    sublabel: 'LMNP — toutes catégories',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.2)',
    seuil: 'Sans plafond',
    abattement: 'Charges réelles + amortissements',
    forWho: 'Tes charges (crédit, travaux, assurances, frais de gestion…) dépassent l\'abattement forfaitaire, ou tes revenus dépassent les seuils micro-BIC.',
    avantage: 'Déduction de toutes les charges + amortissement du bien → résultat souvent nul, peu ou pas d\'impôt.',
    attention: 'Depuis 2025 : les amortissements déduits sont réintégrés dans le calcul de la plus-value à la revente.',
  },
]

function FiscaliteSection({ annuel }: { annuel: number }) {
  const [open, setOpen] = useState(false)

  return (
    <section style={sf.wrap}>
      {/* Header */}
      <div style={sf.header}>
        <div style={sf.headerLeft}>
          <div style={sf.iconWrap}>
            <Scales size={18} weight="fill" style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <h2 style={sf.title}>Fiscalité 2026</h2>
            <p style={sf.subtitle}>Quel régime s'applique à tes revenus de location meublée ?</p>
          </div>
        </div>
        <button onClick={() => setOpen(v => !v)} style={sf.toggleBtn} className="fisc-toggle">
          {open ? 'Réduire' : 'Voir le guide'}
          <ArrowRight size={13} weight="bold" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Seuils strip — always visible */}
      <div style={sf.seuilsStrip}>
        <SeuilPill label="Non classé" seuil="< 15 000 €" pct="30 %" color="#60a5fa" />
        <SeuilPill label="Classé ★"   seuil="< 83 600 €" pct="50 %" color="#34d399" />
        <SeuilPill label="Ch. d'hôtes" seuil="< 188 700 €" pct="71 %" color="#a78bfa" />
        <div style={sf.seuilSep} />
        <SeuilPill label="LMP si"      seuil="> 23 000 €" pct="+ 50 % revenus" color="#fb923c" />
      </div>

      {/* Alert si revenus annuels proches des seuils */}
      {annuel >= 12000 && annuel < 15500 && (
        <div style={{ ...sf.alert, borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.07)' }}>
          <Info size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <span>Tes revenus cette année approchent le seuil micro-BIC non classé (15 000 €). Si tu le dépasses, tu bascules automatiquement au régime réel ou micro-BIC classé.</span>
        </div>
      )}
      {annuel >= 20000 && annuel < 25000 && (
        <div style={{ ...sf.alert, borderColor: 'rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.07)' }}>
          <Warning size={14} style={{ color: '#fb923c', flexShrink: 0 }} />
          <span>Tes revenus approchent le seuil LMP (23 000 €). Si tes revenus locatifs dépassent 50 % de tes revenus du foyer, le passage au statut LMP est automatique — avec des cotisations sociales à la clé.</span>
        </div>
      )}

      {/* Expandable regime cards */}
      {open && (
        <div style={sf.grid}>
          {REGIMES.map(r => (
            <div key={r.key} style={{ ...sf.card, borderColor: r.border, background: r.bg }} className="fisc-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span style={{ ...sf.regimeLabel, color: r.color }}>{r.label}</span>
                  <span style={sf.regimeSub}>{r.sublabel}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...sf.bigPct, color: r.color }}>{r.abattement}</div>
                  <div style={sf.seuilLabel}>seuil {r.seuil}</div>
                </div>
              </div>
              <p style={sf.forWho}>{r.forWho}</p>
              <div style={sf.avBlock}>
                <span style={{ ...sf.avDot, background: r.color }} />
                <span style={sf.avText}>{r.avantage}</span>
              </div>
              <div style={{ ...sf.avBlock, marginTop: '4px' }}>
                <span style={{ ...sf.avDot, background: '#ef4444' }} />
                <span style={{ ...sf.avText, color: 'var(--text-muted)' }}>{r.attention}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p style={sf.disclaimer}>
        <Info size={12} style={{ flexShrink: 0 }} />
        Guide informatif basé sur la réglementation en vigueur en 2026 —&nbsp;
        <a href="https://www.service-public.fr/particuliers/vosdroits/F32744" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>service-public.fr</a>
        ,&nbsp;
        <a href="https://lmnp.ai/fiscalite-lmnp" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>lmnp.ai</a>.
        {' '}Consulte un expert-comptable pour ta situation personnelle.
      </p>
    </section>
  )
}

function SeuilPill({ label, seuil, pct, color }: { label: string; seuil: string; pct: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '90px' }}>
      <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{seuil}</span>
      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}</span>
    </div>
  )
}

const sf: Record<string, React.CSSProperties> = {
  wrap:        { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  headerLeft:  { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  iconWrap:    { width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,76,63,0.2)', border: '1px solid rgba(0,76,63,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0 },
  subtitle:    { fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' },
  toggleBtn:   { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s' },

  seuilsStrip: { display: 'flex', gap: '0', background: 'var(--surface)', borderRadius: '12px', padding: '14px 18px', flexWrap: 'wrap', rowGap: '12px' },
  seuilSep:    { width: '1px', background: 'var(--border)', margin: '0 16px', flexShrink: 0, alignSelf: 'stretch' },

  alert:       { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: '10px', border: '1px solid', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55 },

  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' },
  card:        { border: '1px solid', borderRadius: '14px', padding: '18px' },
  regimeLabel: { display: 'block', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px' },
  regimeSub:   { display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' },
  bigPct:      { fontSize: '16px', fontWeight: 700, letterSpacing: '-0.4px' },
  seuilLabel:  { fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' },
  forWho:      { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 10px 0' },
  avBlock:     { display: 'flex', alignItems: 'flex-start', gap: '8px' },
  avDot:       { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '5px' },
  avText:      { fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55 },

  disclaimer:  { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 },
}

// ── styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  main:     { padding: 'clamp(20px,3vw,40px)', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '20px' },
  pageHead: { marginBottom: '4px' },
  pageTitle:{ fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', margin: '0 0 6px' },
  pageSub:  { fontSize: '14px', color: 'var(--text-2)', margin: 0 },

  kpiGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  kpiCard:  { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  kpiIcon:  { width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiBody:  { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  kpiLabel: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.2px' },
  kpiValue: { fontSize: '22px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1.2 },
  kpiSub:   { fontSize: '11px', color: 'var(--text-3)' },

  twoCol:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  card:     { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' },
  cardTitle:{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: '2px' },
  cardSub:  { fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0' },

  chart:    { display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' },
  barWrap:  { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  bar:      { width: '100%', background: 'var(--accent-text)', borderRadius: '5px 5px 2px 2px', minHeight: '2px' },
  barAmount:{ fontSize: '10px', color: 'var(--text-2)', fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap' },
  barLabel: { fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' },

  logList:  { display: 'flex', flexDirection: 'column', gap: '16px' },
  logRow:   { display: 'flex', flexDirection: 'column', gap: '8px' },
  logHeader:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  logName:  { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text)', minWidth: 0, flex: 1, overflow: 'hidden' },
  logAmounts:{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, fontSize: '13px', fontWeight: 600 },
  progressBg:{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' },
  progressFill:{ height: '100%', background: 'linear-gradient(90deg, #004C3F, #16a34a)', borderRadius: '3px' },

  journalHead:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' },
  actionBtn:  { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,76,63,0.2)', color: 'var(--accent-text)', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s' },
  actionBtnCancel:{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' },

  addForm:  { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', marginBottom: '16px' },
  formField:{ display: 'flex', flexDirection: 'column', gap: '5px' },
  formLabel:{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  formInput:{ fontSize: '13px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-outfit), sans-serif', width: '100%', boxSizing: 'border-box' },

  filterRow:{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' },
  filterBtn:{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', transition: 'all 0.15s' },
  filterBtnActive:{ background: 'rgba(0,76,63,0.2)', border: '1px solid rgba(0,76,63,0.4)', color: 'var(--accent-text)' },
  filterCount:{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },

  txList:   { display: 'flex', flexDirection: 'column', gap: '2px' },
  txRow:    { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: '10px' },
  txDate:   { fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, minWidth: '52px', flexShrink: 0 },
  txInfo:   { display: 'flex', flexDirection: 'column', gap: '1px', flex: 1, minWidth: 0 },
  txLogement:{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  txGuest:  { fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  txMeta:   { display: 'flex', flexDirection: 'column', gap: '1px', minWidth: '80px', flexShrink: 0 },
  txLabel:  { fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 },
  txMode:   { fontSize: '11px', color: 'var(--text-muted)' },
  txAmount: { fontSize: '14px', fontWeight: 700, color: 'var(--text)', flexShrink: 0, minWidth: '72px', textAlign: 'right' },
  txBadge:  { fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' },
  badgeGreen:{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  badgeYellow:{ background: 'rgba(255,213,107,0.12)', color: 'var(--accent-text)' },
  deleteBtn:{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, padding: 0 },

  empty:    { fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '28px 0', margin: 0 },
}
