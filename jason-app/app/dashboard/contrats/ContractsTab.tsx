'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Select from '@/components/ui/Select'
import { FileText, MagnifyingGlass, House, ArrowSquareOut, ArrowCounterClockwise, Eye, X } from '@phosphor-icons/react/dist/ssr'
import { Card, CardHead, Stat, ui } from '../finances/_ui/ui'
import { restoreContract } from '../voyageurs/contract-actions'
import type { ContractRow } from './types'

interface Props {
  contracts: ContractRow[]
  /** 'YYYY-MM-DD' à Paris, calculé côté serveur */
  today: string
}

type StatusFilter = 'tous' | 'en_attente' | 'signe' | 'annule'
type PeriodFilter = 'tous' | 'a-venir' | 'ce-mois' | 'passes'

// Couleurs de la marque uniquement (pas de bleu ni de gris-bleu)
const AMBER = '#8A5A12'
const AMBER_BG = 'rgba(255,213,107,0.18)'
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'À signer',  color: AMBER, bg: AMBER_BG },
  signe:      { label: 'Signé',     color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  annule:     { label: 'Annulé',    color: 'var(--text-3)', bg: 'var(--bg-2)' },
}

// Où en est l'argent : caution (prioritaire, c'est elle qui demande une
// action après le séjour) puis loyer payé en ligne.
function paymentBadge(c: ContractRow): { label: string; color: string; bg: string } | null {
  switch (c.stripe_deposit_status) {
    case 'held':     return { label: 'Caution bloquée', color: 'var(--accent-text)', bg: 'var(--accent-bg)' }
    case 'expired':  return { label: 'Caution expirée', color: AMBER, bg: AMBER_BG }
    case 'captured': return { label: 'Caution encaissée', color: 'var(--danger)', bg: 'var(--danger-bg)' }
    case 'released': return { label: 'Caution libérée', color: 'var(--accent-text)', bg: 'var(--accent-bg)' }
  }
  if (!c.stripe_payment_enabled) return null
  if (c.stripe_payment_status === 'paid') return { label: 'Loyer payé', color: 'var(--accent-text)', bg: 'var(--accent-bg)' }
  if (c.stripe_payment_status === 'failed') return { label: 'Paiement échoué', color: 'var(--danger)', bg: 'var(--danger-bg)' }
  return c.statut === 'signe' ? { label: 'Loyer à encaisser', color: AMBER, bg: AMBER_BG } : null
}

function fmtDateShort(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
function fmtEur(n: number | null): string {
  if (n == null || !isFinite(n)) return '-'
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}

export default function ContractsTab({ contracts, today }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('tous')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('tous')
  const [logementFilter, setLogementFilter] = useState<string>('tous')

  // Liste unique des logements présents dans les contrats
  const logements = useMemo(() => {
    const set = new Set<string>()
    contracts.forEach(c => { if (c.logement_nom) set.add(c.logement_nom) })
    return Array.from(set).sort()
  }, [contracts])

  const filtered = useMemo(() => {
    const thisMonth = today.slice(0, 7)
    const q = search.trim().toLowerCase()
    return contracts.filter(c => {
      if (statusFilter !== 'tous' && c.statut !== statusFilter) return false
      if (logementFilter !== 'tous' && c.logement_nom !== logementFilter) return false
      if (periodFilter === 'a-venir' && (!c.date_arrivee || c.date_arrivee < today)) return false
      if (periodFilter === 'passes' && (!c.date_depart || c.date_depart >= today)) return false
      if (periodFilter === 'ce-mois' && (!c.date_arrivee || !c.date_arrivee.startsWith(thisMonth))) return false
      if (q) {
        const hay = [
          c.locataire_prenom, c.locataire_nom, c.locataire_email,
          c.logement_nom, c.logement_adresse,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, search, statusFilter, periodFilter, logementFilter, today])

  const kpis = useMemo(() => {
    const total = contracts.length
    const signe = contracts.filter(c => c.statut === 'signe').length
    const enAttente = contracts.filter(c => c.statut === 'en_attente').length
    // Loyers des contrats signés (un contrat pas signé n'est pas un revenu)
    const caTotal = contracts
      .filter(c => c.statut === 'signe')
      .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)
    return { total, signe, enAttente, caTotal }
  }, [contracts])

  if (contracts.length === 0) {
    return (
      <Card>
        <div style={s.empty}>
          <div style={s.emptyIcon}><FileText size={28} weight="duotone" color="var(--accent-text)" /></div>
          <h3 style={s.emptyH}>Aucun contrat pour le moment</h3>
          <p style={s.emptyLead}>
            Le contrat sert surtout aux <strong>réservations directes</strong> (bouche-à-oreille, site perso, réseaux sociaux, Driing).
            Pour Airbnb et Booking, la plateforme a déjà ses conditions, sa garantie et sa médiation.
          </p>
          <p style={{ ...s.emptyLead, fontSize: '13.5px', color: 'var(--text-3)' }}>
            Clique sur <strong>Nouveau contrat</strong> en haut : choisis la réservation (ou saisis-la en 30 secondes), l&apos;assistant fait le reste.
          </p>
        </div>
      </Card>
    )
  }

  const hasFilters = !!search || statusFilter !== 'tous' || periodFilter !== 'tous' || logementFilter !== 'tous'
  const resetAll = () => { setSearch(''); setStatusFilter('tous'); setPeriodFilter('tous'); setLogementFilter('tous') }

  return (
    <Card>
      <CardHead title="Tous tes contrats" sub="Clique un nom pour ouvrir la fiche voyageur : relance, caution et facture s'y trouvent." />

      <div style={s.kpiGrid}>
        <Stat label="Contrats" value={kpis.total} />
        <Stat label="Signés" value={kpis.signe} tone="green" />
        <Stat label="À signer" value={kpis.enAttente} tone={kpis.enAttente > 0 ? 'amber' : 'muted'} />
        <Stat label="Loyers signés" value={fmtEur(kpis.caTotal)} hint="contrats signés, toutes dates" />
      </div>

      {/* Filtres */}
      <div style={s.filters}>
        <div style={{ ...s.search, flex: '1 1 240px', minWidth: 0 }}>
          <MagnifyingGlass size={15} color="var(--text-3)" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, e-mail, logement…"
            aria-label="Rechercher un contrat"
            style={s.searchInput}
          />
          {search && <button type="button" onClick={() => setSearch('')} style={s.clearBtn} aria-label="Effacer la recherche"><X size={12} /></button>}
        </div>
        <FilterPills
          options={[
            { v: 'tous', label: 'Tous statuts' },
            { v: 'en_attente', label: 'À signer' },
            { v: 'signe', label: 'Signés' },
            { v: 'annule', label: 'Annulés' },
          ]}
          value={statusFilter}
          onChange={v => setStatusFilter(v as StatusFilter)}
        />
        <FilterPills
          options={[
            { v: 'tous', label: 'Toutes périodes' },
            { v: 'a-venir', label: 'À venir' },
            { v: 'ce-mois', label: 'Ce mois' },
            { v: 'passes', label: 'Passés' },
          ]}
          value={periodFilter}
          onChange={v => setPeriodFilter(v as PeriodFilter)}
        />
        {logements.length > 1 && (
          <Select
            value={logementFilter}
            onChange={v => setLogementFilter(v)}
            options={[
              { value: 'tous', label: 'Tous logements' },
              ...logements.map(l => ({ value: l, label: l })),
            ]}
            ariaLabel="Filtrer par logement"
          />
        )}
      </div>

      {/* Compteur résultats */}
      <div style={s.resultsLabel}>
        {hasFilters
          ? <>{filtered.length} contrat{filtered.length > 1 ? 's' : ''} sur {contracts.length} · <button type="button" onClick={resetAll} style={s.linkBtn}>tout afficher</button></>
          : <>{contracts.length} contrat{contracts.length > 1 ? 's' : ''}, du plus récent au plus ancien</>}
      </div>

      {/* Mobile : nom + logement sur une ligne, montant et statuts en dessous */}
      <style>{`@media (max-width: 640px) {
        .ctr-row { flex-wrap: wrap; }
        .ctr-row .ctr-main { flex: 1 1 calc(100% - 60px) !important; }
      }`}</style>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={s.emptyResults}>
          Aucun contrat ne correspond à ces filtres.
          <button onClick={resetAll} style={s.resetBtn}>
            Réinitialiser
          </button>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(c => <ContractRow key={c.id} contract={c} />)}
        </div>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────
function ContractRow({ contract: c }: { contract: ContractRow }) {
  const meta = STATUS_META[c.statut] ?? { label: c.statut, color: 'var(--text-muted)', bg: 'transparent' }
  const fullName = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Locataire'
  const initials = ((c.locataire_prenom?.[0] ?? '') + (c.locataire_nom?.[0] ?? '')).toUpperCase() || '?'
  const pay = c.statut === 'annule' ? null : paymentBadge(c)
  // Réactivation d'un contrat annulé par erreur (la page est revalidée par
  // l'action : la ligne reprend son vrai statut sans rechargement manuel).
  const [restoring, startRestore] = useTransition()
  const [restoreError, setRestoreError] = useState('')
  function restore() {
    const next = c.signature_date ? 'signé' : 'en attente de signature'
    if (!confirm(`Réactiver ce contrat ? Il repassera en « ${next} ».`)) return
    setRestoreError('')
    startRestore(async () => {
      const res = await restoreContract(c.id)
      if (res.error) setRestoreError(res.error)
    })
  }

  return (
    <div style={s.row} className="ctr-row">
      <div style={s.rowAvatar}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }} className="ctr-main">
        {c.voyageur_id
          ? <Link href={`/dashboard/voyageurs/${c.voyageur_id}`} style={{ ...s.rowName, textDecoration: 'none', display: 'block' }}>{fullName}</Link>
          : <div style={s.rowName}>{fullName}</div>}
        <div style={s.rowMeta}>
          <span><House size={11} weight="fill" /> {c.logement_nom ?? 'Logement'}</span>
          <span>{fmtDateShort(c.date_arrivee)} au {fmtDateShort(c.date_depart)}</span>
        </div>
      </div>
      <div style={s.rowMoney}>
        <div style={s.rowAmount}>{fmtEur(c.montant_loyer)}</div>
        {c.montant_caution ? <div style={s.rowDeposit}>caution {fmtEur(c.montant_caution)}</div> : null}
      </div>
      <span style={{ ...s.statusBadge, color: meta.color, background: meta.bg }}>{meta.label}</span>
      {pay && <span style={{ ...s.statusBadge, color: pay.color, background: pay.bg }} className="ctr-pay-badge">{pay.label}</span>}
      <div style={s.rowActions}>
        {c.statut === 'annule' && (
          <button
            type="button"
            onClick={restore}
            disabled={restoring}
            style={{ ...s.restoreBtn, opacity: restoring ? 0.6 : 1 }}
            title={restoreError || 'Contrat annulé par erreur ? Le remettre en place'}
          >
            <ArrowCounterClockwise size={13} weight="bold" />
            {restoring ? 'Réactivation…' : restoreError ? 'Réessayer' : 'Réactiver'}
          </button>
        )}
        {c.token && c.statut !== 'annule' && (
          <a
            href={`/sign/${c.token}`}
            target="_blank"
            rel="noopener noreferrer"
            style={s.actionBtn}
            title={c.statut === 'signe' ? 'Voir le contrat signé (impression, PDF)' : 'Voir le contrat envoyé'}
            aria-label="Voir le contrat"
          >
            <Eye size={13} weight="bold" />
          </a>
        )}
        {c.voyageur_id && (
          <Link
            href={`/dashboard/voyageurs/${c.voyageur_id}`}
            style={s.actionBtn}
            title="Ouvrir la fiche voyageur (relance, caution, facture)"
            aria-label="Ouvrir la fiche voyageur"
          >
            <ArrowSquareOut size={13} weight="bold" />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
function FilterPills({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={s.pillGroup}>
      {options.map(opt => (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          style={{ ...s.pill, ...(value === opt.v ? s.pillActive : {}) }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {

  kpiGrid: {
    ...ui.kpis, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 125px), 1fr))',
    padding: '14px 0', margin: '0 0 16px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
  },
  clearBtn: { background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2, display: 'flex' },
  linkBtn: { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 },
  kpiCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '12px',
  },
  kpiIcon: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--accent-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  kpiValue: {
    fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif',
    letterSpacing: '-0.3px', lineHeight: 1.1,
  },
  kpiLabel: {
    fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px',
  },

  filters: {
    display: 'flex', flexWrap: 'wrap', gap: '8px',
    alignItems: 'center', marginBottom: '14px',
  },
  search: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '9px 12px', background: 'var(--bg)',
    border: '1px solid var(--border-2)', borderRadius: '10px',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '13.5px', fontFamily: 'inherit',
    minWidth: 0,
  },
  pillGroup: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: '10px', flexWrap: 'wrap',
  },
  pillIcon: { color: 'var(--text-muted)', marginLeft: '6px', display: 'inline-flex' },
  pill: {
    padding: '6px 11px', borderRadius: '7px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-2)', background: 'transparent',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  pillActive: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)', fontWeight: 700,
  },
  select: {
    padding: '8px 12px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '10px',
    color: 'var(--text)', fontSize: '12.5px', fontFamily: 'inherit', cursor: 'pointer',
  },

  resultsLabel: {
    fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px',
  },

  list: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 16px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: '12px',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  rowAvatar: {
    width: '38px', height: '38px', borderRadius: '50%',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)', fontWeight: 700, fontSize: '13px',
    fontFamily: 'var(--font-fraunces), serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowName: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  rowMeta: {
    display: 'flex', flexWrap: 'wrap', gap: '10px',
    fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px',
  },
  rowMoney: { textAlign: 'right' as const, minWidth: '90px' },
  rowAmount: {
    fontSize: '14.5px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif',
    color: 'var(--accent-text)',
  },
  rowDeposit: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  statusBadge: {
    padding: '4px 10px', borderRadius: '999px',
    fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
  },
  rowActions: { display: 'flex', gap: '4px' },
  restoreBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', height: '32px', padding: '0 10px',
    borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-2)', textDecoration: 'none', cursor: 'pointer',
  },

  empty: {
    padding: 'clamp(12px, 3vw, 32px) 0',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', gap: '14px',
  },
  emptyIcon: {
    width: '64px', height: '64px', borderRadius: '16px',
    background: 'var(--accent-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  emptyH: {
    fontFamily: 'var(--font-fraunces), serif', fontWeight: 400,
    fontSize: 'clamp(22px, 2.4vw, 28px)',
    color: 'var(--text)', margin: 0,
    textAlign: 'center' as const,
    letterSpacing: '-0.3px',
  },
  emptyLead: {
    fontSize: '14.5px', color: 'var(--text-2)', lineHeight: 1.75,
    margin: 0,
    maxWidth: '720px',
    textAlign: 'center' as const,
  },
  emptyResults: {
    padding: '28px 20px', textAlign: 'center' as const,
    background: 'var(--bg)', border: '1px dashed var(--border)',
    borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13.5px',
  },
  resetBtn: {
    marginLeft: '8px', padding: '6px 12px',
    background: 'var(--bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)', borderRadius: '8px',
    fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
}
