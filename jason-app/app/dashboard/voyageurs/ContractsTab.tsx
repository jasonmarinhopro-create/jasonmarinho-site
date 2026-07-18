'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Select from '@/components/ui/Select'
import { FileText, MagnifyingGlass, CheckCircle, Clock, X, House, CurrencyEur, ArrowSquareOut, Plus, Info, Funnel } from '@phosphor-icons/react/dist/ssr'
import type { ContractRow } from './VoyageursView'

interface Props {
  contracts: ContractRow[]
}

type StatusFilter = 'tous' | 'en_attente' | 'signe' | 'annule'
type PeriodFilter = 'tous' | 'a-venir' | 'ce-mois' | 'passes'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  signe:      { label: 'Signé',      color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  annule:     { label: 'Annulé',     color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateShort(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
function fmtEur(n: number | null): string {
  if (n == null || !isFinite(n)) return '—'
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function monthPrefix(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ContractsTab({ contracts }: Props) {
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
    const today = todayISO()
    const thisMonth = monthPrefix(new Date())
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
  }, [contracts, search, statusFilter, periodFilter, logementFilter])

  const kpis = useMemo(() => {
    const total = contracts.length
    const signe = contracts.filter(c => c.statut === 'signe').length
    const enAttente = contracts.filter(c => c.statut === 'en_attente').length
    const caTotal = contracts
      .filter(c => c.statut !== 'annule')
      .reduce((acc, c) => acc + (c.montant_loyer ?? 0), 0)
    return { total, signe, enAttente, caTotal }
  }, [contracts])

  if (contracts.length === 0) {
    return (
      <div style={s.empty}>
        <div style={s.emptyIcon}>
          <FileText size={32} weight="duotone" color="var(--accent-text)" />
        </div>
        <h3 style={s.emptyH}>Aucun contrat pour le moment</h3>
        <p style={s.emptyLead}>
          Les contrats sont utiles principalement pour les <strong>réservations directes</strong> :
          bouche-à-oreille, site perso, réseaux sociaux, plateformes sans CGU intégrées (Driing, par ex.).
          Pour les séjours <strong>Airbnb</strong> et <strong>Booking</strong>, c'est rarement nécessaire :
          ces plateformes fournissent déjà leurs propres conditions générales d'utilisation, leur protection
          AirCover / Partner Protection, et leur médiation en cas de litige.
        </p>

        <div style={s.emptyHowTo}>
          <div style={s.emptyHowToTitle}>Comment créer ton premier contrat</div>
          <ol style={s.emptyHowToList}>
            <li>Ouvre la fiche d'un voyageur dans l'onglet <strong>Voyageurs</strong> ci-dessus</li>
            <li>Dans la section <strong>Séjours</strong>, repère le séjour concerné</li>
            <li>Clique <strong>« Créer un contrat »</strong> → un wizard te guide en 5 étapes (≈ 2 min)</li>
            <li>Le locataire signe en ligne via un lien sécurisé envoyé par email</li>
          </ol>
        </div>

        <div style={s.emptyCtaRow}>
          <a href="#voyageurs" style={s.emptyCtaPrimary}>Aller à mes voyageurs →</a>
          <a href="https://app.jasonmarinho.com/dashboard/guide" style={s.emptyCtaSecondary}>Lire le guide LCD</a>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Bandeau pédagogique permanent (compact, refermable visuellement
          mais non dismissable pour rappeler la nature de l'outil) */}
      <div style={s.note}>
        <Info size={14} weight="fill" color="var(--accent-text)" />
        <span>
          Les contrats servent surtout pour les <strong>réservations directes</strong>. Pour les séjours Airbnb / Booking, les plateformes gèrent leurs propres CGU.
        </span>
      </div>

      {/* KPIs */}
      <div style={s.kpiGrid}>
        <KpiCard icon={<FileText size={14} weight="fill" />} label="Total" value={String(kpis.total)} color="var(--text)" />
        <KpiCard icon={<CheckCircle size={14} weight="fill" />} label="Signés" value={String(kpis.signe)} color="#10b981" />
        <KpiCard icon={<Clock size={14} weight="fill" />} label="En attente" value={String(kpis.enAttente)} color="#d97706" />
        <KpiCard icon={<CurrencyEur size={14} weight="fill" />} label="CA contractualisé" value={fmtEur(kpis.caTotal)} color="var(--accent-text)" />
      </div>

      {/* Filtres */}
      <div style={s.filters}>
        <div style={{ ...s.search, flex: 1, minWidth: '200px' }}>
          <MagnifyingGlass size={14} weight="bold" color="var(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, logement…"
            style={s.searchInput}
          />
        </div>
        <FilterPills
          icon={<Funnel size={12} weight="fill" />}
          options={[
            { v: 'tous', label: 'Tous statuts' },
            { v: 'en_attente', label: 'En attente' },
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
        {filtered.length} contrat{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''} sur {contracts.length}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={s.emptyResults}>
          Aucun contrat ne correspond à ces filtres.
          <button onClick={() => { setSearch(''); setStatusFilter('tous'); setPeriodFilter('tous'); setLogementFilter('tous') }} style={s.resetBtn}>
            Réinitialiser
          </button>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(c => <ContractRow key={c.id} contract={c} />)}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
function ContractRow({ contract: c }: { contract: ContractRow }) {
  const meta = STATUS_META[c.statut] ?? { label: c.statut, color: 'var(--text-muted)', bg: 'transparent' }
  const fullName = `${c.locataire_prenom ?? ''} ${c.locataire_nom ?? ''}`.trim() || 'Locataire'
  const initials = ((c.locataire_prenom?.[0] ?? '') + (c.locataire_nom?.[0] ?? '')).toUpperCase() || '?'

  return (
    <div style={s.row}>
      <div style={s.rowAvatar}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.rowName}>{fullName}</div>
        <div style={s.rowMeta}>
          <span><House size={11} weight="fill" /> {c.logement_nom ?? 'Logement'}</span>
          <span>{fmtDateShort(c.date_arrivee)} → {fmtDateShort(c.date_depart)}</span>
        </div>
      </div>
      <div style={s.rowMoney}>
        <div style={s.rowAmount}>{fmtEur(c.montant_loyer)}</div>
        {c.montant_caution ? <div style={s.rowDeposit}>caution {fmtEur(c.montant_caution)}</div> : null}
      </div>
      <span style={{ ...s.statusBadge, color: meta.color, background: meta.bg }}>{meta.label}</span>
      <div style={s.rowActions}>
        {c.sejour_id && (
          <Link
            href={`/dashboard/voyageurs?sejour=${c.sejour_id}`}
            style={s.actionBtn}
            title="Voir dans la fiche voyageur"
          >
            <ArrowSquareOut size={13} weight="bold" />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={s.kpiCard}>
      <span style={{ ...s.kpiIcon, color }}>{icon}</span>
      <div>
        <div style={{ ...s.kpiValue, color }}>{value}</div>
        <div style={s.kpiLabel}>{label}</div>
      </div>
    </div>
  )
}

function FilterPills({ icon, options, value, onChange }: { icon?: React.ReactNode; options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={s.pillGroup}>
      {icon && <span style={s.pillIcon}>{icon}</span>}
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
  note: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    padding: '11px 14px', background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '10px', fontSize: '13px',
    color: 'var(--text-2)', lineHeight: 1.55,
    marginBottom: '20px',
  },

  kpiGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px', marginBottom: '20px',
  },
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
    padding: '8px 12px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '10px',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '13.5px', fontFamily: 'inherit',
    minWidth: '160px',
  },
  pillGroup: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '10px',
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
    padding: '14px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '12px',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  rowAvatar: {
    width: '38px', height: '38px', borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(0,76,63,0.12), rgba(0,76,63,0.04))',
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
    color: 'var(--success-1)',
  },
  rowDeposit: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  statusBadge: {
    padding: '4px 10px', borderRadius: '999px',
    fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
  },
  rowActions: { display: 'flex', gap: '4px' },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-2)', textDecoration: 'none', cursor: 'pointer',
  },

  empty: {
    padding: 'clamp(28px, 4vw, 56px) clamp(20px, 4vw, 56px)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', gap: '18px',
    maxWidth: '880px', margin: '0 auto',
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
  emptyHowTo: {
    width: '100%', maxWidth: '640px',
    padding: '20px 24px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '12px',
    marginTop: '4px',
  },
  emptyHowToTitle: {
    fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--accent-text)',
    marginBottom: '12px',
  },
  emptyHowToList: {
    margin: 0, padding: '0 0 0 22px',
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
    fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.65,
  },
  emptyCtaRow: {
    display: 'flex', gap: '10px', flexWrap: 'wrap' as const,
    justifyContent: 'center', marginTop: '6px',
  },
  emptyCtaPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '11px 22px', background: 'var(--accent-text)', color: 'var(--bg)',
    borderRadius: '10px', textDecoration: 'none',
    fontSize: '13.5px', fontWeight: 700, fontFamily: 'inherit',
  },
  emptyCtaSecondary: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '11px 18px', background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '13.5px', fontWeight: 500, fontFamily: 'inherit',
  },
  emptyResults: {
    padding: '28px 20px', textAlign: 'center' as const,
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13.5px',
  },
  resetBtn: {
    marginLeft: '8px', padding: '6px 12px',
    background: 'var(--bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)', borderRadius: '8px',
    fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
}
