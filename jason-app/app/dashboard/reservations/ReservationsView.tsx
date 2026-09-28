'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  MagnifyingGlass, Download, SquaresFour, Rows, House, CalendarBlank,
  Users, X, ArrowsCounterClockwise, CaretRight,
  Envelope, Phone, ArrowSquareOut, Broom, ArrowRight, Plus, FileText, UserPlus,
} from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import { Stat, ui } from '../finances/_ui/ui'
import type { Reservation, LogementLite, Platform, ReservationStatus } from './types'
import { PLATFORM_META } from './types'
import Select, { type SelectOption } from '@/components/ui/Select'
import TourTrigger from '@/components/dashboard/TourTrigger'
import type { MenageSlot } from '@/lib/menage/compute'

import type { VoyageurOption } from '@/app/dashboard/logements/[id]/QuickSejourModal'

// Même modale que « Nouvelle réservation directe » (Contrats & paiements) et
// la fiche logement : voyageur + logement + dates, puis contrat au besoin.
const QuickSejourModal = dynamic(() => import('@/app/dashboard/logements/[id]/QuickSejourModal'), { ssr: false })

// ─── Helpers ──────────────────────────────────────────────────────────────

// La date du jour (Paris) vient du serveur via la prop `today` : calculée
// dans le navigateur, elle différait du rendu serveur autour de minuit.
function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmtDate(d: string, opts?: Intl.DateTimeFormatOptions) {
  const [y, m, dd] = d.split('-').map(Number)
  return new Date(y, m - 1, dd).toLocaleDateString('fr-FR', opts ?? { day: 'numeric', month: 'short' })
}
function nights(from: string, to: string) {
  return Math.max(0, Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000))
}
function statusOf(r: Reservation, today: string): ReservationStatus {
  if (r.date_depart < today) return 'past'
  if (r.date_arrivee <= today && r.date_depart >= today) return 'ongoing'
  return 'upcoming'
}
function statusMeta(s: ReservationStatus) {
  if (s === 'past')    return { label: 'Terminé', color: 'var(--text-3)' }
  if (s === 'ongoing') return { label: 'Sur place', color: 'var(--accent-text)' }
  return { label: 'À venir', color: 'var(--text-2)' }
}

// Ce qui reste à compléter sur une réservation pas encore terminée
type TodoKey = 'voyageur' | 'contrat'
/** Réservation Airbnb/Booking synchronisée : ni nom, ni contact, ni déclaration */
function needsGuest(r: Reservation, today: string) {
  return r.source === 'ical' && r.date_depart >= today
}
/** Réservation directe saisie, sans contrat : à créer depuis la fiche voyageur */
function needsContract(r: Reservation, today: string) {
  return r.source === 'sejour' && r.platform === 'direct' && !!r.voyageur_id
    && (!r.contract_status || r.contract_status === 'nouveau') && r.date_depart >= today
}

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
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
  // Bandeau « Planning ménage » (le détail est dans Calendrier → Ménage)
  menageSlots: MenageSlot[]
  menageDoneIds: string[]
  voyageurs: VoyageurOption[]
  /** 'YYYY-MM-DD', heure de Paris, calculé côté serveur */
  today: string
}

// Modale de saisie : nouvelle réservation, ou voyageur d'une réservation
// Airbnb/Booking synchronisée (dates et logement préremplis)
type QuickTarget = { kind: 'new' } | { kind: 'attach'; r: Reservation }

export default function ReservationsView({
  reservations, logements, menageSlots, menageDoneIds, voyageurs, today,
}: Props) {
  const [quick, setQuick] = useState<QuickTarget | null>(null)
  const [period, setPeriod] = useState<Period>('upcoming')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [logementId, setLogementId] = useState<string | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('arrival-asc')
  const [view, setView] = useState<ViewMode>('cards')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [todo, setTodo] = useState<TodoKey | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const platforms: Array<Platform | 'all'> = ['all', 'airbnb', 'booking', 'direct', 'driing', 'vrbo']

  // Ce qui reste à compléter sur les réservations à venir (encadré du hero)
  const todoCounts = useMemo(() => ({
    voyageur: reservations.filter(r => needsGuest(r, today)).length,
    contrat: reservations.filter(r => needsContract(r, today)).length,
  }), [reservations, today])

  // La semaine en cours (encadré du hero)
  const week = useMemo(() => {
    const in7 = addDays(today, 6)
    const done = new Set(menageDoneIds)
    return {
      arriveesAuj: reservations.filter(r => r.date_arrivee === today).length,
      departsAuj: reservations.filter(r => r.date_depart === today).length,
      surPlace: reservations.filter(r => r.date_arrivee < today && r.date_depart > today).length,
      arrivees7: reservations.filter(r => r.date_arrivee >= today && r.date_arrivee <= in7).length,
      menages7: menageSlots.filter(sl => sl.date >= today && sl.date <= in7 && !done.has(sl.id)).length,
    }
  }, [reservations, menageSlots, menageDoneIds, today])

  // Filtrage
  const filtered = useMemo(() => {
    let list = [...reservations]

    if (todo === 'voyageur') list = list.filter(r => needsGuest(r, today))
    else if (todo === 'contrat') list = list.filter(r => needsContract(r, today))
    // Période (à partir de la date du jour fournie par le serveur)
    else if (period === 'upcoming') list = list.filter(r => r.date_depart >= today)
    else if (period === 'past') list = list.filter(r => r.date_depart < today)
    else if (period === 'week') {
      const dow = (new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7
      const mStr = addDays(today, -dow), sStr = addDays(mStr, 6)
      list = list.filter(r => r.date_arrivee <= sStr && r.date_depart >= mStr)
    }
    else if (period === 'month') {
      const yMonth = today.slice(0, 7)
      list = list.filter(r => r.date_arrivee.startsWith(yMonth) || r.date_depart.startsWith(yMonth))
    }
    else if (period === 'year') {
      const y = today.slice(0, 4)
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

    list.sort((a, b) => {
      if (sort === 'arrival-asc')  return a.date_arrivee.localeCompare(b.date_arrivee)
      if (sort === 'arrival-desc') return b.date_arrivee.localeCompare(a.date_arrivee)
      if (sort === 'amount-desc')  return (b.montant ?? 0) - (a.montant ?? 0)
      if (sort === 'nights-desc')  return nights(b.date_arrivee, b.date_depart) - nights(a.date_arrivee, a.date_depart)
      return 0
    })

    return list
  }, [reservations, period, platform, logementId, search, sort, logements, today, todo])

  // Chiffres de la sélection
  const kpis = useMemo(() => {
    const total = filtered.length
    const withAmount = filtered.filter(r => r.montant != null)
    const revenue = withAmount.reduce((sum, r) => sum + (r.montant ?? 0), 0)
    const totalNights = filtered.reduce((sum, r) => sum + nights(r.date_arrivee, r.date_depart), 0)
    // Prix moyen calculé seulement sur les réservations dont on connaît le
    // montant : avant, les nuits Airbnb/Booking synchronisées (montant
    // inconnu) faisaient baisser la moyenne.
    const pricedNights = withAmount.reduce((sum, r) => sum + nights(r.date_arrivee, r.date_depart), 0)
    const avgPerNight = pricedNights > 0 ? Math.round(revenue / pricedNights) : 0
    const unknownAmount = total - withAmount.length
    return { total, revenue, totalNights, avgPerNight, unknownAmount }
  }, [filtered])

  // Regroupement par mois d'arrivée (tri par date seulement)
  const groups = useMemo(() => {
    if (sort !== 'arrival-asc' && sort !== 'arrival-desc') return [{ key: 'all', label: '', items: filtered }]
    const out: Array<{ key: string; label: string; items: Reservation[] }> = []
    for (const r of filtered) {
      const key = r.date_arrivee.slice(0, 7)
      let g = out[out.length - 1]
      if (!g || g.key !== key) { g = { key, label: monthLabel(key), items: [] }; out.push(g) }
      g.items.push(r)
    }
    return out
  }, [filtered, sort])

  function resetFilters() {
    setPeriod('upcoming'); setPlatform('all'); setLogementId('all'); setSearch(''); setSort('arrival-asc'); setTodo(null)
  }

  function showTodo(k: TodoKey) {
    setTodo(k); setSearch(''); setPlatform('all'); setLogementId('all'); setSort('arrival-asc')
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  function exportCSV() {
    const rows = [
      ['Voyageur', 'E-mail', 'Téléphone', 'Logement', 'Arrivée', 'Départ', 'Nuits', 'Montant', 'Plateforme', 'Statut contrat'],
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
        r.contract_status ? prettyContractStatus(r.contract_status) : '',
      ]),
    ]
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `reservations-${today}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const weekRows: Array<{ n: number; label: string }> = [
    { n: week.arriveesAuj, label: week.arriveesAuj > 1 ? 'arrivées aujourd\'hui' : 'arrivée aujourd\'hui' },
    { n: week.departsAuj, label: week.departsAuj > 1 ? 'départs aujourd\'hui' : 'départ aujourd\'hui' },
    { n: week.surPlace, label: week.surPlace > 1 ? 'séjours en cours' : 'séjour en cours' },
    { n: week.arrivees7, label: week.arrivees7 > 1 ? 'arrivées dans les 7 jours' : 'arrivée dans les 7 jours' },
  ]

  return (
    <div style={ui.page}>
      <style>{MOBILE_CSS}</style>
      <HubHero
        eyebrowIcon={<CalendarBlank size={14} weight="fill" />}
        eyebrow="Mes réservations"
        title={<>Toutes tes <HeroEm>réservations</HeroEm>, au même endroit</>}
        desc="Airbnb, Booking et tes réservations directes. Clique une réservation pour voir le voyageur, le contrat et ce qu'il reste à faire."
        aside={
          <div style={{ ...heroCard, width: '100%' }}>
            <div style={s.asideTitle}>Cette semaine</div>
            <div style={s.weekGrid}>
              {weekRows.map(w => (
                <div key={w.label} style={s.weekItem}>
                  <strong style={{ ...s.weekNum, color: w.n > 0 ? 'var(--text)' : 'var(--text-3)' }}>{w.n}</strong>
                  <span style={s.weekLbl}>{w.label}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/calendrier/menage" style={s.asideLink}>
              <Broom size={14} weight="bold" /> {week.menages7 > 0 ? `${week.menages7} ménage${week.menages7 > 1 ? 's' : ''} à faire dans les 7 jours` : 'Planning ménage'}
              <ArrowRight size={12} weight="bold" style={{ marginLeft: 'auto' }} />
            </Link>
            {(todoCounts.voyageur > 0 || todoCounts.contrat > 0) && (
              <div style={s.todoBox}>
                <div style={s.asideTitle}>À compléter</div>
                {todoCounts.voyageur > 0 && (
                  <button type="button" onClick={() => showTodo('voyageur')} style={s.todoRow}>
                    <UserPlus size={15} color="#B7791F" />
                    <span style={{ flex: 1 }}><strong>{todoCounts.voyageur}</strong> réservation{todoCounts.voyageur > 1 ? 's' : ''} Airbnb ou Booking sans voyageur</span>
                    <CaretRight size={13} color="var(--text-3)" />
                  </button>
                )}
                {todoCounts.contrat > 0 && (
                  <button type="button" onClick={() => showTodo('contrat')} style={s.todoRow}>
                    <FileText size={15} color="#B7791F" />
                    <span style={{ flex: 1 }}><strong>{todoCounts.contrat}</strong> réservation{todoCounts.contrat > 1 ? 's' : ''} directe{todoCounts.contrat > 1 ? 's' : ''} sans contrat</span>
                    <CaretRight size={13} color="var(--text-3)" />
                  </button>
                )}
              </div>
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={() => setQuick({ kind: 'new' })} style={heroCta}>
            <Plus size={16} weight="bold" /> Nouvelle réservation
          </button>
          <button type="button" onClick={exportCSV} style={s.heroGhost} title="Exporter en CSV la sélection affichée">
            <Download size={15} weight="bold" /> Exporter
          </button>
          <TourTrigger />
        </div>
      </HubHero>

      <div ref={listRef} style={{ ...ui.card, scrollMarginTop: 16 }}>
        {/* Période */}
        <div style={s.chipsRow} data-tour="resa-filtres">
          {todo ? (
            <span style={{ ...s.chip, ...s.chipActive, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {todo === 'voyageur' ? 'Sans voyageur (à venir)' : 'Directes sans contrat (à venir)'}
              <button type="button" onClick={() => setTodo(null)} style={s.chipClose} aria-label="Retirer ce filtre"><X size={12} weight="bold" /></button>
            </span>
          ) : PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{ ...s.chip, ...(period === p.key ? s.chipActive : {}) }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Chiffres de la sélection */}
        <div style={s.kpiRow} data-tour="resa-kpis">
          <Stat label="Réservations" value={kpis.total} />
          <Stat label="Nuits" value={kpis.totalNights} />
          <Stat
            label="Montant"
            value={fmtEurCompact(kpis.revenue)}
            tone="green"
            hint={kpis.unknownAmount > 0 ? `hors ${kpis.unknownAmount} sans montant (Airbnb, Booking)` : undefined}
          />
          <Stat label="Prix moyen par nuit" value={kpis.avgPerNight ? fmtEur(kpis.avgPerNight) : '-'} hint={kpis.avgPerNight ? 'sur les réservations au montant connu' : undefined} />
        </div>

        {/* Filtres */}
        <div style={s.filterControls}>
          <div style={s.searchWrap}>
            <MagnifyingGlass size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Voyageur, logement, e-mail…" aria-label="Rechercher une réservation" style={s.searchInput} />
            {search && (
              <button onClick={() => setSearch('')} style={s.searchClear} aria-label="Effacer la recherche"><X size={12} /></button>
            )}
          </div>
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
              { value: 'arrival-asc',  label: 'Arrivée la plus proche' },
              { value: 'arrival-desc', label: 'Arrivée la plus lointaine' },
              { value: 'amount-desc',  label: 'Plus gros montant' },
              { value: 'nights-desc',  label: 'Plus long séjour' },
            ]}
            ariaLabel="Trier par"
          />
          <div style={s.viewToggle} role="group" aria-label="Affichage">
            <button onClick={() => setView('cards')} aria-pressed={view === 'cards'} style={{ ...s.viewBtn, ...(view === 'cards' ? s.viewBtnActive : {}) }} title="Cartes"><SquaresFour size={14} weight={view === 'cards' ? 'fill' : 'regular'} /></button>
            <button onClick={() => setView('table')} aria-pressed={view === 'table'} style={{ ...s.viewBtn, ...(view === 'table' ? s.viewBtnActive : {}) }} title="Tableau"><Rows size={14} weight={view === 'table' ? 'fill' : 'regular'} /></button>
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <CalendarBlank size={36} weight="thin" color="var(--text-3)" />
            <div style={s.emptyTitle}>{reservations.length === 0 ? 'Aucune réservation pour l\'instant' : 'Aucune réservation ne correspond'}</div>
            <div style={s.emptyDesc}>
              {reservations.length === 0
                ? <>Connecte ton calendrier Airbnb ou Booking depuis la fiche de ton logement, ou ajoute une réservation directe.</>
                : <>Change la période ou retire un filtre.</>}
            </div>
            {reservations.length === 0
              ? <button onClick={() => setQuick({ kind: 'new' })} style={{ ...ui.btn, marginTop: 6 }}><Plus size={14} weight="bold" /> Nouvelle réservation</button>
              : <button onClick={resetFilters} style={{ ...ui.btnGhost, marginTop: 6 }}><ArrowsCounterClockwise size={13} weight="bold" /> Réinitialiser les filtres</button>}
          </div>
        ) : view === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
            {groups.map(g => (
              <section key={g.key}>
                {g.label && <h3 style={s.monthHead}>{g.label} <span style={s.monthCount}>{g.items.length}</span></h3>}
                <div style={s.cardsGrid}>
                  {g.items.map(r => <ResaCard key={r.id} r={r} today={today} onClick={() => setSelected(r)} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 16 }}><TableView reservations={filtered} today={today} onSelect={setSelected} /></div>
        )}
      </div>

      {/* DRAWER DÉTAIL */}
      {selected && (
        <ReservationDrawer
          r={selected}
          today={today}
          onClose={() => setSelected(null)}
          onAttachGuest={r => { setSelected(null); setQuick({ kind: 'attach', r }) }}
        />
      )}

      {quick && (
        <QuickSejourModal
          voyageurs={voyageurs}
          logements={logements}
          onClose={() => setQuick(null)}
          {...(quick.kind === 'attach' ? {
            defaults: { logementNom: quick.r.logement_name, dateArrivee: quick.r.date_arrivee, dateDepart: quick.r.date_depart },
            platform: quick.r.platform === 'airbnb' || quick.r.platform === 'booking' || quick.r.platform === 'vrbo' ? quick.r.platform : undefined,
          } : {})}
        />
      )}
    </div>
  )
}

// ─── Carte réservation ────────────────────────────────────────────────────

function ResaCard({ r, today, onClick }: { r: Reservation; today: string; onClick: () => void }) {
  const platform = PLATFORM_META[r.platform]
  const status = statusOf(r, today)
  const st = statusMeta(status)
  const n = nights(r.date_arrivee, r.date_depart)
  const [, m, dd] = r.date_arrivee.split('-').map(Number)
  const missingGuest = needsGuest(r, today)
  const missingContract = needsContract(r, today)

  return (
    <button onClick={onClick} style={{ ...c.card, opacity: status === 'past' ? 0.8 : 1 }} className="jm-resa-card">
      <div style={{ ...c.dateTile, ...(status === 'ongoing' ? c.dateTileOn : {}) }}>
        <span style={c.dateDay}>{dd}</span>
        <span style={c.dateMonth}>{MONTHS_SHORT[m - 1]}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ ...c.name, ...(r.source === 'ical' ? { color: 'var(--text-2)', fontStyle: 'italic' } : {}) }}>{r.voyageur_name}</div>
          {r.montant != null && <span style={c.montant}>{fmtEur(r.montant)}</span>}
        </div>
        <div style={c.line}>
          <House size={13} weight="duotone" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.logement_name}</span>
        </div>
        <div style={c.line}>
          {fmtDate(r.date_arrivee, { weekday: 'short', day: 'numeric', month: 'short' })} au {fmtDate(r.date_depart, { weekday: 'short', day: 'numeric', month: 'short' })} · {n} nuit{n > 1 ? 's' : ''}
        </div>
        <div style={c.metaRow}>
          <span style={{ ...c.badge, color: platform.color, borderColor: `${platform.color}55` }}>
            <span style={{ ...c.dot, background: platform.color }} />{platform.label}
          </span>
          {status !== 'upcoming' && <span style={{ ...c.badge, color: st.color, borderColor: 'var(--border-2)' }}>{st.label}</span>}
          {missingGuest && <span style={{ ...c.badge, ...c.badgeTodo }}><UserPlus size={11} weight="bold" /> Voyageur à ajouter</span>}
          {missingContract && <span style={{ ...c.badge, ...c.badgeTodo }}><FileText size={11} weight="bold" /> Contrat à créer</span>}
        </div>
      </div>
    </button>
  )
}

// ─── Vue tableau ──────────────────────────────────────────────────────────

function TableView({ reservations, today, onSelect }: { reservations: Reservation[]; today: string; onSelect: (r: Reservation) => void }) {
  return (
    <div style={t.wrap}>
      <div style={t.scroll} className="resa-table-scroll">
        <table style={t.table} className="resa-table">
          <thead>
            <tr>
              <th style={t.th}>Voyageur</th>
              <th style={t.th}>Logement</th>
              <th style={t.th}>Arrivée</th>
              <th style={t.th}>Départ</th>
              <th style={{ ...t.th, textAlign: 'right' }} className="resa-col-sec">Nuits</th>
              <th style={{ ...t.th, textAlign: 'right' }}>Montant</th>
              <th style={t.th} className="resa-col-sec">Source</th>
              <th style={t.th} className="resa-col-sec">Statut</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => {
              const st = statusMeta(statusOf(r, today))
              const p = PLATFORM_META[r.platform]
              const n = nights(r.date_arrivee, r.date_depart)
              return (
                <tr key={r.id} onClick={() => onSelect(r)} style={t.tr}>
                  <td style={t.td}>
                    <div style={t.voyageurCell}>
                      <span style={t.miniAvatar} className="resa-avatar">{r.source === 'ical' ? <CalendarBlank size={12} weight="duotone" /> : initials(r.voyageur_name)}</span>
                      <span>{r.voyageur_name}</span>
                    </div>
                  </td>
                  <td style={t.td}>{r.logement_name}</td>
                  <td style={t.td}>{fmtDate(r.date_arrivee)}</td>
                  <td style={t.td}>{fmtDate(r.date_depart)}</td>
                  <td style={{ ...t.td, textAlign: 'right' }} className="resa-col-sec">{n}</td>
                  <td style={{ ...t.td, textAlign: 'right', color: 'var(--accent-text)', fontWeight: 600 }}>
                    {r.montant != null ? fmtEur(r.montant) : '-'}
                  </td>
                  <td style={t.td} className="resa-col-sec">
                    <span style={{ ...t.dot, background: p.color }} />
                    {p.label}
                  </td>
                  <td style={t.td} className="resa-col-sec">
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

// Mobile : le tableau 8 colonnes debordait de l'ecran (colonnes coupees,
// cf. capture Jason). Sous 768px on masque les colonnes secondaires
// (Nuits, Source, Statut — toutes visibles dans le drawer au tap sur la
// ligne) et on compacte paddings/typo pour que Voyageur / Logement /
// dates / Montant tiennent. Le scroll horizontal reste en filet (touch).
const MOBILE_CSS = `
  .resa-table-scroll { -webkit-overflow-scrolling: touch; }
  @media (max-width: 767px) {
    .resa-col-sec { display: none !important; }
    .resa-table th, .resa-table td { padding: 10px 8px !important; font-size: 12px !important; }
    .resa-table th:first-child, .resa-table td:first-child { padding-left: 12px !important; }
    .resa-avatar { display: none !important; }
  }
`

// ─── Drawer détail ────────────────────────────────────────────────────────

function ReservationDrawer({ r, today, onClose, onAttachGuest }: {
  r: Reservation
  today: string
  onClose: () => void
  onAttachGuest: (r: Reservation) => void
}) {
  const platform = PLATFORM_META[r.platform]
  const status = statusOf(r, today)
  const st = statusMeta(status)
  // Réservation directe saisie, sans contrat : on propose de le créer
  // (assistant ouvert sur la fiche voyageur via ?contract=<séjour>)
  const canCreateContract = needsContract(r, today)
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
              <div style={{ ...d.blockVal, color: 'var(--accent-text)' }}>{r.montant != null ? fmtEur(r.montant) : '-'}</div>
              {perNight && <div style={d.blockHint}>{perNight} € / nuit</div>}
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
                <div style={d.rowInfo}>Contrat : <strong style={{ color: r.contract_status === 'signe' ? 'var(--accent-text)' : '#B7791F' }}>{prettyContractStatus(r.contract_status)}</strong></div>
              )}
              {r.payment_status && (
                <div style={d.rowInfo}>Loyer payé en ligne : <strong>{prettyPaymentStatus(r.payment_status)}</strong></div>
              )}
            </div>
          )}

          {/* Réservation importée d'Airbnb / Booking : l'app ne connaît que les dates */}
          {r.source === 'ical' && (
            <div style={d.section}>
              <div style={d.sectionLbl}>Réservation synchronisée</div>
              <div style={{ ...d.rowInfo, display: 'block', lineHeight: 1.55 }}>
                Importée depuis {PLATFORM_META[r.platform]?.label ?? 'la plateforme'} par la synchro du calendrier :
                la plateforme ne transmet ni le nom, ni le contact, ni le montant. Le ménage après le départ est déjà planifié.
                Ajoute le voyageur pour garder son contact et préparer la déclaration s&apos;il est étranger.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={d.actions}>
            {r.source === 'ical' && (
              <button type="button" onClick={() => onAttachGuest(r)} style={d.actionPrimary}>
                <UserPlus size={14} weight="bold" /> Ajouter le voyageur
              </button>
            )}
            {canCreateContract && (
              <Link href={`/dashboard/voyageurs/${r.voyageur_id}?contract=${r.sourceId}`} style={d.actionPrimary}>
                <FileText size={14} weight="bold" /> Créer le contrat
              </Link>
            )}
            {r.voyageur_id && (
              <Link href={`/dashboard/voyageurs/${r.voyageur_id}`} style={canCreateContract ? d.actionSecondary : d.actionPrimary}>
                <Users size={14} weight="bold" /> Voir la fiche voyageur
              </Link>
            )}
            {r.source === 'contract' && (
              <Link href="/dashboard/contrats" style={d.actionSecondary}>
                <ArrowSquareOut size={13} weight="bold" /> Contrats &amp; paiements
              </Link>
            )}
          </div>

          {/* Alertes contextuelles */}
          <ContextualAlerts r={r} today={today} />
        </div>
      </aside>
    </>
  )
}

function ContextualAlerts({ r, today }: { r: Reservation; today: string }) {
  const alerts: Array<{ level: 'warn' | 'info' | 'danger'; msg: string }> = []
  const status = statusOf(r, today)
  // Écart en jours avec la date du jour fournie par le serveur (négatif si passé)
  const daysToArrival = Math.round((new Date(r.date_arrivee + 'T12:00:00Z').getTime() - new Date(today + 'T12:00:00Z').getTime()) / 86400000)

  if (r.source === 'contract' && r.contract_status && r.contract_status !== 'signe' && daysToArrival >= 0 && daysToArrival <= 7) {
    alerts.push({ level: 'danger', msg: `Contrat non signé alors que l'arrivée est dans ${daysToArrival} jour${daysToArrival > 1 ? 's' : ''}.` })
  }
  // Statuts stockés par l'app : 'pending' | 'paid' | 'failed' (webhook Stripe)
  if (r.payment_status === 'pending' || r.payment_status === 'failed') {
    alerts.push({ level: 'warn', msg: r.payment_status === 'failed' ? 'Paiement en ligne échoué : relance le voyageur.' : 'Loyer pas encore payé en ligne : relance le voyageur.' })
  }
  if (r.source !== 'ical' && status === 'upcoming' && daysToArrival >= 0 && daysToArrival <= 3 && !r.voyageur_email && !r.voyageur_phone) {
    alerts.push({ level: 'warn', msg: 'Aucun contact voyageur enregistré : pense à récupérer ses coordonnées.' })
  }
  if (status === 'past' && r.contract_status === 'signe' && r.payment_status === 'paid') {
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
            a.level === 'danger' ? 'var(--danger-bg)'
              : a.level === 'warn' ? 'rgba(255,213,107,0.16)'
                : 'var(--accent-bg)',
          borderColor:
            a.level === 'danger' ? 'rgba(239,68,68,0.30)'
              : a.level === 'warn' ? 'rgba(183,121,31,0.30)'
                : 'var(--accent-border)',
          color:
            a.level === 'danger' ? 'var(--danger)'
              : a.level === 'warn' ? '#8A5A12'
                : 'var(--accent-text)',
        }}>{a.msg}</div>
      ))}
    </div>
  )
}

function prettyContractStatus(s: string) {
  const m: Record<string, string> = {
    signe: 'Signé',
    en_attente: 'En attente de signature',
    nouveau: 'Pas encore créé',
    brouillon: 'Brouillon',
    annule: 'Annulé',
  }
  return m[s] ?? s
}
function prettyPaymentStatus(s: string) {
  const m: Record<string, string> = {
    paid: 'Payé',
    pending: 'En attente',
    failed: 'Échoué',
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
  asideTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 14px' },
  weekItem: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  weekNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: 24, lineHeight: 1.05, fontWeight: 500 },
  weekLbl: { fontSize: 12, color: 'var(--text-3)', lineHeight: 1.35 },
  asideLink: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10,
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)',
    fontSize: 13, fontWeight: 700, textDecoration: 'none',
  },
  todoBox: { display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 10, borderTop: '1px solid var(--border)' },
  todoRow: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', background: 'none', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--text-2)', textAlign: 'left', lineHeight: 1.4,
  },
  heroGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12,
    background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  kpiRow: { ...ui.kpis, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 125px), 1fr))', margin: '16px 0', padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' },
  chipsRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  chip: { padding: '7px 13px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
  chipActive: { background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', fontWeight: 600 },
  chipClose: { display: 'inline-flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' },
  filterControls: { display: 'flex', flexWrap: 'wrap' as const, gap: 8, alignItems: 'center', position: 'relative', zIndex: 5 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 10, flex: '1 1 240px', minWidth: 0 },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', color: 'var(--text)', fontSize: 13.5, fontFamily: 'inherit', width: '100%', minWidth: 0 },
  searchClear: { background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2, display: 'flex' },
  viewToggle: { display: 'flex', border: '1px solid var(--border)', borderRadius: 9, background: 'var(--bg)', padding: 2 },
  viewBtn: { padding: '6px 10px', background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  viewBtnActive: { background: 'var(--accent-bg)', color: 'var(--accent-text)' },
  monthHead: { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', fontFamily: 'var(--font-fraunces), serif', fontSize: 17, fontWeight: 500, color: 'var(--text)' },
  monthCount: { fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg-2)', borderRadius: 999, padding: '1px 8px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 10 },
  empty: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px 20px 24px', textAlign: 'center' as const },
  emptyTitle: { fontSize: 15.5, color: 'var(--text)', fontWeight: 600 },
  emptyDesc: { fontSize: 13, color: 'var(--text-3)', maxWidth: 420, lineHeight: 1.55 },
}

const c: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex', gap: 14, alignItems: 'flex-start',
    padding: 14, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14,
    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const, width: '100%', minWidth: 0,
    color: 'var(--text)', transition: 'transform 0.15s var(--ease-spring), border-color 0.15s, box-shadow 0.15s',
  },
  dateTile: {
    width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '8px 0', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)',
  },
  dateTileOn: { background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' },
  dateDay: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, lineHeight: 1, color: 'var(--text)' },
  dateMonth: { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginTop: 3 },
  name: { fontSize: 15, fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  line: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', minWidth: 0 },
  metaRow: { display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginTop: 2 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999, border: '1px solid', background: 'transparent', whiteSpace: 'nowrap' },
  badgeTodo: { color: '#8A5A12', background: 'rgba(255,213,107,0.16)', borderColor: 'rgba(183,121,31,0.30)' },
  dot: { width: 7, height: 7, borderRadius: '50%', display: 'inline-block' },
  montant: { fontFamily: 'var(--font-fraunces), serif', fontSize: 16, color: 'var(--accent-text)', whiteSpace: 'nowrap', flexShrink: 0 },
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
  actionPrimary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', background: 'var(--accent-text)', color: 'var(--bg)', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  actionSecondary: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 9, fontSize: 13, fontWeight: 500, textDecoration: 'none' },
  alert: { padding: '10px 12px', border: '1px solid', borderRadius: 8, fontSize: 12.5, lineHeight: 1.5 },
}
