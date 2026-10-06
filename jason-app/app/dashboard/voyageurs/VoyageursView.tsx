'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import { NATIONALITES } from '@/lib/nationalites'
import Link from 'next/link'
import Select from '@/components/ui/Select'
import { useRouter } from 'next/navigation'
import {
  Plus, MagnifyingGlass, Warning,
  X, User, Envelope, Phone, Trash, CalendarBlank, PencilSimple, CaretRight, FileText,
  Users, Star, SquaresFour, Rows, ProhibitInset, Faders, IdentificationCard,
} from '@phosphor-icons/react/dist/ssr'
import { addVoyageur, updateVoyageur, deleteVoyageur, checkVoyageurSignale, type VoyageurData } from './actions'
import TourTrigger from '@/components/dashboard/TourTrigger'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import HubHero, { HeroEm, heroCard, heroCta } from '@/components/dashboard/HubHero'
import { Card, CardHead, Notice, ui } from '../finances/_ui/ui'
import NewsletterCard from './NewsletterCard'

type Sejour = { id: string; date_arrivee: string; date_depart: string; montant: number | null }
type Voyageur = {
  id: string; prenom: string; nom: string
  email: string | null; telephone: string | null; notes: string | null
  tags: string[] | null; source: string | null; bloque: boolean | null
  id_verifie: boolean | null; note_privee: number | null
  checkin_expected_count: number | null
  nationalite: string | null
  created_at: string; updated_at: string
  sejours: Sejour[]; is_flagged: boolean
}

function avatarColor(name: string) {
  // Tons chauds et verts uniquement (pas de bleu ni de violet sur les pages hôte)
  const palette = ['#2D9A7B', '#3F7D5C', '#B7791F', '#D4875A', '#6B8E6B', '#8B6D5E']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

function fmtDay(iso: string) {
  return new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Prochain séjour (en cours ou à venir), sinon le dernier passé */
function stayInfo(sejours: Sejour[], today: string): { label: string; date: string; upcoming: boolean } | null {
  if (!sejours.length) return null
  const next = sejours.filter(sj => sj.date_depart >= today).sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee))[0]
  if (next) return { label: next.date_arrivee <= today ? 'Départ (sur place)' : 'Arrivée', date: next.date_arrivee <= today ? next.date_depart : next.date_arrivee, upcoming: true }
  const last = [...sejours].sort((a, b) => b.date_arrivee.localeCompare(a.date_arrivee))[0]
  return { label: 'Dernier séjour', date: last.date_arrivee, upcoming: false }
}

/** Séjour à venir mais nationalité inconnue : aucune déclaration ne peut être créée */
function missingNationality(v: Voyageur, today: string) {
  return !v.nationalite && v.sejours.some(sj => sj.date_depart >= today)
}

const COUNTRIES = NATIONALITES

// Un seul statut par voyageur, par ordre d'importance
type Status = 'signale' | 'bloque' | 'fidele' | 'recurrent'
function statusOf(v: Voyageur): Status | null {
  if (v.is_flagged) return 'signale'
  if (v.bloque) return 'bloque'
  if (v.sejours.length >= 4) return 'fidele'
  if (v.sejours.length >= 2) return 'recurrent'
  return null
}
const BADGE: Record<Status | 'nat', React.CSSProperties> = {
  signale: { background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)' },
  bloque: { background: 'var(--bg-2)', color: 'var(--text-3)', borderColor: 'var(--border-2)' },
  fidele: { background: 'rgba(255,213,107,0.18)', color: '#8A5A12', borderColor: 'rgba(183,121,31,0.30)' },
  recurrent: { background: 'var(--accent-bg)', color: 'var(--accent-text)', borderColor: 'var(--accent-border)' },
  nat: { background: 'rgba(255,213,107,0.14)', color: '#8A5A12', borderColor: 'rgba(183,121,31,0.30)' },
}
const BADGE_LABEL: Record<Status, string> = { signale: 'Signalé', bloque: 'Bloqué', fidele: 'Fidèle', recurrent: 'Récurrent' }
const BADGE_ICON: Record<Status, React.ReactNode> = {
  signale: <Warning size={11} weight="fill" />,
  bloque: <ProhibitInset size={11} weight="fill" />,
  fidele: <Star size={11} weight="fill" />,
  recurrent: null,
}

const EMPTY_FORM: VoyageurData = { prenom: '', nom: '', email: '', telephone: '', notes: '', nationalite: null, checkin_expected_count: null }

// ─── Filtres personnalisables ────────────────────────────────────────────────
// L'hôte choisit lesquels afficher (persisté en localStorage). « Tous » est
// toujours présent.

type FilterKey = 'a-venir' | 'sur-place' | 'sans-nationalite' | 'recurrents' | 'fideles' | 'signales' | 'bloques' | 'sans-contact'

const FILTER_DEFS: { key: FilterKey; label: string; desc: string; test: (v: Voyageur, today: string) => boolean }[] = [
  { key: 'a-venir',      label: 'À venir',      desc: 'Ont un séjour à venir',      test: (v, t) => v.sejours.some(sj => sj.date_arrivee >= t) },
  { key: 'sur-place',    label: 'Sur place',    desc: 'Actuellement en séjour',     test: (v, t) => v.sejours.some(sj => sj.date_arrivee <= t && sj.date_depart >= t) },
  { key: 'sans-nationalite', label: 'Nationalité manquante', desc: 'Séjour à venir sans nationalité : pas de déclaration possible', test: (v, t) => missingNationality(v, t) },
  { key: 'recurrents',   label: 'Récurrents',   desc: '2 séjours ou plus',          test: v => v.sejours.length >= 2 },
  { key: 'fideles',      label: 'Fidèles',      desc: '4 séjours ou plus',          test: v => v.sejours.length >= 4 },
  { key: 'signales',     label: 'Signalés',     desc: 'Signalés par un autre hôte', test: v => v.is_flagged },
  { key: 'bloques',      label: 'Bloqués',      desc: 'Que tu as bloqués',          test: v => v.bloque === true },
  { key: 'sans-contact', label: 'Sans contact', desc: 'Ni e-mail ni téléphone',      test: v => !v.email && !v.telephone },
]

const DEFAULT_VISIBLE_FILTERS: FilterKey[] = ['a-venir', 'sans-nationalite', 'recurrents', 'signales']
const FILTERS_LS_KEY = 'jm-voyageurs-filters'

interface Props {
  voyageurs: Voyageur[]
  tableReady: boolean
  pendingDeclarations?: number
  /** 'YYYY-MM-DD' à Paris, calculé côté serveur (évite l'écart serveur / navigateur) */
  today: string
}

export default function VoyageursView({ voyageurs, tableReady, pendingDeclarations = 0, today }: Props) {
  const router = useRouter()
  // Les contrats ont leur propre page (/dashboard/contrats, entrée
  // « Contrats & paiements » du menu). Les anciens liens #contrats y mènent.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#contrats') router.replace('/dashboard/contrats')
  }, [router])
  const [isPending, startTransition] = useTransition()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Voyageur | null>(null)
  const [form, setForm] = useState<VoyageurData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [signaleAlert, setSignaleAlert] = useState<{ count: number; motifs?: string[] } | null>(null)
  const [allowDespiteSignal, setAllowDespiteSignal] = useState(false)
  const [natOpen, setNatOpen] = useState(false)
  const [natSearch, setNatSearch] = useState('')

  // Filtres + tri + vue
  const [filter, setFilter] = useState<'all' | FilterKey>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'sejours' | 'ca'>('recent')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(voyageurs.length >= 10 ? 'table' : 'cards')

  // Filtres visibles, choisis par l'hôte (persistés en localStorage)
  const [visibleFilters, setVisibleFilters] = useState<FilterKey[]>(DEFAULT_VISIBLE_FILTERS)
  const [filterConfigOpen, setFilterConfigOpen] = useState(false)
  const filterConfigRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTERS_LS_KEY)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) {
          setVisibleFilters(arr.filter((k): k is FilterKey => FILTER_DEFS.some(d => d.key === k)))
        }
      }
    } catch { /* localStorage indisponible : on garde le défaut */ }
  }, [])

  useEffect(() => {
    if (!filterConfigOpen) return
    function handler(e: MouseEvent) {
      if (filterConfigRef.current && !filterConfigRef.current.contains(e.target as Node)) setFilterConfigOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterConfigOpen])

  function toggleVisibleFilter(key: FilterKey) {
    const next = visibleFilters.includes(key) ? visibleFilters.filter(k => k !== key) : [...visibleFilters, key]
    setVisibleFilters(next)
    try { localStorage.setItem(FILTERS_LS_KEY, JSON.stringify(next)) } catch { /* noop */ }
    // Si le filtre actif vient d'être masqué, retour à « Tous »
    if (!next.includes(key) && filter === key) setFilter('all')
  }

  const todayISO = today

  // Helper : CA d'un voyageur
  const caOf = (v: Voyageur) => v.sejours.reduce((sum, s) => sum + (s.montant ?? 0), 0)
  const isRecurrent = (v: Voyageur) => v.sejours.length >= 2

  // ─── Stats globales ─────────────────────────────────────────────
  const globalStats = useMemo(() => {
    const total = voyageurs.length
    const recurrents = voyageurs.filter(isRecurrent).length
    const signales = voyageurs.filter(v => v.is_flagged || v.bloque === true).length
    const caTotal = voyageurs.reduce((sum, v) => sum + caOf(v), 0)
    return { total, recurrents, signales, caTotal }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyageurs])

  // ─── Filtrage + tri ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = voyageurs.filter(v => {
      // Filtre par catégorie
      if (filter !== 'all') {
        const def = FILTER_DEFS.find(d => d.key === filter)
        if (def && !def.test(v, todayISO)) return false
      }

      // Recherche
      if (q) {
        const haystack = [v.prenom, v.nom, v.email ?? '', v.telephone ?? '', (v.tags ?? []).join(' ')].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    // Tri
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
      if (sortBy === 'sejours') return b.sejours.length - a.sejours.length
      if (sortBy === 'ca') return caOf(b) - caOf(a)
      // recent (default) : par updated_at
      return b.updated_at.localeCompare(a.updated_at)
    })
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyageurs, search, filter, sortBy, todayISO])

  function openAdd() {
    setForm(EMPTY_FORM)
    setFormError('')
    setEditTarget(null)
    setNatOpen(false); setNatSearch('')
    setModal('add')
  }

  function openEdit(v: Voyageur, e: React.MouseEvent) {
    e.stopPropagation()
    setForm({ prenom: v.prenom, nom: v.nom, email: v.email ?? '', telephone: v.telephone ?? '', notes: v.notes ?? '', nationalite: v.nationalite ?? null, checkin_expected_count: v.checkin_expected_count ?? null })
    setFormError('')
    setEditTarget(v)
    setModal('edit')
  }

  function closeModal() {
    setModal(null); setEditTarget(null)
    setSignaleAlert(null); setAllowDespiteSignal(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prenom.trim() || !form.nom.trim()) {
      setFormError('Prénom et nom sont obligatoires.')
      return
    }
    setFormError('')

    startTransition(async () => {
      // Phase 7, sécurité : si création, vérifier que email/tel ne sont pas signalés
      if (modal === 'add' && !allowDespiteSignal && (form.email?.trim() || form.telephone?.trim())) {
        const check = await checkVoyageurSignale({ email: form.email, telephone: form.telephone })
        if (check.signale) {
          setSignaleAlert({ count: check.count ?? 0, motifs: check.motifs })
          return
        }
      }

      const data: VoyageurData = {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email?.trim() || undefined,
        telephone: form.telephone?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        // Oubliée avant sept. 2026 : la nationalité choisie ici n'était jamais
        // enregistrée, donc aucune déclaration (fiche de police, SIBA) créée
        nationalite: form.nationalite ?? null,
        checkin_expected_count: form.checkin_expected_count ?? null,
      }
      const res = modal === 'edit' && editTarget
        ? await updateVoyageur(editTarget.id, data)
        : await addVoyageur(data)

      if (res.error) { setFormError(res.error); return }
      closeModal()
    })
  }

  async function handleDelete(v: Voyageur, e: React.MouseEvent) {
    e.stopPropagation()
    const n = v.sejours.length
    const msg = n > 0
      ? `Ses ${n} séjour${n > 1 ? 's' : ''} seront aussi supprimé${n > 1 ? 's' : ''}, avec leurs montants dans tes revenus. C'est définitif.`
      : `C'est définitif.`
    if (!(await confirm({ title: `Supprimer ${v.prenom} ${v.nom} ?`, message: msg, confirmLabel: 'Supprimer', danger: true }))) return
    const id = v.id
    startTransition(async () => {
      await deleteVoyageur(id)
    })
  }

  // Ce qui demande une action (bandeau de droite du hero)
  const todo = useMemo(() => ({
    sansNat: voyageurs.filter(v => missingNationality(v, todayISO)).length,
    signales: voyageurs.filter(v => v.is_flagged).length,
    sansContact: voyageurs.filter(v => !v.email && !v.telephone).length,
    aVenir: voyageurs.filter(v => v.sejours.some(sj => sj.date_arrivee >= todayISO)).length,
    surPlace: voyageurs.filter(v => v.sejours.some(sj => sj.date_arrivee <= todayISO && sj.date_depart >= todayISO)).length,
  }), [voyageurs, todayISO])

  function showFilter(key: FilterKey) {
    if (!visibleFilters.includes(key)) toggleVisibleFilter(key)
    setFilter(key)
    setSearch('')
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }
  const listRef = useRef<HTMLDivElement>(null)

  type TodoRow = { n: number; label: string; tone: 'red' | 'amber' | 'muted'; onClick?: () => void; href?: string }
  const todoRowsAll: TodoRow[] = [
    { n: pendingDeclarations, label: pendingDeclarations > 1 ? 'déclarations à faire' : 'déclaration à faire', tone: 'amber', href: '/dashboard/voyageurs/declarations' },
    { n: todo.sansNat, label: todo.sansNat > 1 ? 'voyageurs à venir sans nationalité' : 'voyageur à venir sans nationalité', tone: 'amber', onClick: () => showFilter('sans-nationalite') },
    { n: todo.signales, label: todo.signales > 1 ? 'voyageurs signalés par des hôtes' : 'voyageur signalé par un hôte', tone: 'red', onClick: () => showFilter('signales') },
    { n: todo.sansContact, label: todo.sansContact > 1 ? 'voyageurs sans e-mail ni téléphone (pas vérifiables)' : 'voyageur sans e-mail ni téléphone (pas vérifiable)', tone: 'muted', onClick: () => showFilter('sans-contact') },
  ]
  const todoRows = todoRowsAll.filter(r => r.n > 0)

  return (
    <div style={ui.page}>
      {confirmDialog}
      <HubHero
        eyebrowIcon={<Users size={14} weight="fill" />}
        eyebrow="Mes voyageurs"
        title={<>Ton carnet de <HeroEm>voyageurs</HeroEm></>}
        desc="Leurs coordonnées, leurs séjours et leur nationalité : de quoi faire les déclarations, vérifier chaque voyageur et faire revenir les meilleurs en direct."
        aside={tableReady && voyageurs.length > 0 ? (
          <div style={{ ...heroCard, width: '100%' }}>
            <div style={s.asideTitle}>{todoRows.length > 0 ? 'À régler' : 'Tout est en ordre'}</div>
            {todoRows.length > 0 ? (
              <ul style={s.todoList}>
                {todoRows.map(r => {
                  const color = r.tone === 'red' ? 'var(--danger)' : r.tone === 'amber' ? '#B7791F' : 'var(--text-3)'
                  const inner = <><strong style={{ ...s.todoNum, color }}>{r.n}</strong><span style={{ flex: 1 }}>{r.label}</span><CaretRight size={13} color="var(--text-3)" /></>
                  return (
                    <li key={r.label}>
                      {r.href
                        ? <Link href={r.href} style={s.todoRow}>{inner}</Link>
                        : <button type="button" onClick={r.onClick} style={s.todoRow}>{inner}</button>}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Nationalités renseignées, déclarations faites, aucun voyageur signalé.
              </p>
            )}
            <div style={s.asideStats}>
              <span><strong style={s.asideStatNum}>{globalStats.total}</strong> voyageur{globalStats.total > 1 ? 's' : ''}</span>
              <span><strong style={s.asideStatNum}>{todo.aVenir}</strong> à venir</span>
              <span><strong style={s.asideStatNum}>{globalStats.recurrents}</strong> récurrent{globalStats.recurrents > 1 ? 's' : ''}</span>
            </div>
          </div>
        ) : undefined}
      >
        {tableReady && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={openAdd} style={heroCta} data-tour="voyageur-create">
              <Plus size={16} weight="bold" /> Ajouter un voyageur
            </button>
            <Link href="/dashboard/voyageurs/declarations" style={s.heroGhost}>
              <IdentificationCard size={15} weight="fill" /> Déclarations
              {pendingDeclarations > 0 && <span style={s.declCount}>{pendingDeclarations}</span>}
            </Link>
            <TourTrigger />
          </div>
        )}
      </HubHero>

      {/* Table not ready */}
      {!tableReady && (
        <Notice tone="warn">La liste des voyageurs est indisponible pour le moment. Réessaie dans quelques minutes ou préviens Jason.</Notice>
      )}

      {tableReady && (
        <>
          {/* Empty state */}
          {voyageurs.length === 0 && (
            <Card>
              <CardHead title="Trois façons d'ajouter tes voyageurs" sub="Ton carnet se remplit tout seul au fil de tes réservations." />
              <div style={s.waysGrid}>
                <div style={s.way}>
                  <span style={s.wayIcon}><Plus size={18} color="var(--accent-text)" /></span>
                  <strong style={s.wayTitle}>À la main</strong>
                  <span style={s.wayText}>Prénom, nom, e-mail ou téléphone, nationalité : 30 secondes.</span>
                  <button type="button" onClick={openAdd} style={{ ...ui.btn, alignSelf: 'flex-start', marginTop: 4 }}>Ajouter un voyageur</button>
                </div>
                <div style={s.way}>
                  <span style={s.wayIcon}><CalendarBlank size={18} color="var(--accent-text)" /></span>
                  <strong style={s.wayTitle}>Depuis une réservation Airbnb ou Booking</strong>
                  <span style={s.wayText}>Les réservations synchronisées n&apos;ont ni nom ni contact : ouvre-la et clique « Ajouter le voyageur ».</span>
                  <Link href="/dashboard/reservations" style={{ ...ui.link, fontSize: 13 }}>Mes réservations</Link>
                </div>
                <div style={s.way}>
                  <span style={s.wayIcon}><FileText size={18} color="var(--accent-text)" /></span>
                  <strong style={s.wayTitle}>Avec une réservation directe</strong>
                  <span style={s.wayText}>« Nouvelle réservation directe » crée le voyageur, son séjour et son contrat en une fois.</span>
                  <Link href="/dashboard/contrats" style={{ ...ui.link, fontSize: 13 }}>Contrats & paiements</Link>
                </div>
              </div>
            </Card>
          )}

          {voyageurs.length > 0 && (
            <div ref={listRef} style={{ ...ui.card, padding: 'clamp(14px,2vw,20px)', scrollMarginTop: 16 }}>
              {/* Recherche + tri + vue */}
              <div style={s.toolsRow}>
                <div style={s.searchWrap}>
                  <MagnifyingGlass size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Nom, e-mail, téléphone, tag…"
                    aria-label="Rechercher un voyageur"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={s.searchInput}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={s.clearBtn} aria-label="Effacer la recherche">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div style={s.filterRight}>
                  <Select
                    value={sortBy}
                    onChange={v => setSortBy(v)}
                    options={[
                      { value: 'recent', label: 'Modifiés récemment' },
                      { value: 'name', label: 'Nom (A à Z)' },
                      { value: 'sejours', label: 'Plus de séjours' },
                      { value: 'ca', label: 'Plus gros montant' },
                    ]}
                    ariaLabel="Trier les voyageurs"
                  />
                  <div style={s.viewToggle} role="group" aria-label="Affichage">
                    <button onClick={() => setViewMode('cards')} aria-pressed={viewMode === 'cards'} style={{ ...s.viewBtn, ...(viewMode === 'cards' ? s.viewBtnActive : {}) }} title="Cartes">
                      <SquaresFour size={14} weight="fill" />
                    </button>
                    <button onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'} style={{ ...s.viewBtn, ...(viewMode === 'table' ? s.viewBtnActive : {}) }} title="Tableau">
                      <Rows size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filtres */}
              <div style={s.filterBar}>
                <div style={s.filterChips}>
                  <button onClick={() => setFilter('all')} style={{ ...s.filterChip, ...(filter === 'all' ? s.filterChipActive : {}) }}>
                    Tous <span style={s.chipCount}>{voyageurs.length}</span>
                  </button>
                  {FILTER_DEFS.filter(d => visibleFilters.includes(d.key)).map(d => {
                    const count = voyageurs.filter(v => d.test(v, todayISO)).length
                    return (
                      <button
                        key={d.key}
                        onClick={() => setFilter(d.key)}
                        title={d.desc}
                        style={{ ...s.filterChip, ...(filter === d.key ? s.filterChipActive : {}), opacity: count === 0 && filter !== d.key ? 0.55 : 1 }}
                      >
                        {d.label} <span style={s.chipCount}>{count}</span>
                      </button>
                    )
                  })}
                  <div ref={filterConfigRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setFilterConfigOpen(o => !o)}
                      style={{ ...s.filterChip, ...(filterConfigOpen ? s.filterChipActive : {}), padding: '7px 11px' }}
                      title="Choisir les filtres affichés"
                      aria-label="Choisir les filtres affichés"
                      aria-expanded={filterConfigOpen}
                    >
                      <Faders size={13} weight="bold" />
                    </button>
                    {filterConfigOpen && (
                      <div style={s.filterConfigPanel}>
                        <div style={s.filterConfigTitle}>Filtres affichés</div>
                        {FILTER_DEFS.map(d => (
                          <label key={d.key} style={s.filterConfigRow}>
                            <input
                              type="checkbox"
                              checked={visibleFilters.includes(d.key)}
                              onChange={() => toggleVisibleFilter(d.key)}
                              style={{ accentColor: 'var(--accent-text)', flexShrink: 0, marginTop: '2px' }}
                            />
                            <span style={{ flex: 1 }}>
                              <span style={s.filterConfigLabel}>{d.label}</span>
                              <span style={s.filterConfigDesc}>{d.desc}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Aucun résultat */}
              {filtered.length === 0 && (
                <div style={s.emptyState}>
                  <p style={s.emptyTitle}>
                    {search ? <>Aucun résultat pour &laquo;&nbsp;{search}&nbsp;&raquo;</> : 'Aucun voyageur dans ce filtre'}
                  </p>
                  <button onClick={() => { setSearch(''); setFilter('all') }} style={ui.btnGhost}>Voir tous les voyageurs</button>
                </div>
              )}

              {/* Vue cartes */}
              {filtered.length > 0 && viewMode === 'cards' && (
                <div style={s.tileGrid}>
                  {filtered.map(v => {
                    const initials = `${v.prenom[0] ?? ''}${v.nom[0] ?? ''}`.toUpperCase()
                    const color = avatarColor(v.prenom + v.nom)
                    const ca = caOf(v)
                    const status = statusOf(v)
                    const noNat = missingNationality(v, todayISO)
                    const stay = stayInfo(v.sejours, todayISO)
                    return (
                      <div
                        key={v.id}
                        onClick={() => router.push(`/dashboard/voyageurs/${v.id}`)}
                        style={{ ...s.tile, opacity: v.bloque ? 0.65 : 1, ...(v.is_flagged ? { border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)' } : {}) }}
                        className="dash-help-row"
                      >
                        <div style={s.tileActions} onClick={e => e.stopPropagation()}>
                          <button onClick={e => openEdit(v, e)} style={s.actionBtn} title="Modifier" aria-label={`Modifier ${v.prenom} ${v.nom}`}>
                            <PencilSimple size={14} />
                          </button>
                          <button onClick={e => handleDelete(v, e)} style={s.actionBtn} title="Supprimer" aria-label={`Supprimer ${v.prenom} ${v.nom}`}>
                            <Trash size={14} />
                          </button>
                        </div>

                        <div style={s.tileHead}>
                          <div style={{ ...s.tileAvatar, background: color }}>
                            <span style={s.tileAvatarText}>{initials}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link href={`/dashboard/voyageurs/${v.id}`} onClick={e => e.stopPropagation()} style={s.tileName}>
                              {v.prenom} {v.nom}
                            </Link>
                            <div style={s.tileMeta}>
                              {v.nationalite
                                ? <span title={COUNTRIES.find(c => c.code === v.nationalite)?.name ?? v.nationalite}>{COUNTRIES.find(c => c.code === v.nationalite)?.name ?? v.nationalite}</span>
                                : <span style={{ color: noNat ? '#B7791F' : 'var(--text-3)' }}>Nationalité inconnue</span>}
                            </div>
                          </div>
                        </div>

                        <div style={s.contactLines}>
                          <span style={s.contactLine}><Envelope size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />{v.email || <em style={s.missing}>pas d&apos;e-mail</em>}</span>
                          <span style={s.contactLine}><Phone size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />{v.telephone || <em style={s.missing}>pas de téléphone</em>}</span>
                        </div>

                        {(status || noNat || (v.tags && v.tags.length > 0)) && (
                          <div style={s.tileBadges}>
                            {status && <span style={{ ...s.badge, ...BADGE[status] }}>{BADGE_ICON[status]}{BADGE_LABEL[status]}</span>}
                            {noNat && (
                              <span style={{ ...s.badge, ...BADGE.nat }} title="Séjour à venir : renseigne la nationalité pour créer la déclaration (fiche de police, SIBA)">
                                <IdentificationCard size={11} weight="fill" /> Nationalité à renseigner
                              </span>
                            )}
                            {v.tags && v.tags.slice(0, 2).map(tg => <span key={tg} style={s.tagChip}>{tg}</span>)}
                          </div>
                        )}

                        <div style={s.tileFooter}>
                          <div style={s.tileStat}>
                            <span style={s.tileStatVal}>{v.sejours.length}</span>
                            <span style={s.tileStatLabel}>séjour{v.sejours.length !== 1 ? 's' : ''}</span>
                          </div>
                          {ca > 0 && (
                            <div style={s.tileStat}>
                              <span style={s.tileStatVal}>{ca.toLocaleString('fr-FR')} €</span>
                              <span style={s.tileStatLabel}>au total</span>
                            </div>
                          )}
                          {stay && (
                            <div style={{ ...s.tileStat, marginLeft: 'auto', alignItems: 'flex-end' as const }}>
                              <span style={{ ...s.tileStatVal, fontSize: '13px', color: stay.upcoming ? 'var(--accent-text)' : 'var(--text-2)' }}>
                                {fmtDay(stay.date)}
                              </span>
                              <span style={s.tileStatLabel}>{stay.label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Vue tableau */}
              {filtered.length > 0 && viewMode === 'table' && (
                <div style={s.tableWrap}>
                  <table style={s.tableEl}>
                    <thead>
                      <tr>
                        <th style={s.tableTh}>Voyageur</th>
                        <th style={s.tableTh}>Contact</th>
                        <th style={s.tableTh}>Prochain séjour</th>
                        <th style={s.tableThNum}>Séjours</th>
                        <th style={s.tableThNum}>Montant</th>
                        <th style={s.tableTh}>Statut</th>
                        <th style={s.tableTh} aria-label="Actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(v => {
                        const initials = `${v.prenom[0] ?? ''}${v.nom[0] ?? ''}`.toUpperCase()
                        const color = avatarColor(v.prenom + v.nom)
                        const ca = caOf(v)
                        const status = statusOf(v)
                        const stay = stayInfo(v.sejours, todayISO)
                        const noNat = missingNationality(v, todayISO)
                        return (
                          <tr key={v.id} onClick={() => router.push(`/dashboard/voyageurs/${v.id}`)} style={{ ...s.tableRow, opacity: v.bloque ? 0.65 : 1 }}>
                            <td style={s.tableTd}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ ...s.tableAvatar, background: color }}>{initials}</div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{v.prenom} {v.nom}</div>
                                  <div style={{ fontSize: 12, color: noNat ? '#B7791F' : 'var(--text-3)' }}>{v.nationalite ? (COUNTRIES.find(c => c.code === v.nationalite)?.name ?? v.nationalite) : 'Nationalité inconnue'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ ...s.tableTd, color: 'var(--text-2)' }}>
                              <div style={{ whiteSpace: 'nowrap' }}>{v.email || <span style={{ color: 'var(--text-3)' }}>pas d&apos;e-mail</span>}</div>
                              {v.telephone && <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{v.telephone}</div>}
                            </td>
                            <td style={{ ...s.tableTd, whiteSpace: 'nowrap' }}>
                              {stay ? <><span style={{ color: stay.upcoming ? 'var(--accent-text)' : 'var(--text-2)', fontWeight: 600 }}>{fmtDay(stay.date)}</span><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{stay.label}</div></> : <span style={{ color: 'var(--text-3)' }}>Aucun</span>}
                            </td>
                            <td style={s.tableTdNum}>{v.sejours.length}</td>
                            <td style={s.tableTdNum}>{ca > 0 ? `${ca.toLocaleString('fr-FR')} €` : <span style={{ color: 'var(--text-3)' }}>0 €</span>}</td>
                            <td style={s.tableTd}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {status ? <span style={{ ...s.badge, ...BADGE[status] }}>{BADGE_ICON[status]}{BADGE_LABEL[status]}</span> : <span style={{ color: 'var(--text-3)' }}>Nouveau</span>}
                                {noNat && <span style={{ ...s.badge, ...BADGE.nat }} title="Séjour à venir : renseigne la nationalité pour la déclaration"><IdentificationCard size={11} weight="fill" /> Nationalité</span>}
                              </div>
                            </td>
                            <td style={s.tableTd} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                <button onClick={e => openEdit(v, e)} style={s.actionBtn} title="Modifier" aria-label={`Modifier ${v.prenom} ${v.nom}`}>
                                  <PencilSimple size={14} />
                                </button>
                                <button onClick={e => handleDelete(v, e)} style={s.actionBtn} title="Supprimer" aria-label={`Supprimer ${v.prenom} ${v.nom}`}>
                                  <Trash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Newsletter aux voyageurs directs (Brevo) */}
      {tableReady && voyageurs.length > 0 && <NewsletterCard voyageurs={voyageurs} today={today} />}

      {/* Modal Add / Edit */}
      {modal && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>{modal === 'edit' ? 'Modifier le voyageur' : 'Nouveau voyageur'}</h3>
              <button onClick={closeModal} style={s.modalClose}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>Prénom *</label>
                  <div style={s.inputWrap} className="form-input-wrap">
                    <User size={15} color="var(--text-muted)" />
                    <input
                      className="no-ring"
                      style={s.input}
                      value={form.prenom}
                      onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                      placeholder="Jean"
                      autoFocus
                    />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Nom *</label>
                  <div style={s.inputWrap} className="form-input-wrap">
                    <User size={15} color="var(--text-muted)" />
                    <input
                      className="no-ring"
                      style={s.input}
                      value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>E-mail</label>
                <div style={s.inputWrap} className="form-input-wrap">
                  <Envelope size={15} color="var(--text-muted)" />
                  <input
                    className="no-ring"
                    style={s.input}
                    type="email"
                    value={form.email ?? ''}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jean.dupont@email.com"
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Téléphone</label>
                <div style={s.inputWrap} className="form-input-wrap">
                  <Phone size={15} color="var(--text-muted)" />
                  <input
                    className="no-ring"
                    style={s.input}
                    type="tel"
                    value={form.telephone ?? ''}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              {/* Nationalité */}
              <div style={s.field}>
                <label style={s.label}>Nationalité</label>
                <div style={{ position: 'relative', zIndex: natOpen ? 100 : 'auto' }}>
                  <button
                    type="button"
                    onClick={() => { setNatOpen(o => !o); setNatSearch('') }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '10px', fontFamily: 'inherit',
                      border: `1px solid ${natOpen ? 'var(--accent-border)' : 'var(--border)'}`,
                      background: natOpen ? 'var(--accent-bg)' : 'var(--surface)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    {form.nationalite ? (
                      <>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '20px', borderRadius: '4px', flexShrink: 0,
                          background: 'var(--accent-bg-2)', border: '1px solid var(--accent-border)',
                          fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                          color: 'var(--accent-text)', fontFamily: 'monospace',
                        }}>
                          {form.nationalite}
                        </span>
                        <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                          {COUNTRIES.find(c => c.code === form.nationalite)?.name ?? form.nationalite}
                        </span>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, nationalite: null })) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 2px', display: 'flex' }}
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', flex: 1 }}>Sélectionner un pays…</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▾</span>
                      </>
                    )}
                  </button>

                  {natOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
                      // --surface est rgba(...,0.04) en mode sombre → totalement transparent.
                      // Utilise --bg-2 qui est solide dans les deux modes pour que le dropdown
                      // ne laisse pas voir le contenu en dessous.
                      background: 'var(--bg-2)', border: '1px solid var(--border-2)',
                      borderRadius: '12px', boxShadow: '0 12px 36px rgba(0,0,0,0.45)', overflow: 'hidden',
                    }}>
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
                        <input
                          autoFocus
                          value={natSearch}
                          onChange={e => setNatSearch(e.target.value)}
                          placeholder="Rechercher un pays…"
                          style={{
                            width: '100%', padding: '6px 10px', borderRadius: '7px',
                            border: '1px solid var(--border)', background: 'var(--bg)',
                            color: 'var(--text)', fontSize: '12.5px', fontFamily: 'inherit', outline: 'none',
                            boxSizing: 'border-box' as const,
                          }}
                        />
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-2)' }}>
                        {COUNTRIES.filter(c =>
                          c.name.toLowerCase().includes(natSearch.toLowerCase()) ||
                          c.code.toLowerCase().includes(natSearch.toLowerCase())
                        ).map(c => {
                          const active = form.nationalite === c.code
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setForm(f => ({ ...f, nationalite: c.code })); setNatOpen(false); setNatSearch('') }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', border: 'none',
                                background: active ? 'var(--accent-bg)' : 'transparent',
                                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                              }}
                            >
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '20px', borderRadius: '4px', flexShrink: 0,
                                background: active ? 'var(--accent-bg-2)' : 'var(--surface-2)',
                                border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
                                fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                                color: active ? 'var(--accent-text)' : 'var(--text-muted)', fontFamily: 'monospace',
                              }}>
                                {c.code}
                              </span>
                              <span style={{ fontSize: '13px', color: active ? 'var(--accent-text)' : 'var(--text)', fontWeight: active ? 600 : 400 }}>
                                {c.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nombre de voyageurs attendus : pré-remplit directement le lien de
                  check-in (SIBA…) avec le bon nombre de fiches accompagnant, sans
                  avoir à repasser par la fiche voyageur après coup. */}
              <div style={s.field}>
                <label style={s.label}>
                  Voyageurs attendus <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(pour le lien de check-in / SIBA)</span>
                </label>
                <div style={s.inputWrap} className="form-input-wrap">
                  <Users size={15} color="var(--text-muted)" />
                  <input
                    className="no-ring"
                    style={s.input}
                    type="number"
                    min={1}
                    max={20}
                    value={form.checkin_expected_count ?? ''}
                    onChange={e => {
                      const raw = e.target.value
                      setForm(f => ({ ...f, checkin_expected_count: raw === '' ? null : Math.max(1, Math.min(20, Number(raw))) }))
                    }}
                    placeholder="Ex : 9"
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Notes privées</label>
                <textarea
                  style={{ ...s.input, ...s.textarea }}
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Préférences, informations utiles…"
                  rows={3}
                />
              </div>

              {formError && <p style={s.error}>{formError}</p>}

              {/* Phase 7, alerte si email/tel signalé par la communauté */}
              {signaleAlert && (
                <div style={{
                  padding: '14px 16px',
                  background: 'color-mix(in srgb, var(--danger) 6%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
                  borderRadius: '11px',
                  display: 'flex', flexDirection: 'column' as const, gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Warning size={18} weight="fill" color="var(--danger)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)', marginBottom: '4px' }}>
                        Voyageur signalé par d&apos;autres hôtes
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                        Cet e-mail ou ce téléphone a été signalé <strong>{signaleAlert.count} fois</strong>.
                        {signaleAlert.motifs && signaleAlert.motifs.length > 0 && (
                          <> Motifs : <strong>{signaleAlert.motifs.join(', ')}</strong>.</>
                        )} Lis les faits avant d&apos;accepter une réservation :{' '}
                        <Link href={`/dashboard/securite?q=${encodeURIComponent(form.email?.trim() || form.telephone?.trim() || '')}`} target="_blank" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>voir dans Sécurité voyageur</Link>.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSignaleAlert(null)}
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAllowDespiteSignal(true); setSignaleAlert(null); document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }}
                      style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, background: 'color-mix(in srgb, var(--danger) 10%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Ajouter quand même
                    </button>
                  </div>
                </div>
              )}

              <div style={s.formActions}>
                <button type="button" onClick={closeModal} className="btn-ghost">Annuler</button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? 'Enregistrement…' : modal === 'edit' ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}


const s: Record<string, React.CSSProperties> = {
  asideTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  todoList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  todoRow: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', margin: '0 -8px', borderRadius: 10,
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text-2)',
    textAlign: 'left', textDecoration: 'none', boxSizing: 'content-box',
  },
  todoNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: 20, minWidth: 26, lineHeight: 1 },
  asideStats: { display: 'flex', gap: 14, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)' },
  asideStatNum: { color: 'var(--text)', fontWeight: 700 },
  heroGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12,
    background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text)', fontSize: 14, fontWeight: 600, textDecoration: 'none',
  },
  waysGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 },
  way: { display: 'flex', flexDirection: 'column', gap: 6, padding: 16, borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)' },
  wayIcon: { width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  wayTitle: { fontSize: 14.5, color: 'var(--text)' },
  wayText: { fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 },
  toolsRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 71 },
  contactLines: { display: 'flex', flexDirection: 'column', gap: 4 },
  contactLine: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  missing: { fontStyle: 'normal', color: 'var(--text-3)' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 999, padding: '2px 8px',
    fontSize: 11.5, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap',
  },
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  declBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)',
    fontSize: '13.5px', fontWeight: 600, textDecoration: 'none',
  },
  declCount: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px',
    padding: '0 6px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
    background: 'color-mix(in srgb, #B7791F 30%, transparent)', color: '#B7791F',
  },
  toolbar: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '16px', flexWrap: 'wrap', marginBottom: '28px',
  },
  pageTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '4px',
  },
  pageDesc: { fontSize: '14px', fontWeight: 400, color: 'var(--text-3)', maxWidth: '640px', lineHeight: 1.6, margin: 0 },

  setupBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '12px', padding: '14px 18px',
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6,
  },

  searchWrap: {
    flex: '1 1 260px', minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--bg)', border: '1px solid var(--border-2)',
    borderRadius: '12px', padding: '10px 14px',
  },
  searchInput: {
    flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none',
    fontSize: '14px', color: 'var(--text)', fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '2px',
  },

  emptyState: {
    padding: '56px 32px', borderRadius: '18px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '12px', textAlign: 'center',
  },
  emptyTitle: { fontSize: '16px', fontWeight: 500, color: 'var(--text-2)' },
  emptyDesc: {
    fontSize: '14px', fontWeight: 300, color: 'var(--text-3)',
    maxWidth: '380px', lineHeight: 1.65,
  },

  list: {
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '16px', overflow: 'hidden',
  },

  tileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
    gap: '12px', marginTop: '14px',
  },
  tile: {
    position: 'relative' as const,
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px',
    cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
    display: 'flex', flexDirection: 'column' as const, gap: '12px', minWidth: 0,
  },
  tileActions: {
    position: 'absolute' as const, top: '10px', right: '10px',
    display: 'flex', gap: '2px',
  },
  tileHead: {
    display: 'flex', alignItems: 'center', gap: '12px',
    paddingRight: '60px', // éviter overlap avec tileActions
  },
  tileAvatar: {
    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tileAvatarText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '15px',
    fontWeight: 600, color: '#fff',
  },
  tileName: {
    display: 'block', fontSize: '15px', fontWeight: 600, color: 'var(--text)', textDecoration: 'none',
    marginBottom: '2px',
    overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
  },
  tileMeta: {
    fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.4,
    overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
  },
  tileBadges: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '5px',
  },
  tileFooter: {
    display: 'flex', alignItems: 'center', gap: '12px',
    paddingTop: '10px',
    borderTop: '1px solid var(--border)',
    marginTop: 'auto',
  },
  tileStat: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start',
    gap: '2px',
  },
  tileStatVal: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', lineHeight: 1 },
  tileStatLabel: { fontSize: '11px', color: 'var(--text-muted)' },
  row: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 18px', borderBottom: '1px solid var(--border)',
    cursor: 'pointer', transition: 'background 0.15s',
  },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '14px',
    fontWeight: 600, color: '#fff',
  },
  info: { flex: 1, minWidth: 0 },
  rowName: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '14px', fontWeight: 500, color: 'var(--text)',
    marginBottom: '3px',
  },
  flagBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)',
    border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
    borderRadius: '100px', padding: '2px 7px',
    fontSize: '11px', fontWeight: 600,
  },
  rowMeta: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', color: 'var(--text-3)', flexWrap: 'wrap',
  },
  dot: { opacity: 0.4 },
  stats: { textAlign: 'center', flexShrink: 0 },
  statVal: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' },
  rowActions: { display: 'flex', gap: '4px' },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', padding: '6px', borderRadius: '7px',
    transition: 'all 0.15s',
  },

  /* Modal */
  overlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  modalBox: {
    background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: '20px', width: '100%', maxWidth: '520px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
    animation: 'fadeIn 0.18s ease',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '18px',
    fontWeight: 400, color: 'var(--text)',
  },
  modalClose: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', padding: '4px',
  },
  form: { padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  field: { flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
  },
  input: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: '14px', color: 'var(--text)',
  },
  textarea: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
    resize: 'vertical', fontFamily: 'inherit',
    flex: 'unset', width: '100%', boxSizing: 'border-box',
  },
  error: { fontSize: '13px', color: 'var(--danger)', margin: 0 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },

  // ─── Phase 2, stats globales, filtres, vue tableau ─────────────
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginBottom: '16px',
  },
  statCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '12px',
  },
  statIcon: {
    width: '32px', height: '32px', borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  globalStatValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 500,
    color: 'var(--text)',
    lineHeight: 1.1,
  },
  globalStatLabel: {
    fontSize: '11px', fontWeight: 500,
    color: 'var(--text-muted)',
    marginTop: '2px',
  },

  filterBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '12px', flexWrap: 'wrap' as const,
    // L'animation fade-up crée un contexte d'empilement par section : sans
    // z-index ici, le popover des filtres passerait SOUS les cartes voyageurs.
    position: 'relative' as const, zIndex: 70,
  },
  filterChips: {
    display: 'flex', flexWrap: 'wrap' as const, gap: '6px',
  },
  filterChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px',
    fontSize: '12.5px', fontWeight: 500,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '100px',
    color: 'var(--text-2)',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  filterChipActive: {
    background: 'var(--accent-bg)',
    borderColor: 'var(--accent-border)',
    color: 'var(--accent-text)',
  },
  chipCount: {
    fontSize: '11px', fontWeight: 700,
    opacity: 0.7,
  },
  filterRight: {
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  filterConfigPanel: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0,
    minWidth: '240px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border-2)',
    borderRadius: '10px',
    padding: '8px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
    zIndex: 60,
    display: 'flex', flexDirection: 'column' as const, gap: '2px',
  },
  filterConfigTitle: {
    fontSize: '10.5px', fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    color: 'var(--text-muted)',
    padding: '4px 8px 6px',
  },
  filterConfigRow: {
    display: 'flex', alignItems: 'flex-start', gap: '9px',
    padding: '6px 8px',
    borderRadius: '7px',
    cursor: 'pointer',
  },
  filterConfigLabel: { display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' },
  filterConfigDesc: { display: 'block', fontSize: '11px', color: 'var(--text-muted)' },
  viewToggle: {
    display: 'inline-flex', gap: '2px',
    padding: '3px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '9px',
  },
  viewBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  viewBtnActive: {
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
  },

  // Tag chip dans la liste
  natBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: 'color-mix(in srgb, #B7791F 10%, transparent)', color: '#8A5A12',
    border: '1px solid color-mix(in srgb, #B7791F 30%, transparent)',
    borderRadius: '100px', padding: '2px 7px',
    fontSize: '11px', fontWeight: 600,
  },
  natCode: {
    display: 'inline-block', marginLeft: '7px', verticalAlign: '1px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', fontFamily: 'monospace',
    padding: '1px 5px', borderRadius: '4px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)',
  },
  tagChip: {
    display: 'inline-block',
    fontSize: '10px', fontWeight: 600,
    padding: '2px 8px',
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    borderRadius: '100px',
  },

  // Tableau
  tableWrap: {
    overflowX: 'auto' as const, marginTop: '14px',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },
  tableEl: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
  },
  tableTh: {
    padding: '12px 14px',
    textAlign: 'left' as const,
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--border-2)',
  },
  tableThNum: {
    padding: '12px 14px',
    textAlign: 'right' as const,
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
    background: 'var(--bg-2)',
    borderBottom: '1px solid var(--border-2)',
  },
  tableRow: {
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.12s',
  },
  tableTd: {
    padding: '12px 14px',
    color: 'var(--text-2)',
    fontWeight: 400,
  },
  tableTdNum: {
    padding: '12px 14px',
    textAlign: 'right' as const,
    color: 'var(--text)',
    fontWeight: 500,
  },
  tableAvatar: {
    width: '32px', height: '32px',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    color: '#fff',
    fontSize: '11px', fontWeight: 700,
    fontFamily: 'var(--font-fraunces), serif',
  },
}
