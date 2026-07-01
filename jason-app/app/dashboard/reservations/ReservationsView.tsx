'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlass, Download, SquaresFour, Rows, House, CalendarBlank,
  CurrencyEur, Users, ChartLineUp, X, ArrowsCounterClockwise,
  Envelope, Phone, ArrowSquareOut,
} from '@phosphor-icons/react/dist/ssr'
import type { Reservation, LogementLite, Platform, ReservationStatus } from './types'
import { PLATFORM_META } from './types'
import Select, { type SelectOption } from '@/components/ui/Select'

// ─── Helpers ──────────────────────────────────────────────────────────────

const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

function fmtDate(d: string, opts?: Intl.DateTimeFormatOptions) {
  const [y, m, dd] = d.split('-').map(Number)
  return new Date(y, m - 1, dd).toLocaleDateString('fr-FR', opts ?? { day: 'numeric', month: 'short' })
}
function nights(from: string, to: string) {
  return Math.max(0, Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000))
}
function statusOf(r: Reservation): ReservationStatus {
  if (r.date_depart < today) return 'past'
  if (r.date_arrivee <= today && r.date_depart >= today) return 'ongoing'
  return 'upcoming'
}
function statusMeta(s: ReservationStatus) {
  if (s === 'past')    return { label: 'Terminé', color: 'var(--text-muted)' }
  if (s === 'ongoing') return { label: 'En cours', color: '#63D683' }
  return { label: 'À venir', color: 'var(--accent-text)' }
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtEur(n: number) {
  return n.toLocaleString('fr-FR') + ' €'
}
function fmtEurCompact(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(1).replace('.', ',')} k€`
  return fmtEur(n)
}

// ─── Filtres types ────────────────────────────────────────────────────────

type Period = 'upcoming' | 'past' | 'week' | 'month' | 'year' | 'all'
type SortKey = 'arrival-asc' | 'arrival-desc' | 'amount-desc' | 'nights-desc'
type ViewMode = 'cards' | 'table'

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'upcoming', label: 'À venir' },
  { key: 'past',     label: 'Passées' },
  { key: 'week',     label: 'Cette semaine' },
  { key: 'month',    label: 'Ce mois' },
  { key: 'year',     label: 'Cette année' },
  { key: 'all',      label: 'Toutes' },
]

// ─── Composant principal ──────────────────────────────────────────────────

interface Props {
  reservations: Reservation[]
  logements: LogementLite[]
}

export default function ReservationsView({ reservations, logements }: Props) {
  const [period, setPeriod] = useState<Period>('upcoming')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [logementId, setLogementId] = useState<string | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('arrival-asc')
  const [view, setView] = useState<ViewMode>('cards')
  const [selected, setSelected] = useState<Reservation | null>(null)

  const platforms: Array<Platform | 'all'> = ['all', 'airbnb', 'booking', 'direct', 'driing', 'vrbo']

  // Filtrage
  const filtered = useMemo(() => {
    let list = [...reservations]

    // Période
    const now = new Date()
    if (period === 'upcoming') list = list.filter(r => r.date_depart >= today)
    else if (period === 'past') list = list.filter(r => r.date_depart < today)
    else if (period === 'week') {
      const monday = new Date(now)
      const diff = (monday.getDay() + 6) % 7
      monday.setDate(monday.getDate() - diff)
      const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6)
      const mStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
      const sStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
      list = list.filter(r => r.date_arrivee <= sStr && r.date_depart >= mStr)
    }
    else if (period === 'month') {
      const yMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      list = list.filter(r => r.date_arrivee.startsWith(yMonth) || r.date_depart.startsWith(yMonth))
    }
    else if (period === 'year') {
      const y = String(now.getFullYear())
      list = list.filter(r => r.date_arrivee.startsWith(y) || r.date_depart.startsWith(y))
    }

    if (platform !== 'all') list = list.filter(r => r.platform === platform)
    if (logementId !== 'all') {
      // logement_id n'est pas persiste sur contracts/sejours → filtre par
      // NOM du logement (via lookup dans la liste des logements).
      const targetName = logements.find(l => l.id === logementId)?.nom
      list = list.filter(r => (targetName && r.logement_name === targetName) || r.logement_id === logementId)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(r =>
        r.voyageur_name.toLowerCase().includes(q) ||
        r.logement_name.toLowerCase().includes(q) ||
        (r.voyageur_email ?? '').toLowerCase().includes(q),
      )
    }

    // Tri
    list.sort((a, b) => {
      if (sort === 'arrival-asc')  return a.date_arrivee.localeCompare(b.date_arrivee)
      if (sort === 'arrival-desc') return b.date_arrivee.localeCompare(a.date_arrivee)
      if (sort === 'amount-desc')  return (b.montant ?? 0) - (a.montant ?? 0)
      if (sort === 'nights-desc')  return nights(b.date_arrivee, b.date_depart) - nights(a.date_arrivee, a.date_depart)
      return 0
    })

    return list
  }, [reservations, period, platform, logementId, search, sort, logements])

  // KPIs
  const kpis = useMemo(() => {
    const total = filtered.length
    const revenue = filtered.reduce((sum, r) => sum + (r.montant ?? 0), 0)
    const totalNights = filtered.reduce((sum, r) => sum + nights(r.date_arrivee, r.date_depart), 0)
    const avgPerNight = totalNights > 0 ? Math.round(revenue / totalNights) : 0
    return { total, revenue, totalNights, avgPerNight }
  }, [filtered])

  function resetFilters() {
    setPeriod('upcoming'); setPlatform('all'); setLogementId('all'); setSearch(''); setSort('arrival-asc')
  }

  function exportCSV() {
    const rows = [
      ['Voyageur', 'Email', 'Téléphone', 'Logement', 'Arrivée', 'Départ', 'Nuits', 'Montant', 'Plateforme', 'Statut contrat'],
      ...filtered.map(r => [
        r.voyageur_name,
        r.voyageur_email ?? '',
        r.voyageur_phone ?? '',
        r.logement_name,
        r.date_arrivee,
        r.date_depart,
        String(nights(r.date_arrivee, r.date_depart)),
        r.montant != null ? String(r.montant) : '',
        PLATFORM_META[r.platform].label,
        r.contract_status ?? '',
      ]),
    ]
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `reservations-${today}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={s.wrap}>
      {/* HERO */}
      <div style={s.head}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={s.title}>Mes <em style={s.titleEm}>réservations</em></h1>
          <p style={s.sub}>Pilote toutes tes réservations : filtre, trie, exporte. Clique une carte pour voir le détail voyageur et l&apos;état du contrat.</p>
        </div>
        <button onClick={exportCSV} style={s.exportBtn} title="Exporter en CSV (filtres actifs)">
          <Download size={15} weight="bold" />Exporter CSV
        </button>
      </div>

      {/* STATS BAR */}
      <div style={s.kpiRow}>
        <div style={s.kpi}>
          <div style={s.kpiIco}><CalendarBlank size={18} weight="duotone" /></div>
          <div>
            <div style={s.kpiVal}>{kpis.total}</div>
            <div style={s.kpiLbl}>Réservation{kpis.total > 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={s.kpi}>
          <div style={{ ...s.kpiIco, color: '#63D683', background: 'rgba(99,214,131,0.12)', borderColor: 'rgba(99,214,131,0.30)' }}><CurrencyEur size={18} weight="duotone" /></div>
          <div>
            <div style={s.kpiVal}>{fmtEurCompact(kpis.revenue)}</div>
            <div style={s.kpiLbl}>CA {periodShortLabel(period)}</div>
          </div>
        </div>
        <div style={s.kpi}>
          <div style={{ ...s.kpiIco, color: '#93C5FD', background: 'rgba(147,197,253,0.12)', borderColor: 'rgba(147,197,253,0.30)' }}><Users size={18} weight="duotone" /></div>
          <div>
            <div style={s.kpiVal}>{kpis.totalNights}</div>
            <div style={s.kpiLbl}>Nuit{kpis.totalNights > 1 ? 's' : ''} vendue{kpis.totalNights > 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={s.kpi}>
          <div style={{ ...s.kpiIco, color: '#F472B6', background: 'rgba(244,114,182,0.12)', borderColor: 'rgba(244,114,182,0.30)' }}><ChartLineUp size={18} weight="duotone" /></div>
          <div>
            <div style={s.kpiVal}>{kpis.avgPerNight ? fmtEurCompact(kpis.avgPerNight) : '—'}</div>
            <div style={s.kpiLbl}>Prix moyen / nuit</div>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div style={s.filtersBar}>
        <div style={s.chipsRow}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{ ...s.chip, ...(period === p.key ? s.chipActive : {}) }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={s.filterControls}>
          <div style={s.searchWrap}>
            <MagnifyingGlass size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher voyageur, logement, email…" style={s.searchInput} />
            {search && (
              <button onClick={() => setSearch('')} style={s.searchClear} title="Effacer"><X size={12} /></button>
            )}
          </div>
          {/* Selects custom <Select> = dark theme coherent, plus des <select>
              natifs qui ignorent le CSS et rendent un dropdown blanc illisible */}
          <Select<Platform | 'all'>
            value={platform}
            onChange={setPlatform}
            options={platforms.map(p => ({
              value: p,
              label: p === 'all' ? 'Toutes plateformes' : PLATFORM_META[p as Platform].label,
              hint: p !== 'all' ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_META[p as Platform].color, display: 'inline-block' }} /> : null,
            } satisfies SelectOption<Platform | 'all'>))}
            ariaLabel="Filtrer par plateforme"
          />
          {logements.length > 1 && (
            <Select
              value={logementId}
              onChange={setLogementId}
              options={[
                { value: 'all', label: 'Tous logements' },
                ...logements.map(l => ({ value: l.id, label: l.nom })),
              ]}
              ariaLabel="Filtrer par logement"
            />
          )}
          <Select<SortKey>
            value={sort}
            onChange={setSort}
            options={[
              { value: 'arrival-asc',  label: 'Arrivée ↑' },
              { value: 'arrival-desc', label: 'Arrivée ↓' },
              { value: 'amount-desc',  label: 'Montant ↓' },
              { value: 'nights-desc',  label: 'Nuits ↓' },
            ]}
            ariaLabel="Trier par"
          />
          <div style={s.viewToggle}>
            <button onClick={() => setView('cards')} style={{ ...s.viewBtn, ...(view === 'cards' ? s.viewBtnActive : {}) }} title="Vue cartes"><SquaresFour size={13} weight={view === 'cards' ? 'fill' : 'regular'} /></button>
            <button onClick={() => setView('table')} style={{ ...s.viewBtn, ...(view === 'table' ? s.viewBtnActive : {}) }} title="Vue tableau"><Rows size={13} weight={view === 'table' ? 'fill' : 'regular'} /></button>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <CalendarBlank size={40} weight="thin" color="var(--text-muted)" />
          <div style={s.emptyTitle}>Aucune réservation ne correspond</div>
          <div style={s.emptyDesc}>Ajuste les filtres ou change la période.</div>
          <button onClick={resetFilters} style={s.resetBtn}><ArrowsCounterClockwise size={13} weight="bold" />Réinitialiser les filtres</button>
        </div>
      ) : view === 'cards' ? (
        <div style={s.cardsGrid}>
          {filtered.map(r => <ResaCard key={r.id} r={r} onClick={() => setSelected(r)} />)}
        </div>
      ) : (
        <TableView reservations={filtered} onSelect={setSelected} />
      )}

      {/* DRAWER DÉTAIL */}
      {selected && <ReservationDrawer r={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ─── Carte réservation ────────────────────────────────────────────────────

function ResaCard({ r, onClick }: { r: Reservation; onClick: () => void }) {
  const platform = PLATFORM_META[r.platform]
  const st = statusMeta(statusOf(r))
  const n = nights(r.date_arrivee, r.date_depart)
  const perNight = r.montant && n > 0 ? Math.round(r.montant / n) : null

  return (
    <button onClick={onClick} style={c.card} className="jm-resa-card">
      <span style={{ ...c.accent, background: platform.color }} />
      <div style={c.cardTop}>
        <div style={c.avatar}>{initials(r.voyageur_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={c.name}>{r.voyageur_name}</div>
          <div style={c.metaRow}>
            <span style={{ ...c.badge, color: platform.color, background: `${platform.color}18`, border: `1px solid ${platform.color}40` }}>
              {platform.label}
            </span>
            <span style={{ ...c.badge, color: st.color, background: 'transparent', border: `1px solid ${st.color}55` }}>
              {st.label}
            </span>
          </div>
        </div>
      </div>
      <div style={c.logement}><House size={12} weight="duotone" style={{ verticalAlign: -1 }} /> {r.logement_name}</div>
      <div style={c.datesRow}>
        <span><strong>{fmtDate(r.date_arrivee)}</strong> → <strong>{fmtDate(r.date_depart)}</strong></span>
        <span style={c.sep}>·</span>
        <span>{n} nuit{n > 1 ? 's' : ''}</span>
        {r.montant != null && (
          <>
            <span style={c.sep}>·</span>
            <span style={c.montant}>{fmtEur(r.montant)}</span>
            {perNight && <span style={c.perNight}>({perNight}€/nuit)</span>}
          </>
        )}
      </div>
    </button>
  )
}

// ─── Vue tableau ──────────────────────────────────────────────────────────

function TableView({ reservations, onSelect }: { reservations: Reservation[]; onSelect: (r: Reservation) => void }) {
  return (
    <div style={t.wrap}>
      <div style={t.scroll}>
        <table style={t.table}>
          <thead>
            <tr>
              <th style={t.th}>Voyageur</th>
              <th style={t.th}>Logement</th>
              <th style={t.th}>Arrivée</th>
              <th style={t.th}>Départ</th>
              <th style={{ ...t.th, textAlign: 'right' }}>Nuits</th>
              <th style={{ ...t.th, textAlign: 'right' }}>Montant</th>
              <th style={t.th}>Source</th>
              <th style={t.th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => {
              const st = statusMeta(statusOf(r))
              const p = PLATFORM_META[r.platform]
              const n = nights(r.date_arrivee, r.date_depart)
              return (
                <tr key={r.id} onClick={() => onSelect(r)} style={t.tr}>
                  <td style={t.td}>
                    <div style={t.voyageurCell}>
                      <span style={t.miniAvatar}>{initials(r.voyageur_name)}</span>
                      <span>{r.voyageur_name}</span>
                    </div>
                  </td>
                  <td style={t.td}>{r.logement_name}</td>
                  <td style={t.td}>{fmtDate(r.date_arrivee)}</td>
                  <td style={t.td}>{fmtDate(r.date_depart)}</td>
                  <td style={{ ...t.td, textAlign: 'right' }}>{n}</td>
                  <td style={{ ...t.td, textAlign: 'right', color: 'var(--accent-text)', fontWeight: 600 }}>
                    {r.montant != null ? fmtEur(r.montant) : '—'}
                  </td>
                  <td style={t.td}>
                    <span style={{ ...t.dot, background: p.color }} />
                    {p.label}
                  </td>
                  <td style={t.td}>
                    <span style={{ ...t.status, color: st.color }}>● {st.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Drawer détail ────────────────────────────────────────────────────────

function ReservationDrawer({ r, onClose }: { r: Reservation; onClose: () => void }) {
  const platform = PLATFORM_META[r.platform]
  const st = statusMeta(statusOf(r))
  const n = nights(r.date_arrivee, r.date_depart)
  const perNight = r.montant && n > 0 ? Math.round(r.montant / n) : null

  return (
    <>
      <div onClick={onClose} style={d.backdrop} />
      <aside style={d.drawer}>
        <div style={d.head}>
          <div style={{ ...d.accent, background: platform.color }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={d.headMeta}>{platform.label} · {st.label}</div>
            <div style={d.headName}>{r.voyageur_name}</div>
          </div>
          <button onClick={onClose} style={d.closeBtn} title="Fermer"><X size={16} /></button>
        </div>

        <div style={d.body}>
          {/* Résumé */}
          <div style={d.blockGrid}>
            <div style={d.block}>
              <div style={d.blockLbl}>Arrivée</div>
              <div style={d.blockVal}>{fmtDate(r.date_arrivee, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            </div>
            <div style={d.block}>
              <div style={d.blockLbl}>Départ</div>
              <div style={d.blockVal}>{fmtDate(r.date_depart, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            </div>
            <div style={d.block}>
              <div style={d.blockLbl}>Nuits</div>
              <div style={d.blockVal}>{n}</div>
            </div>
            <div style={d.block}>
              <div style={d.blockLbl}>Montant</div>
              <div style={{ ...d.blockVal, color: 'var(--accent-text)' }}>{r.montant != null ? fmtEur(r.montant) : '—'}</div>
              {perNight && <div style={d.blockHint}>{perNight}€ / nuit</div>}
            </div>
          </div>

          {/* Logement */}
          <div style={d.section}>
            <div style={d.sectionLbl}>Logement</div>
            <div style={d.rowInfo}><House size={15} weight="duotone" /> <strong>{r.logement_name}</strong></div>
          </div>

          {/* Voyageur contact */}
          {(r.voyageur_email || r.voyageur_phone) && (
            <div style={d.section}>
              <div style={d.sectionLbl}>Contact voyageur</div>
              {r.voyageur_email && (
                <a href={`mailto:${r.voyageur_email}`} style={d.rowLink}>
                  <Envelope size={15} weight="duotone" /> {r.voyageur_email}
                </a>
              )}
              {r.voyageur_phone && (
                <a href={`tel:${r.voyageur_phone}`} style={d.rowLink}>
                  <Phone size={15} weight="duotone" /> {r.voyageur_phone}
                </a>
              )}
            </div>
          )}

          {/* Contrat / paiement */}
          {(r.contract_status || r.payment_status) && (
            <div style={d.section}>
              <div style={d.sectionLbl}>Contrat &amp; paiement</div>
              {r.contract_status && (
                <div style={d.rowInfo}>Contrat : <strong style={{ color: r.contract_status === 'signe' ? '#63D683' : 'var(--accent-text)' }}>{prettyContractStatus(r.contract_status)}</strong></div>
              )}
              {r.payment_status && (
                <div style={d.rowInfo}>Paiement Stripe : <strong>{prettyPaymentStatus(r.payment_status)}</strong></div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={d.actions}>
            {r.voyageur_id && (
              <Link href={`/dashboard/voyageurs/${r.voyageur_id}`} style={d.actionPrimary}>
                <Users size={14} weight="bold" /> Voir la fiche voyageur
              </Link>
            )}
            {r.source === 'contract' && (
              <Link href={`/dashboard/gabarits`} style={d.actionSecondary}>
                <ArrowSquareOut size={13} weight="bold" /> Voir le contrat
              </Link>
            )}
          </div>

          {/* Alertes contextuelles */}
          <ContextualAlerts r={r} />
        </div>
      </aside>
    </>
  )
}

function ContextualAlerts({ r }: { r: Reservation }) {
  const alerts: Array<{ level: 'warn' | 'info' | 'danger'; msg: string }> = []
  const status = statusOf(r)
  const daysToArrival = Math.ceil((new Date(r.date_arrivee + 'T12:00').getTime() - Date.now()) / 86400000)

  if (r.source === 'contract' && r.contract_status && r.contract_status !== 'signe' && daysToArrival >= 0 && daysToArrival <= 7) {
    alerts.push({ level: 'danger', msg: `Contrat non signé alors que l'arrivée est dans ${daysToArrival} jour${daysToArrival > 1 ? 's' : ''}.` })
  }
  if (r.payment_status === 'requires_payment_method' || r.payment_status === 'requires_confirmation') {
    alerts.push({ level: 'warn', msg: 'Paiement Stripe en attente — relancer le voyageur.' })
  }
  if (status === 'upcoming' && daysToArrival >= 0 && daysToArrival <= 3 && !r.voyageur_email && !r.voyageur_phone) {
    alerts.push({ level: 'warn', msg: 'Aucun contact voyageur enregistré — pense à récupérer ses coordonnées.' })
  }
  if (status === 'past' && r.contract_status === 'signe' && r.payment_status === 'succeeded') {
    alerts.push({ level: 'info', msg: 'Séjour terminé et payé. Pense à demander un avis.' })
  }

  if (alerts.length === 0) return null
  return (
    <div style={d.section}>
      <div style={d.sectionLbl}>À traiter</div>
      {alerts.map((a, i) => (
        <div key={i} style={{
          ...d.alert,
          background:
            a.level === 'danger' ? 'rgba(248,113,113,0.10)'
              : a.level === 'warn' ? 'rgba(251,146,60,0.10)'
                : 'rgba(147,197,253,0.10)',
          borderColor:
            a.level === 'danger' ? 'rgba(248,113,113,0.30)'
              : a.level === 'warn' ? 'rgba(251,146,60,0.30)'
                : 'rgba(147,197,253,0.30)',
          color:
            a.level === 'danger' ? '#F87171'
              : a.level === 'warn' ? '#FB923C'
                : '#93C5FD',
        }}>{a.msg}</div>
      ))}
    </div>
  )
}

function prettyContractStatus(s: string) {
  const m: Record<string, string> = {
    signe: 'Signé',
    en_attente: 'En attente signature',
    brouillon: 'Brouillon',
    annule: 'Annulé',
  }
  return m[s] ?? s
}
function prettyPaymentStatus(s: string) {
  const m: Record<string, string> = {
    succeeded: 'Encaissé',
    requires_payment_method: 'À payer',
    requires_confirmation: 'À confirmer',
    processing: 'En cours',
    canceled: 'Annulé',
  }
  return m[s] ?? s
}
function periodShortLabel(p: Period) {
  const m: Record<Period, string> = {
    upcoming: 'à venir', past: 'passé', week: 'cette semaine',
    month: 'ce mois', year: 'cette année', all: 'total',
  }
  return m[p]
}

// ─── Styles ───────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 'var(--dash-page-px)', width: '100%', maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column' as const, gap: 18 },
  head: { display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' as const },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 400, letterSpacing: '-0.02em', margin: 0, marginBottom: 4 },
  titleEm: { color: 'var(--accent-text)', fontStyle: 'italic', fontWeight: 300 },
  sub: { fontSize: 13.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, maxWidth: 640 },
  exportBtn: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  kpi: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 },
  kpiIco: { width: 38, height: 38, borderRadius: 10, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiVal: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, fontWeight: 500, color: 'var(--text)', lineHeight: 1 },
  kpiLbl: { fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, letterSpacing: 0.3 },
  filtersBar: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  chipsRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  chip: { padding: '7px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 12.5, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  chipActive: { background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', fontWeight: 600 },
  filterControls: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, alignItems: 'center' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, flex: 1, minWidth: 220 },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', width: '100%' },
  searchClear: { background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2, display: 'flex' },
  /* Le style .select natif a ete retire — remplace par <Select> custom
     dans components/ui/Select.tsx qui gere le dropdown en dark theme. */
  viewToggle: { display: 'flex', border: '1px solid var(--border)', borderRadius: 9, background: 'var(--surface)', padding: 2 },
  viewBtn: { padding: '6px 10px', background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 },
  empty: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 10, padding: '60px 20px', textAlign: 'center' as const, color: 'var(--text-muted)' },
  emptyTitle: { fontSize: 15, color: 'var(--text-2)', fontWeight: 500 },
  emptyDesc: { fontSize: 12.5 },
  resetBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '7px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-2)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' },
}

const c: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative' as const,
    display: 'flex', flexDirection: 'column' as const, gap: 8,
    padding: '16px 16px 16px 20px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, width: '100%',
    color: 'var(--text)', transition: 'transform 0.15s var(--ease-spring), border-color 0.15s, box-shadow 0.15s',
  },
  accent: { position: 'absolute' as const, top: 0, left: 0, bottom: 0, width: 4, borderRadius: '12px 0 0 12px' },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,213,107,0.14)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-fraunces), serif', flexShrink: 0 },
  name: { fontSize: 14.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-fraunces), serif', letterSpacing: '-0.01em', marginBottom: 5 },
  metaRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 5 },
  badge: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, letterSpacing: 0.4, textTransform: 'uppercase' as const },
  logement: { fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 },
  datesRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, fontSize: 12, color: 'var(--text-3)' },
  sep: { color: 'var(--text-muted)', opacity: 0.6 },
  montant: { color: 'var(--accent-text)', fontWeight: 600 },
  perNight: { color: 'var(--text-muted)', fontSize: 11 },
}

const t: Record<string, React.CSSProperties> = {
  wrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  scroll: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { textAlign: 'left' as const, padding: '12px 14px', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' as const, borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' },
  td: { padding: '12px 14px', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' },
  tr: { cursor: 'pointer' },
  voyageurCell: { display: 'flex', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,213,107,0.14)', border: '1px solid var(--accent-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-text)', fontWeight: 600, fontSize: 10.5, fontFamily: 'var(--font-fraunces), serif' },
  dot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 6, verticalAlign: 1 },
  status: { fontSize: 12.5, fontWeight: 500 },
}

const d: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 300 },
  drawer: { position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(460px, 92vw)', background: 'var(--bg)', borderLeft: '1px solid var(--border-2)', boxShadow: '-20px 0 60px rgba(0,0,0,0.35)', zIndex: 310, display: 'flex', flexDirection: 'column' as const, animation: 'slideInRight 0.25s ease' },
  head: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--border)', position: 'relative' as const },
  accent: { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 4 },
  headMeta: { fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  headName: { fontFamily: 'var(--font-fraunces), serif', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginTop: 4, letterSpacing: '-0.01em' },
  closeBtn: { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { padding: '18px 20px 40px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 18 },
  blockGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  block: { padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 },
  blockLbl: { fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.4, fontWeight: 600, marginBottom: 4 },
  blockVal: { fontFamily: 'var(--font-fraunces), serif', fontSize: 15, fontWeight: 500, color: 'var(--text)' },
  blockHint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  section: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  sectionLbl: { fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.6, fontWeight: 700, marginBottom: 4 },
  rowInfo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', padding: '6px 0' },
  rowLink: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--accent-text)', padding: '6px 0', textDecoration: 'none' },
  actions: { display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 4 },
  actionPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', background: 'var(--accent-text)', color: 'var(--bg)', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  actionSecondary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 9, fontSize: 13, fontWeight: 500, textDecoration: 'none' },
  alert: { padding: '10px 12px', border: '1px solid', borderRadius: 8, fontSize: 12.5, lineHeight: 1.5 },
}
