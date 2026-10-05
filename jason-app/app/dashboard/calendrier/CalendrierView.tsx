'use client'

import { useState, useMemo, useCallback, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CaretLeft, CaretRight, Plus, Trash, PencilSimple, CalendarBlank, Clock, X, MagnifyingGlass, ListBullets, Calendar as CalendarIcon, ChatText } from '@phosphor-icons/react/dist/ssr'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, updateContractChecklist, syncIcalFeed, generateIcalToken, createSejourFromCalendar, updateSejourFromCalendar, setMenageDone, deleteSejourFromCalendar } from './actions'
import SejourPopover from './SejourPopover'
import { ArrowsClockwise, Lightning, SidebarSimple, Share, Copy, Check, Warning, Broom, Funnel } from '@phosphor-icons/react/dist/ssr'
import TourTrigger from '@/components/dashboard/TourTrigger'
import { CalendarInput, TimePickerInput } from '@/components/ui/CalendarInput'
import { isBlockedIcalEvent } from '@/lib/ical/blocked'
import type { ContractEvent, IcalFeed, IcalEvent, SejourEvent, VoyageurOption, LogementOption } from './page'
import type { VoyageurOption as QuickVoyageur } from '@/app/dashboard/logements/[id]/QuickSejourModal'
import dynamic from 'next/dynamic'
import ListView from './ListView'
import SearchableCombobox from './SearchableCombobox'
import { CHECKLIST_TO_GABARIT, CalEvent, CAT, CatKey, PICKER_CATS, catToDisplay, CHECKLIST_ITEMS, DAYS_FR, MONTHS_FR, toStr, todayString, isRealReservation, parseQuickAdd, buildCalendarDays, formatDayLong, fmtDate, fmtTime, capitalize } from './calendrier-shared'
import { s } from './calendrier-styles'

// MenageExportModal contient le builder de PDF inline (HTML + CSS) → chunk
// non-critique au premier render. On le lazy-loade : il n'arrive que quand
// l'utilisateur clique sur le bouton balai. Économise ~15 KB du bundle
// initial du calendrier.
const MenageExportModal = dynamic(() => import('./MenageExportModal'), { ssr: false })
// « Compléter la réservation » d'une réservation Airbnb/Booking importée :
// même modale que Mes réservations (voyageur, nationalité, montant).
const QuickSejourModal = dynamic(() => import('@/app/dashboard/logements/[id]/QuickSejourModal'), { ssr: false })

interface Props {
  events: CalEvent[]
  contractEvents: ContractEvent[]
  icalFeeds: IcalFeed[]
  icalEvents: IcalEvent[]
  sejourEvents: SejourEvent[]
  voyageurOptions: VoyageurOption[]
  quickVoyageurs: QuickVoyageur[]
  logementOptions: LogementOption[]
  menageSlots: import('./page').MenageSlot[]
  icalToken: string | null
  hostName: string | null
  appUrl: string
}


export default function CalendrierView({
  events: initial,
  contractEvents,
  icalFeeds,
  icalEvents,
  sejourEvents: initialSejourEvents,
  voyageurOptions,
  quickVoyageurs,
  logementOptions,
  menageSlots,
  icalToken,
  hostName,
  appUrl,
}: Props) {
  const TODAY = todayString()
  const now   = new Date()
  const router = useRouter()

  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [selected, setSelected] = useState(TODAY)
  const [events,   setEvents]   = useState<CalEvent[]>(initial)
  const [sejourEvents, setSejourEvents] = useState<SejourEvent[]>(initialSejourEvents)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<CalEvent | null>(null)
  const [isPending, startT]     = useTransition()

  // Mini-popover quand on clique sur un séjour (au lieu de naviguer vers la fiche)
  const [sejourPopover, setSejourPopover] = useState<{ sejour: SejourEvent; anchor: DOMRect | null } | null>(null)
  // Réservation Airbnb/Booking à compléter (le flux ne donne que les dates)
  const [completeIcal, setCompleteIcal] = useState<NonNullable<IcalEvent['completion']> | null>(null)
  // Modal d'export ménage (PDF / WhatsApp / iCal)
  const [menageExportOpen, setMenageExportOpen] = useState(false)

  // Auto-sync iCal feeds au montage si dernière sync > 15 min (ou jamais).
  // Fire-and-forget : la page s'affiche immédiatement, refresh quand la sync est finie.
  const autoSyncTriggered = useRef(false)
  useEffect(() => {
    if (autoSyncTriggered.current) return
    autoSyncTriggered.current = true
    if (icalFeeds.length === 0) return
    const STALE_MS = 15 * 60 * 1000
    const nowTs = Date.now()
    const stale = icalFeeds.filter(f => {
      if (!f.last_synced) return true
      return nowTs - new Date(f.last_synced).getTime() > STALE_MS
    })
    if (stale.length === 0) return
    ;(async () => {
      let didSync = false
      await Promise.all(stale.map(async f => {
        const res = await syncIcalFeed(f.id)
        if (res.synced) didSync = true
      }))
      if (didSync) router.refresh()
    })()
  }, [icalFeeds, router])

  // form fields
  const [fTitle,   setFTitle]   = useState('')
  const [fStart,   setFStart]   = useState('')
  const [fEnd,     setFEnd]     = useState('')
  const [fCat,     setFCat]     = useState<CatKey>('sejour')
  const [fDesc,    setFDesc]    = useState('')
  const [fStartDate, setFStartDate] = useState('')
  const [fEndDate,   setFEndDate]   = useState('')

  // séjour-specific form fields
  const [fVoyageurId, setFVoyageurId] = useState('')
  const [fLogementId, setFLogementId] = useState('')
  const [fMontant,    setFMontant]    = useState('')
  const [sejourError, setSejourError] = useState<string | null>(null)

  // ── drag-to-create
  const dragState  = useRef<{ start: string; cur: string } | null>(null)
  const [dragRange, setDragRange] = useState<{ start: string; end: string } | null>(null)
  const [selRange,  setSelRange]  = useState<{ start: string; end: string } | null>(null)
  // Ref pour lire l'état d'édition courant depuis le mouseup (closure stable)
  const editingRef = useRef<CalEvent | null>(null)
  // Ref pour lire byDate depuis le mouseup (closure stable, sync via useEffect)
  const byDateRef = useRef<Record<string, { custom: CalEvent[]; contracts: ContractEvent[]; ical: IcalEvent[]; sejours: SejourEvent[] }>>({})

  // ── checklist state (contractId → { key: boolean })
  const [contractChecklists, setContractChecklists] = useState<Record<string, Record<string, boolean>>>(() =>
    Object.fromEntries(contractEvents.map(ev => [ev.contractId, ev.checklist_status ?? {}]))
  )
  const [selectedContract, setSelectedContract] = useState<import('./page').ContractEvent | null>(null)
  const [showSources, setShowSources] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{ ok?: string; err?: string } | null>(null)
  const [showExportPanel, setShowExportPanel] = useState(false)
  const [showSourcesPanel, setShowSourcesPanel] = useState(false)
  const [icalTokenState, setIcalTokenState] = useState<string | null>(icalToken)
  const [exportBusy, setExportBusy] = useState(false)
  const [exportCopied, setExportCopied] = useState(false)
  const exportUrl = icalTokenState ? `${appUrl}/api/calendar/feed?token=${icalTokenState}` : ''
  // ?view=list dans l'URL force la vue Liste au chargement (utilise par
  // l'entree sidebar "Mes reservations" pour ouvrir directement en mode liste).
  const searchParams = useSearchParams()
  const initialViewMode: 'month' | 'list' = searchParams?.get('view') === 'list' ? 'list' : 'month'
  // ?menage=1 (depuis la checklist de démarrage de l'accueil) : ouvre
  // directement le partage du planning ménage, sinon caché derrière l'icône balai.
  useEffect(() => {
    if (searchParams?.get('menage') === '1') setMenageExportOpen(true)
  }, [searchParams])
  const [viewMode, setViewMode] = useState<'month' | 'list'>(initialViewMode)
  const [filter, setFilter] = useState<'all' | 'sejours' | 'menages' | 'rdv-tache' | 'synchro'>('all')
  // Persistance de la légende (Airbnb/Booking masqués). Sinon chaque
  // navigation reset ce que l'hôte avait décoché, frustrant.
  const HIDDEN_LS_KEY = 'jm:cal:hidden-sources:v1'
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(() => new Set())

  // Hydrate depuis localStorage côté client uniquement (évite hydration
  // mismatch SSR : on lit après le 1er render).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_LS_KEY)
      if (!raw) return
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr)) {
        const filtered = arr.filter((v): v is string => typeof v === 'string')
        if (filtered.length > 0) setHiddenSources(new Set(filtered))
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleSource(key: string) {
    setHiddenSources(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      // Persiste tout de suite : si l'hôte navigue ensuite, on garde l'état.
      try {
        localStorage.setItem(HIDDEN_LS_KEY, JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }
  const [search, setSearch] = useState('')
  const [quickAdd, setQuickAdd] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Si la page est ouverte avec ?logement=X (depuis fiche détail), pré-remplir la recherche
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const logementParam = url.searchParams.get('logement')
    if (logementParam) {
      setSearch(logementParam)
      setFilter('sejours')
      setHiddenSources(new Set())
    }
  }, [])

  // Auto-refresh quand l'utilisateur revient sur l'onglet ou la fenêtre.
  // Effet pseudo-realtime : si un nouveau séjour iCal a été synchronisé
  // depuis Airbnb/Booking pendant que l'utilisateur était ailleurs, il
  // apparaît au focus retour sans avoir à recharger manuellement.
  // Throttle 30 s pour ne pas spammer le serveur si l'utilisateur fait
  // alt-tab rapidement entre 2 fenêtres.
  useEffect(() => {
    let lastRefresh = Date.now()
    const onFocus = () => {
      if (Date.now() - lastRefresh < 30_000) return
      lastRefresh = Date.now()
      router.refresh()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [router])

  // Mémoire du dernier mode choisi par l'utilisateur (localStorage).
  // Avant on basculait automatiquement en liste sur mobile, mais ça forçait
  // une vue non désirée à chaque ouverture du calendrier. Maintenant on respecte
  // le choix de l'utilisateur (défaut : 'month', overridable mobile via le toggle).
  useEffect(() => {
    if (typeof window === 'undefined') return
    // ?view= dans l'URL prend TOUJOURS la priorite sur le localStorage.
    // - Si Jason clique "Mes reservations" (/calendrier?view=list) depuis
    //   /calendrier (Mois) : searchParams change → viewMode passe a 'list'
    // - Si Jason clique "Calendrier" (/calendrier) depuis Mes reservations :
    //   searchParams n'a plus ?view= → on retombe sur la derniere pref
    //   localStorage (souvent 'month' pour eux).
    const urlView = searchParams?.get('view')
    if (urlView === 'list' || urlView === 'month') {
      setViewMode(urlView)
      return
    }
    try {
      const saved = window.localStorage.getItem('cal-view-mode')
      if (saved === 'month' || saved === 'list') setViewMode(saved)
    } catch {}
  }, [searchParams])

  // Persiste le choix de mode quand l'utilisateur switch
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem('cal-view-mode', viewMode) } catch {}
  }, [viewMode])

  // Drawer auto-ouverture sur actions explicites (création d'événement, sélection d'un contrat)
  useEffect(() => {
    if (showForm || selectedContract) setDrawerOpen(true)
  }, [showForm, selectedContract])

  // Garde editingRef à jour pour le mouseup handler (closure stable)
  useEffect(() => { editingRef.current = editing }, [editing])

  // ── calendar cells
  const cells = useMemo(() => buildCalendarDays(year, month), [year, month])

  // ── group into week rows
  const weeks = useMemo(() => {
    const rows = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cells])

  // ── multi-day spans per week row (custom events + iCal events)
  type SpanItem = {
    id: string
    title: string
    color: string
    bg: string
    startCol: number
    endCol: number
    isStart: boolean
    isEnd: boolean
    isIcal: boolean
    isBlocked?: boolean
    platformLabel?: string
    onClick: (e?: React.MouseEvent) => void
  }
  function computeSpans(weekCells: typeof cells): SpanItem[] {
    const ws = weekCells[0].date
    const we = weekCells[6].date
    const out: SpanItem[] = []
    const seen = new Set<string>()

    filteredEvents
      .filter(e => e.end_date && e.end_date !== e.date && e.date <= we && e.end_date >= ws)
      .forEach(e => {
        if (seen.has(e.id)) return
        seen.add(e.id)
        const ss = e.date >= ws ? e.date : ws
        const se = e.end_date! <= we ? e.end_date! : we
        const cat = CAT[e.category] ?? CAT.note
        out.push({
          id: e.id,
          title: e.title,
          color: cat.color,
          bg: cat.bg,
          startCol: weekCells.findIndex(c => c.date === ss),
          endCol:   weekCells.findIndex(c => c.date === se),
          isStart:  e.date >= ws,
          isEnd:    e.end_date! <= we,
          isIcal:   false,
          onClick:  () => {
            setSelected(e.date)
            setYear(Number(e.date.slice(0,4)))
            setMonth(Number(e.date.slice(5,7))-1)
            setShowForm(false)
            setSelectedContract(null)
            setDrawerOpen(true)
          },
        })
      })

    filteredIcalEvents
      .filter(e => e.end_date && e.end_date !== e.start_date && e.start_date <= we && e.end_date >= ws)
      .forEach(e => {
        if (seen.has(`ical-${e.id}`)) return
        seen.add(`ical-${e.id}`)
        const ss = e.start_date >= ws ? e.start_date : ws
        const se = e.end_date! <= we ? e.end_date! : we
        const platformLabel = e.platform_label ?? 'Synchro'
        const blocked = isBlockedIcalEvent(e.title, e.description)
        out.push({
          id: `ical-${e.id}`,
          title: blocked ? `Bloqué (${platformLabel})` : e.title,
          color: blocked ? 'var(--text-3)' : e.feed_color,
          bg:    blocked ? 'var(--bg-2)' : `${e.feed_color}22`,
          startCol: weekCells.findIndex(c => c.date === ss),
          endCol:   weekCells.findIndex(c => c.date === se),
          isStart:  e.start_date >= ws,
          isEnd:    e.end_date! <= we,
          isIcal:   true,
          isBlocked: blocked,
          platformLabel,
          onClick:  () => {
            setSelected(e.start_date)
            setYear(Number(e.start_date.slice(0,4)))
            setMonth(Number(e.start_date.slice(5,7))-1)
            setShowForm(false)
            setSelectedContract(null)
            setDrawerOpen(true)
          },
        })
      })

    // Séjours contrats : barre continue de l'arrivée jusqu'au départ
    const seenContracts = new Set<string>()
    filteredContractEvents
      .filter(c => c.date_arrivee && c.date_depart && c.date_arrivee !== c.date_depart)
      .filter(c => c.date_arrivee <= we && c.date_depart! >= ws)
      .forEach(c => {
        if (seenContracts.has(c.contractId)) return
        seenContracts.add(c.contractId)
        const ss = c.date_arrivee >= ws ? c.date_arrivee : ws
        const se = c.date_depart! <= we ? c.date_depart! : we
        const arrCat = CAT.arrivee
        out.push({
          id: `contract-${c.contractId}`,
          title: c.logement_nom ?? 'Séjour',
          color: arrCat.color,
          bg:    arrCat.bg,
          startCol: weekCells.findIndex(c2 => c2.date === ss),
          endCol:   weekCells.findIndex(c2 => c2.date === se),
          isStart:  c.date_arrivee >= ws,
          isEnd:    c.date_depart! <= we,
          isIcal:   false,
          onClick:  () => {
            setSelected(c.date_arrivee)
            setYear(Number(c.date_arrivee.slice(0, 4)))
            setMonth(Number(c.date_arrivee.slice(5, 7)) - 1)
            setShowForm(false)
            const arrEv = contractEvents.find(e => e.contractId === c.contractId && e.type === 'arrivee')
            if (arrEv) setSelectedContract(arrEv)
            setDrawerOpen(true)
          },
        })
      })

    // Séjours sans contrat (créés depuis le calendrier ou sans contrat encore)
    filteredSejourEvents
      .filter(s => s.date_arrivee && s.date_depart)
      .filter(s => s.date_arrivee <= we && s.date_depart >= ws)
      .forEach(s => {
        const ss = s.date_arrivee >= ws ? s.date_arrivee : ws
        const se = s.date_depart <= we ? s.date_depart : we
        const cfg = CAT.sejour
        out.push({
          id: `sejour-${s.id}`,
          title: `${s.voyageur_label} · ${s.logement_label}`,
          color: cfg.color,
          bg:    cfg.bg,
          startCol: weekCells.findIndex(c2 => c2.date === ss),
          endCol:   weekCells.findIndex(c2 => c2.date === se),
          isStart:  s.date_arrivee >= ws,
          isEnd:    s.date_depart <= we,
          isIcal:   false,
          onClick:  (e?: React.MouseEvent) => {
            // Ouvre un mini-popover au lieu de naviguer vers la fiche voyageur.
            // Une bannière de séjour multi-semaines peut s'étendre sur 100+ %
            // de la grille → getBoundingClientRect() renvoie un rect énorme qui
            // déclenche les clamps de position et le popover sort à l'autre
            // bout. On crée un mini-rect AUTOUR du point de clic (clientX/Y)
            // pour qu'il s'ancre exactement où l'utilisateur a tapé.
            let rect: DOMRect | null = null
            if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
              const x = e.clientX
              const y = e.clientY
              rect = {
                left: x, top: y, right: x + 1, bottom: y + 1,
                width: 1, height: 1, x, y,
                toJSON: () => ({}),
              } as DOMRect
            } else {
              const target = e?.currentTarget as HTMLElement | undefined
              rect = target?.getBoundingClientRect?.() ?? null
            }
            setSejourPopover({ sejour: s, anchor: rect })
          },
        })
      })

    return out
  }

  // ── search + filter helpers
  const q = search.trim().toLowerCase()
  const matchesSearch = useCallback((...texts: (string | null | undefined)[]) => {
    if (!q) return true
    return texts.some(t => (t ?? '').toLowerCase().includes(q))
  }, [q])

  const filteredEvents = useMemo(() => events.filter(e => {
    const cat = catToDisplay(e.category)
    if (filter === 'sejours' || filter === 'synchro') return false
    if (filter === 'menages' && cat !== 'menage') return false
    if (filter === 'rdv-tache' && cat !== 'rdv' && cat !== 'tache' && cat !== 'note') return false
    if (q && !matchesSearch(e.title, e.description)) return false
    return true
  }), [events, filter, q, matchesSearch])

  const filteredContractEvents = useMemo(() => contractEvents.filter(c => {
    if (filter === 'menages' || filter === 'rdv-tache' || filter === 'synchro') return false
    if (hiddenSources.has('internal')) return false
    if (q && !matchesSearch(c.title, c.logement_nom)) return false
    return true
  }), [contractEvents, filter, q, matchesSearch, hiddenSources])

  const filteredIcalEvents = useMemo(() => icalEvents.filter(e => {
    if (filter === 'menages' || filter === 'rdv-tache') return false
    if (hiddenSources.has(e.feed_color)) return false
    if (q && !matchesSearch(e.title, e.description)) return false
    // Filtre les blocages auto "Not available" / "Closed" / "Blocked"
    // que Airbnb/Booking génèrent automatiquement chaque jour pour
    // empêcher les réservations same-day. Du bruit pur sans valeur info.
    // Les vraies réservations (avec description "Reservation URL" ou "CN=")
    // continuent à s'afficher normalement.
    if (!isRealReservation(e)) return false
    return true
  }), [icalEvents, filter, q, matchesSearch, hiddenSources])

  const filteredSejourEvents = useMemo(() => sejourEvents.filter(s => {
    if (filter === 'menages' || filter === 'rdv-tache' || filter === 'synchro') return false
    if (hiddenSources.has('internal')) return false
    if (q && !matchesSearch(s.voyageur_label, s.logement_label)) return false
    return true
  }), [sejourEvents, filter, q, matchesSearch, hiddenSources])

  // ── event index by date, multi-day events are indexed for every day they span
  const byDate = useMemo(() => {
    const m: Record<string, { custom: CalEvent[]; contracts: ContractEvent[]; ical: IcalEvent[]; sejours: SejourEvent[] }> = {}

    filteredEvents.forEach(e => {
      const startD = e.date
      const endD   = e.end_date ?? e.date
      const [sy, sm, sd] = startD.split('-').map(Number)
      const [ey, em, ed] = endD.split('-').map(Number)
      const cur    = new Date(sy, sm - 1, sd)
      const endDt  = new Date(ey, em - 1, ed)
      while (cur <= endDt) {
        const ds = toStr(cur.getFullYear(), cur.getMonth(), cur.getDate())
        ;(m[ds] ??= { custom: [], contracts: [], ical: [], sejours: [] }).custom.push(e)
        cur.setDate(cur.getDate() + 1)
      }
    })

    filteredContractEvents.forEach(c => {
      ;(m[c.date] ??= { custom: [], contracts: [], ical: [], sejours: [] }).contracts.push(c)
    })

    filteredIcalEvents.forEach(e => {
      const startD = e.start_date
      const endD   = e.end_date ?? e.start_date
      const [sy, sm, sd] = startD.split('-').map(Number)
      const [ey, em, ed] = endD.split('-').map(Number)
      const cur    = new Date(sy, sm - 1, sd)
      const endDt  = new Date(ey, em - 1, ed)
      while (cur <= endDt) {
        const ds = toStr(cur.getFullYear(), cur.getMonth(), cur.getDate())
        ;(m[ds] ??= { custom: [], contracts: [], ical: [], sejours: [] }).ical.push(e)
        cur.setDate(cur.getDate() + 1)
      }
    })

    filteredSejourEvents.forEach(s => {
      const [sy, sm, sd] = s.date_arrivee.split('-').map(Number)
      const [ey, em, ed] = s.date_depart.split('-').map(Number)
      const cur    = new Date(sy, sm - 1, sd)
      const endDt  = new Date(ey, em - 1, ed)
      while (cur <= endDt) {
        const ds = toStr(cur.getFullYear(), cur.getMonth(), cur.getDate())
        ;(m[ds] ??= { custom: [], contracts: [], ical: [], sejours: [] }).sejours.push(s)
        cur.setDate(cur.getDate() + 1)
      }
    })

    return m
  }, [filteredEvents, filteredContractEvents, filteredIcalEvents, filteredSejourEvents])

  // Sync byDateRef pour le mouseup handler (sait si la date cliquée est vide ou pleine)
  useEffect(() => { byDateRef.current = byDate }, [byDate])

  // ── selected day merged events (deduplicated by id)
  type Merged = CalEvent & { isContract?: boolean; isIcal?: boolean; isSejour?: boolean; feedColor?: string; feedName?: string; voyageurId?: string; completion?: IcalEvent['completion']; linked?: boolean }
  const selectedAll = useMemo(() => {
    const day  = byDate[selected] ?? { custom: [], contracts: [], ical: [], sejours: [] }
    const seen = new Set<string>()
    const list: Merged[] = []

    day.contracts.forEach(c => {
      if (!seen.has(c.id)) {
        seen.add(c.id)
        list.push({
          id: c.id, title: c.title, date: c.date, end_date: null,
          start_time: null, end_time: null,
          description: c.logement_nom,
          category: c.type,
          isContract: true,
        })
      }
    })

    day.sejours.forEach(s => {
      const key = `sejour-${s.id}`
      if (!seen.has(key)) {
        seen.add(key)
        list.push({
          id: key,
          title: `${s.voyageur_label} · ${s.logement_label}`,
          date: s.date_arrivee,
          end_date: s.date_depart,
          start_time: null,
          end_time: null,
          description: s.montant ? `${s.montant} €` : null,
          category: 'sejour',
          isSejour: true,
          voyageurId: s.voyageur_id ?? undefined,
        })
      }
    })

    day.custom.forEach(e => {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        list.push(e)
      }
    })

    day.ical.forEach(e => {
      const key = `ical-${e.id}`
      if (!seen.has(key)) {
        seen.add(key)
        const feed = icalFeeds.find(f => f.id === e.feed_id)
        list.push({
          id: key,
          title: e.title,
          date: e.start_date,
          end_date: e.end_date,
          start_time: e.start_time,
          end_time: e.end_time,
          description: e.description,
          category: 'ical',
          isIcal: true,
          feedColor: e.feed_color,
          feedName: feed?.name,
          completion: e.completion ?? null,
          linked: e.linked,
        })
      }
    })

    return list.sort((a, b) =>
      (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
    )
  }, [byDate, selected, icalFeeds])

  // ── header mini-stats : aujourd'hui / cette semaine / ce mois
  const headerStats = useMemo(() => {
    const today = todayString()
    function diff(from: string, to: string) {
      return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
    }
    // bornes "cette semaine" (lundi → dimanche)
    const t = new Date()
    const dow = (t.getDay() + 6) % 7 // 0 = lundi
    const monday = new Date(t.getFullYear(), t.getMonth(), t.getDate() - dow)
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
    const weekStart = toStr(monday.getFullYear(), monday.getMonth(), monday.getDate())
    const weekEnd   = toStr(sunday.getFullYear(), sunday.getMonth(), sunday.getDate())
    const monthStart = toStr(year, month, 1)
    const monthEnd   = toStr(year, month, new Date(year, month + 1, 0).getDate())

    const seenIds = new Set<string>()
    let activeToday = 0, arrToday = 0, depToday = 0
    let arrWeek = 0, depWeek = 0
    let monthEvents = 0

    contractEvents.forEach(c => {
      if (seenIds.has(c.contractId)) return
      seenIds.add(c.contractId)
      const a = c.date_arrivee
      const d = c.date_depart
      // séjour en cours aujourd'hui
      if (a && (a <= today) && (!d || d >= today)) activeToday++
      if (a === today) arrToday++
      if (d === today) depToday++
      if (a >= weekStart && a <= weekEnd) arrWeek++
      if (d && d >= weekStart && d <= weekEnd) depWeek++
      // évts du mois courant : arrivée OU départ tombant dans le mois
      if ((a >= monthStart && a <= monthEnd) || (d && d >= monthStart && d <= monthEnd)) monthEvents++
    })

    // Ménages de la semaine : le planning (départs Airbnb/Booking/directs +
    // ménages saisis à la main, déjà fusionnés), pas seulement les saisies
    const menageWeek = menageSlots.filter(sl => sl.date >= weekStart && sl.date <= weekEnd).length
    let customMonth = 0
    events.forEach(e => {
      if (e.date >= monthStart && e.date <= monthEnd) customMonth++
    })

    // Taux d'occupation : nombre de jours du mois où il y a au moins 1 séjour (contracts + iCal)
    const monthDays = new Date(year, month + 1, 0).getDate()
    const occupiedDays = new Set<string>()
    function expandRange(s: string, e: string | null) {
      const endD = e ?? s
      const [sy, sm, sd] = s.split('-').map(Number)
      const [ey, em, ed] = endD.split('-').map(Number)
      const cur = new Date(sy, sm - 1, sd)
      const endDt = new Date(ey, em - 1, ed)
      while (cur <= endDt) {
        const ds = toStr(cur.getFullYear(), cur.getMonth(), cur.getDate())
        if (ds >= monthStart && ds <= monthEnd) occupiedDays.add(ds)
        cur.setDate(cur.getDate() + 1)
      }
    }
    contractEvents.forEach(c => {
      if (c.type === 'arrivee') expandRange(c.date_arrivee, c.date_depart)
    })
    icalEvents.forEach(e => {
      // Exclure les dates manuellement fermées (pas de vraie réservation)
      if (isBlockedIcalEvent(e.title, e.description)) return
      expandRange(e.start_date, e.end_date)
    })
    sejourEvents.forEach(s => expandRange(s.date_arrivee, s.date_depart))
    const occupationPct = Math.round((occupiedDays.size / monthDays) * 100)

    return {
      activeToday, arrToday, depToday,
      arrWeek, depWeek, menageWeek,
      monthEvents: monthEvents + customMonth,
      occupationPct, occupiedDays: occupiedDays.size, monthDays,
    }
  }, [contractEvents, events, icalEvents, sejourEvents, menageSlots, year, month])

  // ── Prochain événement à venir
  const nextUpcoming = useMemo(() => {
    const today = todayString()
    type Up = { date: string; title: string; sub: string; color: string; daysAway: number; contract?: import('./page').ContractEvent }
    const list: Up[] = []
    function diff(from: string, to: string) {
      return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
    }
    const seen = new Set<string>()
    contractEvents.forEach(c => {
      if (c.date < today) return
      const key = `${c.contractId}-${c.type}`
      if (seen.has(key)) return
      seen.add(key)
      const cat = CAT[c.type] ?? CAT.note
      list.push({
        date: c.date,
        title: c.logement_nom ?? c.title,
        sub: c.type === 'arrivee' ? 'Arrivée' : 'Départ',
        color: cat.color,
        daysAway: diff(today, c.date),
        contract: c,
      })
    })
    icalEvents.forEach(e => {
      if (e.start_date < today) return
      // Ignore les blocages "Not available" sans résa réelle : Airbnb/Booking
      // bloquent automatiquement la journée en cours pour empêcher les
      // réservations same-day, ça polluait le badge "Prochain" en permanence.
      if (!isRealReservation(e)) return
      list.push({
        date: e.start_date,
        title: e.title,
        sub: 'Synchro',
        color: e.feed_color,
        daysAway: diff(today, e.start_date),
      })
    })
    list.sort((a, b) => a.date.localeCompare(b.date))
    return list[0] ?? null
  }, [contractEvents, icalEvents])

  // ── Legend sources (derived from icalEvents feed colors)
  const legendSources = useMemo(() => {
    const seen = new Map<string, string>()
    icalEvents.forEach(e => {
      if (!seen.has(e.feed_color)) {
        const label = e.platform_label ?? 'Synchro'
        seen.set(e.feed_color, label)
      }
    })
    return Array.from(seen.entries()).map(([color, label]) => ({ color, label }))
  }, [icalEvents])

  // Couleurs de la marque, en hexadécimal (suffixées d'une opacité ailleurs)
  const LOGEMENT_COLORS = ['#2F9E5B','#B7791F','#E0475B','#8B6D5E','#D97706','#F472B6']
  const logements = useMemo(() => {
    const seen = new Set<string>()
    return contractEvents
      .filter(c => c.logement_nom)
      .map(c => c.logement_nom!)
      .filter(n => { if (seen.has(n)) return false; seen.add(n); return true })
  }, [contractEvents])

  // ── smart alerts (computed from contract dates + checklist state)
  const smartAlerts = useMemo(() => {
    const alerts: Record<string, Array<{ color: string; label: string }>> = {}
    const today = todayString()
    function add(date: string, color: string, label: string) {
      ;(alerts[date] ??= []).push({ color, label })
    }
    function diff(from: string, to: string) {
      return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
    }
    const seen = new Set<string>()
    contractEvents.forEach(ev => {
      if (seen.has(ev.contractId)) return
      seen.add(ev.contractId)
      const cl = contractChecklists[ev.contractId] ?? {}
      const arr = ev.date_arrivee, dep = ev.date_depart
      const dta = diff(today, arr)
      if (dta >= 0 && dta <= 7 && !cl.contrat_signe)        add(arr, 'var(--danger)', 'Contrat non signé')
      if (dta >= 0 && dta <= 3 && !cl.solde_recu)            add(arr, '#f97316', 'Solde non reçu')
      if (dta >= 0 && dta <= 2 && !cl.instructions_envoyees) add(arr, '#eab308', 'Instructions non envoyées')
      if (dep) {
        const dtd = diff(dep, today)
        if (dtd >= 1 && dtd <= 3 && !cl.avis_demande)        add(dep, '#8B6D5E', 'Avis non demandé')
        if (dta >= -1 && dta <= 0 && !cl.menage_planifie)    add(dep, '#64748b', 'Ménage non planifié')
      }
    })
    return alerts
  }, [contractEvents, contractChecklists])

  // ── urgent alerts (flat list for the "À traiter" dashboard section)
  const urgentAlerts = useMemo(() => {
    const today = todayString()
    function diff(from: string, to: string) {
      return Math.round((new Date(to + 'T12:00').getTime() - new Date(from + 'T12:00').getTime()) / 86400000)
    }
    type Item = {
      color: string; label: string; logement: string; daysInfo: string;
      navigateDate: string; contractRef: import('./page').ContractEvent;
      contractId: string; checklistKey: string; priority: 0 | 1 | 2 | 3;
    }
    const items: Item[] = []
    const seen = new Set<string>()
    contractEvents.forEach(ev => {
      if (seen.has(ev.contractId)) return
      seen.add(ev.contractId)
      const cl   = contractChecklists[ev.contractId] ?? {}
      const nom  = ev.logement_nom ?? 'Logement'
      const arr  = ev.date_arrivee, dep = ev.date_depart
      const dta  = diff(today, arr)
      const arrRef = contractEvents.find(e => e.contractId === ev.contractId && e.type === 'arrivee') ?? ev
      const depRef = dep ? (contractEvents.find(e => e.contractId === ev.contractId && e.type === 'depart') ?? ev) : ev
      function arrInfo(d: number) { return d === 0 ? "Arrivée aujourd'hui" : d === 1 ? 'Arrivée demain' : `Arrivée J-${d}` }
      if (dta >= 0 && dta <= 7 && !cl.contrat_signe)        items.push({ color: 'var(--danger)', priority: 0, label: 'Contrat non signé',       logement: nom, daysInfo: arrInfo(dta), navigateDate: arr, contractRef: arrRef, contractId: ev.contractId, checklistKey: 'contrat_signe' })
      if (dta >= 0 && dta <= 3 && !cl.solde_recu)            items.push({ color: '#f97316', priority: 1, label: 'Solde non reçu',           logement: nom, daysInfo: arrInfo(dta), navigateDate: arr, contractRef: arrRef, contractId: ev.contractId, checklistKey: 'solde_recu' })
      if (dta >= 0 && dta <= 2 && !cl.instructions_envoyees) items.push({ color: '#eab308', priority: 2, label: 'Instructions non envoyées', logement: nom, daysInfo: arrInfo(dta), navigateDate: arr, contractRef: arrRef, contractId: ev.contractId, checklistKey: 'instructions_envoyees' })
      if (dep) {
        const dtd = diff(dep, today)
        const di  = dtd === 1 ? 'Départ hier' : `Départ il y a ${dtd}j`
        if (dtd >= 1 && dtd <= 3 && !cl.avis_demande) items.push({ color: '#8B6D5E', priority: 3, label: 'Avis non demandé', logement: nom, daysInfo: di, navigateDate: dep, contractRef: depRef, contractId: ev.contractId, checklistKey: 'avis_demande' })
      }
    })
    return items.sort((a, b) => a.priority - b.priority)
  }, [contractEvents, contractChecklists])

  // ── month nav
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  function goToday() {
    const t = new Date()
    setYear(t.getFullYear()); setMonth(t.getMonth()); setSelected(TODAY)
  }

  // ── form helpers
  function resetSejourFields() {
    setFVoyageurId('')
    setFLogementId('')
    setFMontant('')
    setSejourError(null)
  }

  function openAdd(endDate?: string) {
    // Reset défensif : on annule tout drag pendant et toute sélection contrat
    // pour garantir que le formulaire s'affiche bien dans le drawer.
    dragState.current = null
    setDragRange(null)
    setSelRange(null)
    setSelectedContract(null)
    setEditing(null)
    setFTitle(''); setFStart(''); setFEnd('')
    setFCat('sejour'); setFDesc('')
    setFStartDate(selected)
    setFEndDate(endDate ?? selected)
    resetSejourFields()
    setShowForm(true)
    // Forcer l'ouverture du drawer même si showForm était déjà true
    // (le useEffect ne se déclencherait pas dans ce cas).
    setDrawerOpen(true)
  }
  // Document-level mouseup :
  // - click sur une bar → rien (le onClick de la bar gère l'affichage)
  // - click simple sur cellule vide → sélectionne ET ouvre le form (priorité séjour)
  // - click simple sur cellule pleine → sélectionne ET affiche la liste des events
  //   (l'utilisateur clique sur "+" du panneau s'il veut créer)
  // - drag multi-jours → ouvre le formulaire pré-rempli avec la plage
  useEffect(() => {
    function onUp(e: MouseEvent) {
      if (!dragState.current) return
      const { start, cur } = dragState.current
      dragState.current = null
      setDragRange(null)
      const target = e.target as HTMLElement | null
      // Annule si mouseup hors de la grille (clic sur bouton topbar, etc.)
      if (!target?.closest('.cal-cell')) return
      // Si le clic est sur une bar d'événement, laisser son onClick gérer
      if (target.closest('[data-bar]')) return
      if (start === cur) {
        // Clic simple : sélectionne la date et ouvre le panneau
        setSelected(start)
        setSelRange(null)
        if (!editingRef.current) {
          setSelectedContract(null)
          // Date vide → ouvre le formulaire de création (séjour par défaut).
          // Date pleine → affiche juste la liste des events du jour.
          const day = byDateRef.current[start]
          const dayHasContent = !!day && (
            day.sejours.length > 0 ||
            day.contracts.length > 0 ||
            day.ical.length > 0 ||
            day.custom.length > 0
          )
          if (dayHasContent) {
            setShowForm(false)
            setEditing(null)
            setDrawerOpen(true)
          } else {
            setEditing(null); setFTitle(''); setFStart(''); setFEnd('')
            setFCat('sejour'); setFDesc('')
            resetSejourFields()
            setFStartDate(start); setFEndDate(start)
            setShowForm(true)
            setDrawerOpen(true)
          }
        }
        return
      }
      // Drag multi-jours → persister la plage visuellement ET ouvrir le form
      const [s, e2] = start <= cur ? [start, cur] : [cur, start]
      setSelected(s)
      setSelRange({ start: s, end: e2 })
      setYear(Number(s.slice(0, 4)))
      setMonth(Number(s.slice(5, 7)) - 1)
      setSelectedContract(null)
      setEditing(null); setFTitle(''); setFStart(''); setFEnd('')
      setFCat('sejour'); setFDesc('')
      resetSejourFields()
      setFStartDate(s); setFEndDate(e2)
      setShowForm(true)
      setDrawerOpen(true)
    }
    document.addEventListener('mouseup', onUp)
    return () => document.removeEventListener('mouseup', onUp)
  }, [])

  function handleChecklistToggle(contractId: string, key: string) {
    const current = contractChecklists[contractId] ?? {}
    const newVal  = !current[key]
    setContractChecklists(prev => ({ ...prev, [contractId]: { ...current, [key]: newVal } }))
    startT(async () => { await updateContractChecklist(contractId, key, newVal) })
  }

  function handlePhaseToggle(contractId: string, phase: 'avant' | 'pendant' | 'apres', checkAll: boolean) {
    const items = CHECKLIST_ITEMS.filter(i => i.phase === phase)
    const current = contractChecklists[contractId] ?? {}
    const updated = { ...current }
    items.forEach(i => { updated[i.key] = checkAll })
    setContractChecklists(prev => ({ ...prev, [contractId]: updated }))
    startT(async () => {
      for (const item of items) await updateContractChecklist(contractId, item.key, checkAll)
    })
  }

  function openEdit(ev: CalEvent) {
    setEditing(ev)
    setFTitle(ev.title)
    setFStart(ev.start_time ?? '')
    setFEnd(ev.end_time ?? '')
    setFCat(catToDisplay(ev.category))
    setFDesc(ev.description ?? '')
    setFStartDate(ev.date)
    setFEndDate(ev.end_date ?? ev.date)
    // Si on édite un séjour : pré-remplir le montant depuis le séjour réel
    if (ev.id.startsWith('sejour-')) {
      const realId = ev.id.slice('sejour-'.length)
      const sj = sejourEvents.find(s => s.id === realId)
      setFMontant(sj?.montant != null ? String(sj.montant) : '')
    } else {
      setFMontant('')
    }
    setShowForm(true)
  }
  function cancelForm() {
    setShowForm(false); setEditing(null); setSelRange(null)
    resetSejourFields()
  }

  function handleQuickAdd() {
    const parsed = parseQuickAdd(quickAdd, selected)
    if (!parsed) return
    startT(async () => {
      const res = await createCalendarEvent({
        title:      parsed.title,
        date:       parsed.date,
        end_date:   null,
        start_time: parsed.start_time,
        end_time:   null,
        category:   parsed.category,
        description: null,
      })
      if (!res.error && res.event) {
        setEvents(prev => [...prev, res.event as CalEvent])
        setQuickAdd('')
        // Naviguer vers la date pour confirmer visuellement
        setSelected(parsed.date)
        setYear(Number(parsed.date.slice(0, 4)))
        setMonth(Number(parsed.date.slice(5, 7)) - 1)
      }
    })
  }

  function handleSave() {
    // Édition d'un séjour : table sejours, pas calendar_events. L'id du
    // CalEvent est préfixé 'sejour-' (cf. id `sejour-${s.id}` lors du build).
    if (editing && editing.id.startsWith('sejour-')) {
      const realId = editing.id.slice('sejour-'.length)
      const startD = fStartDate || editing.date
      const endD   = fEndDate || startD
      if (endD < startD) {
        setSejourError('La date de départ doit être après la date d\'arrivée.')
        return
      }
      const montantNum = fMontant.trim() ? Number(fMontant.replace(',', '.')) : null
      const montantFinal = montantNum && !Number.isNaN(montantNum) ? montantNum : null
      setSejourError(null)
      startT(async () => {
        const res = await updateSejourFromCalendar({
          id: realId,
          date_arrivee: startD,
          date_depart: endD,
          montant: montantFinal,
        })
        if (res.error || !res.sejour) {
          setSejourError(res.error ?? 'Impossible de modifier le séjour.')
          return
        }
        setSejourEvents(prev => prev.map(s => s.id === realId ? {
          ...s,
          date_arrivee: res.sejour.date_arrivee,
          date_depart: res.sejour.date_depart,
          montant: res.sejour.montant,
        } : s))
        setShowForm(false); setEditing(null); setSelRange(null)
        resetSejourFields()
      })
      return
    }

    // Cas séjour : flow dédié (table sejours, pas calendar_events)
    if (fCat === 'sejour' && !editing) {
      if (!fLogementId) {
        setSejourError('Choisis un logement.')
        return
      }
      const startD = fStartDate || selected
      const endD   = fEndDate || startD
      if (endD < startD) {
        setSejourError('La date de départ doit être après la date d\'arrivée.')
        return
      }
      const logement = logementOptions.find(l => l.id === fLogementId)
      const montantNum = fMontant.trim() ? Number(fMontant.replace(',', '.')) : null
      setSejourError(null)
      startT(async () => {
        const res = await createSejourFromCalendar({
          voyageur_id: fVoyageurId || null,
          logement_id: fLogementId,
          logement_nom: logement?.nom ?? 'Logement',
          date_arrivee: startD,
          date_depart: endD,
          montant: montantNum && !Number.isNaN(montantNum) ? montantNum : null,
          contrat_statut: 'nouveau',
        })
        if (res.error || !res.sejour) {
          setSejourError(res.error ?? 'Impossible de créer le séjour.')
          return
        }
        setSejourEvents(prev => [...prev, res.sejour])
        setShowForm(false); setEditing(null); setSelRange(null)
        resetSejourFields()
      })
      return
    }

    if (!fTitle.trim()) return
    startT(async () => {
      if (editing) {
        const res = await updateCalendarEvent(editing.id, {
          title:      fTitle.trim(),
          end_date:   fEndDate && fEndDate !== editing.date ? fEndDate : null,
          start_time: fStart || null,
          end_time:   fEnd   || null,
          category:   fCat,
          description: fDesc.trim() || null,
        })
        if (!res.error && res.event) {
          setEvents(prev => prev.map(e => e.id === editing.id ? (res.event as CalEvent) : e))
        }
      } else {
        const res = await createCalendarEvent({
          title:      fTitle.trim(),
          date:       fStartDate || selected,
          end_date:   fEndDate && fEndDate !== (fStartDate || selected) ? fEndDate : null,
          start_time: fStart || null,
          end_time:   fEnd   || null,
          category:   fCat,
          description: fDesc.trim() || null,
        })
        if (!res.error && res.event) {
          setEvents(prev => [...prev, res.event as CalEvent])
        }
      }
      setShowForm(false); setEditing(null); setSelRange(null)
    })
  }

  function handleDelete(id: string) {
    startT(async () => {
      const res = await deleteCalendarEvent(id)
      if (!res.error) setEvents(prev => prev.filter(e => e.id !== id))
    })
  }

  // ── render
  return (
    <div className="cal-root" style={s.root}>
      {/* En-tête (DA sept. 2026) : bandeau vert compact, chiffres toujours
          visibles (avant : une pastille « Occupation » et un bouton « Détails »). */}
      <section style={hb.band} className="fade-up">
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={hb.eyebrow}><CalendarBlank size={14} weight="fill" /> Calendrier</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={hb.title}>Ton <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>calendrier</em></h1>
            <TourTrigger />
          </div>
          <p style={hb.desc}>Airbnb, Booking, réservations directes, ménages et rendez-vous sur une seule vue.</p>
        </div>
        <div style={hb.stats} className="cal-band-stats">
          <div style={hb.stat}>
            <span style={hb.statNum}>{headerStats.arrToday}<span style={hb.statSep}>/</span>{headerStats.depToday}</span>
            <span style={hb.statLbl}>arrivées / départs aujourd&apos;hui</span>
          </div>
          <div style={hb.stat}>
            <span style={hb.statNum}>{headerStats.activeToday}</span>
            <span style={hb.statLbl}>séjour{headerStats.activeToday > 1 ? 's' : ''} en cours</span>
          </div>
          <div style={hb.stat}>
            <span style={hb.statNum}>{headerStats.menageWeek}</span>
            <span style={hb.statLbl}>ménage{headerStats.menageWeek > 1 ? 's' : ''} cette semaine</span>
          </div>
          <div style={hb.stat}>
            <span style={{ ...hb.statNum, color: headerStats.occupationPct >= 40 ? 'var(--accent-text)' : 'var(--text)' }}>{headerStats.occupationPct} %</span>
            <span style={hb.statLbl}>occupation {MONTHS_FR[month].toLowerCase()} ({headerStats.occupiedDays}/{headerStats.monthDays} j)</span>
          </div>
          {nextUpcoming && nextUpcoming.daysAway >= 0 && nextUpcoming.daysAway <= 30 && (
            <button
              type="button"
              onClick={() => {
                const d = nextUpcoming.date
                setSelected(d); setYear(Number(d.slice(0, 4))); setMonth(Number(d.slice(5, 7)) - 1)
                if (nextUpcoming.contract) setSelectedContract(nextUpcoming.contract)
              }}
              style={{ ...hb.stat, ...hb.statBtn }}
              title="Voir cet événement"
            >
              <span style={{ ...hb.statNum, fontSize: 16, color: 'var(--accent-text)' }}>
                {nextUpcoming.daysAway === 0 ? "aujourd'hui" : nextUpcoming.daysAway === 1 ? 'demain' : `dans ${nextUpcoming.daysAway} j`}
              </span>
              <span style={{ ...hb.statLbl, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>prochain : {nextUpcoming.title}</span>
            </button>
          )}
        </div>
      </section>

      <style>{`
        @keyframes cal-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .cal-cell { transition: background var(--d-base) var(--ease-smooth); cursor: pointer; }
        .cal-cell:hover { background: var(--surface) !important; }
        .cal-cell-sel { background: var(--accent-bg) !important; }
        .evt-row { transition: background var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth); }
        .evt-row:hover { background: var(--surface-2) !important; border-color: var(--border-2) !important; }
        .cat-chip { transition: opacity var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-spring); cursor: pointer; }
        .cat-chip:hover { opacity: 0.85; transform: translateY(-1px); }
        .icon-btn { transition: background var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-spring); cursor: pointer; }
        .icon-btn:hover { background: var(--surface-2) !important; color: var(--text) !important; transform: translateY(-1px); }
        /* Aujourd hui : pastille accent, animation pulse subtile */
        .today-num {
          background: var(--accent-text); color: var(--bg);
          border-radius: 50%; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; flex-shrink: 0;
          box-shadow: 0 0 0 3px var(--accent-bg);
        }
        .sel-num {
          background: var(--accent-bg-2); color: var(--accent-text);
          border-radius: 50%; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; flex-shrink: 0;
          outline: 1.5px solid var(--accent-border-2);
        }
        .time-sel:hover { border-color: var(--border-2) !important; }
        /* Pills (séjours) : hover scale subtil */
        .cal-pill { will-change: transform; }
        .cal-pill:hover { transform: translateX(2px); }
        /* Boutons calendrier : hover lift */
        .cal-nav-btn:hover { background: var(--surface-2); border-color: var(--border-2); color: var(--text); transform: translateY(-1px); }
        .cal-today-btn:hover { background: var(--surface-2); border-color: var(--border-2); color: var(--text); }
        .cal-add-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-glow); }
        .time-sel:focus { border-color: var(--accent-text) !important; outline: none; box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 0,76,63), 0.12); }
        .multi-toggle { transition: all 0.15s; cursor: pointer; }
        .multi-toggle:hover { background: var(--surface-2) !important; }
        /* Libellés des boutons de la barre d outils : seulement sur grand écran */
        .cal-btn-label { display: none; }
        @media (min-width: 1400px) { .cal-btn-label { display: inline; } }
        @media (max-width: 1023px) {
          .cal-month-title { min-width: 180px !important; }
        }
        @media (max-width: 900px) {
          .cal-layout { flex-direction: column !important; }
          /* Sur mobile/tablette le drawer redevient un bloc en flux normal,
             toujours visible (le toggle drawer est caché de toute façon) */
          .cal-side   {
            position: relative !important;
            width: 100% !important;
            transform: none !important;
            box-shadow: none !important;
            pointer-events: auto !important;
            border-left: none !important;
            border-top: 1px solid var(--border) !important;
            max-height: none !important;
            z-index: auto !important;
            display: flex !important;
          }
          /* Bouton drawer caché : pas pertinent quand le panneau est en flux */
          .cal-drawer-toggle, .cal-drawer-close { display: none !important; }
        }
        /* Vue KPIs mobile : cachée sur desktop */
        .cal-mobile-kpis { display: none; }
        @media (max-width: 767px) {
          /* Filter bar: chips scroll horizontally, search full-width below */
          .cal-filter-bar   { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
          .cal-filter-chips { flex-wrap: nowrap !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 0 !important; }
          .cal-filter-chips::-webkit-scrollbar { display: none; }
          .cal-search-wrap  { max-width: 100% !important; width: 100% !important; flex: none !important; min-width: 0 !important; }
          /* Month nav: tighter */
          .cal-month-title  { min-width: 140px !important; font-size: 17px !important; }
          /* Mini-stats verbeuses : cachées sur mobile, remplacées par cal-mobile-kpis */
          .cal-mini-stats   { display: none !important; }
          .cal-mobile-kpis  {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 12px;
          }
          /* Saisie rapide cachée sur mobile (saisie clavier pénible, le bouton + suffit) */
          .cal-quick-wrap   { display: none !important; }
          /* Bandeau Tout est en ordre plus discret sur mobile */
          .cal-alert-ok     { padding: 8px 12px !important; font-size: 11.5px !important; }
        }
        @media (max-width: 640px) {
          .cal-root        { padding: 8px 8px 24px !important; gap: 10px !important; }
          .cal-topbar      { gap: 6px !important; }
          .cal-cell        { min-height: 54px !important; padding: 4px !important; }
          .cal-pill-wrap   { display: none !important; }
          .cal-day-header  { padding: 6px 2px !important; font-size: 9px !important; letter-spacing: 0 !important; }
          .cal-date-row    { grid-template-columns: 1fr !important; }
          .cal-row-arrow   { display: none !important; }
          .cal-add-text    { display: none !important; }
          .cal-month-title { font-size: 15px !important; min-width: 120px !important; }
          .cal-layout      { min-height: 0 !important; }
          .cal-side-head   { padding: 10px 14px 8px !important; }
          /* Alert grid, horizontal scroll on mobile */
          .cal-alert-grid  { display: flex !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; gap: 8px !important; }
          .cal-alert-grid::-webkit-scrollbar { display: none; }
          .cal-alert-col   { min-width: 128px !important; flex-shrink: 0 !important; }
          /* Hide legend sections on mobile */
          .cal-legend      { display: none !important; }
          /* Alert section compact */
          .cal-alert-wrap  { padding: 8px 10px !important; }
          /* Filter chips: shrink text slightly */
          .cal-filter-chip { padding: 5px 10px !important; font-size: 11.5px !important; }
        }
      `}</style>

      {/* ── Top bar */}
      <div className="cal-topbar" style={s.topBar}>
        <div style={s.monthNav} data-tour="calendrier-monthnav">
          <button className="cal-nav-btn" onClick={prevMonth} style={s.navBtn}><CaretLeft size={15} /></button>
          <h2 className="cal-month-title" style={s.monthTitle}>
            {MONTHS_FR[month]}&nbsp;
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '18px' }}>{year}</span>
          </h2>
          <button className="cal-nav-btn" onClick={nextMonth} style={s.navBtn}><CaretRight size={15} /></button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          {/* View mode toggle */}
          <div style={s.viewToggle} data-tour="calendrier-views">
            <button
              onClick={() => setViewMode('month')}
              style={{ ...s.viewBtn, ...(viewMode === 'month' ? s.viewBtnActive : {}) }}
              title="Vue mois"
            >
              <CalendarIcon size={13} weight="fill" />
              <span className="cal-view-text">Mois</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{ ...s.viewBtn, ...(viewMode === 'list' ? s.viewBtnActive : {}) }}
              title="Vue liste"
            >
              <ListBullets size={13} weight="bold" />
              <span className="cal-view-text">Liste</span>
            </button>
          </div>
          {/* Chip sync iCal — visible si feeds configurés */}
          {icalFeeds.length > 0 && (
            <div style={{ position: 'relative' }} data-tour="calendrier-ical">
              {(() => {
                const lastSync = icalFeeds
                  .map(f => f.last_synced)
                  .filter(Boolean)
                  .sort()
                  .pop()
                const lastSyncDate = lastSync ? new Date(lastSync) : null
                const ageMs = lastSyncDate ? Date.now() - lastSyncDate.getTime() : null
                const stale = ageMs != null && ageMs > 1000 * 60 * 60 * 6 // > 6h
                const noEvents = icalEvents.length === 0
                const status = noEvents ? 'warn' : stale ? 'stale' : 'ok'
                const dotColor = status === 'warn' ? 'var(--danger)' : status === 'stale' ? 'var(--warning)' : 'var(--accent-text)'
                return (
                  <button
                    type="button"
                    onClick={() => setShowSyncPanel(p => !p)}
                    style={s.syncChip}
                    title={
                      noEvents ? 'iCal configuré mais aucune réservation importée'
                      : stale ? `Dernière sync : ${lastSyncDate?.toLocaleString('fr-FR')}`
                      : `${icalEvents.length} résa(s) synchronisée(s)`
                    }
                  >
                    <span style={{ ...s.syncDot, background: dotColor }} />
                    <span className="cal-sync-text">
                      {noEvents ? 'Aucune résa' : `${icalEvents.length} résa${icalEvents.length > 1 ? 's' : ''}`}
                    </span>
                  </button>
                )
              })()}
            </div>
          )}
          {/* Toggle saisie rapide */}
          <button
            type="button"
            onClick={() => setShowQuickAdd(v => !v)}
            style={{ ...s.topbarIconBtn, ...(showQuickAdd ? s.topbarIconBtnActive : {}) }}
            title="Saisie rapide (Ménage demain 10h…)"
            aria-label="Saisie rapide"
          >
            <Lightning size={14} weight="fill" />
            <span className="cal-btn-label">Saisie rapide</span>
          </button>
          {/* Bouton Planning ménage — ouvre le modal d'export pour la femme de ménage */}
          <button
            type="button"
            onClick={() => setMenageExportOpen(true)}
            style={s.topbarIconBtn}
            title="Planning ménage (PDF, WhatsApp, iCal)"
            aria-label="Planning ménage"
          >
            <Broom size={14} weight="duotone" />
            <span className="cal-btn-label">Ménage</span>
          </button>
          {/* Bouton Sources — afficher / masquer Airbnb, Booking, Vrbo, séjours…
              Visible partout. Sur desktop il double la legend inline en bas,
              sur mobile c'est le SEUL point d'accès (la legend inline est
              cachée par .cal-legend{display:none} en CSS mobile). */}
          {(contractEvents.length > 0 || legendSources.length > 0) && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowSourcesPanel(v => !v)}
                style={{ ...s.topbarIconBtn, ...(showSourcesPanel ? s.topbarIconBtnActive : {}) }}
                title={hiddenSources.size > 0 ? `${hiddenSources.size} source${hiddenSources.size > 1 ? 's' : ''} masquée${hiddenSources.size > 1 ? 's' : ''}` : 'Afficher / masquer les sources'}
                aria-label="Filtrer les sources affichées"
              >
                <Funnel size={14} weight={hiddenSources.size > 0 ? 'fill' : 'regular'} />
                <span className="cal-btn-label">Sources</span>
                {hiddenSources.size > 0 && (
                  <span style={s.sourcesBadge}>{hiddenSources.size}</span>
                )}
              </button>
              {showSourcesPanel && (
                <div style={s.exportPanel}>
                  <div style={s.exportHeader}>
                    <span style={s.exportTitle}>Sources affichées</span>
                    <button type="button" onClick={() => setShowSourcesPanel(false)} style={s.exportClose} aria-label="Fermer">
                      <X size={13} weight="bold" />
                    </button>
                  </div>
                  <p style={s.exportDesc}>
                    Active ou masque ce qui apparaît dans le calendrier. Ton choix est mémorisé.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {contractEvents.length > 0 && (() => {
                      const visible = !hiddenSources.has('internal')
                      return (
                        <button
                          type="button"
                          onClick={() => toggleSource('internal')}
                          style={{
                            ...s.sourcesRow,
                            ...(visible
                              ? { border: `1px solid ${CAT.arrivee.color}55`, background: `${CAT.arrivee.color}10` }
                              : { opacity: 0.55 }),
                          }}
                        >
                          <span style={{ ...s.legendDot, background: CAT.arrivee.color, opacity: visible ? 1 : 0.35 }} />
                          <span style={{ flex: 1, textAlign: 'left', textDecoration: visible ? 'none' : 'line-through', color: visible ? CAT.arrivee.color : 'var(--text-3)', fontWeight: 600 }}>Séjours</span>
                          {visible ? <Check size={12} weight="bold" color={CAT.arrivee.color} /> : <X size={11} weight="bold" color="var(--text-3)" />}
                        </button>
                      )
                    })()}
                    {legendSources.map(src => {
                      const visible = !hiddenSources.has(src.color)
                      return (
                        <button
                          key={src.color}
                          type="button"
                          onClick={() => toggleSource(src.color)}
                          style={{
                            ...s.sourcesRow,
                            ...(visible
                              ? { border: `1px solid ${src.color}55`, background: `${src.color}10` }
                              : { opacity: 0.55 }),
                          }}
                        >
                          <span style={{ ...s.legendDot, background: src.color, opacity: visible ? 1 : 0.35 }} />
                          <span style={{ flex: 1, textAlign: 'left', textDecoration: visible ? 'none' : 'line-through', color: visible ? src.color : 'var(--text-3)', fontWeight: 600 }}>{src.label}</span>
                          {visible ? <Check size={12} weight="bold" color={src.color} /> : <X size={11} weight="bold" color="var(--text-3)" />}
                        </button>
                      )
                    })}
                  </div>
                  {hiddenSources.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setHiddenSources(new Set())}
                      style={{ ...s.legendClear, marginTop: '10px', width: '100%', justifyContent: 'center' }}
                    >
                      Tout réafficher
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Bouton Export iCal — partager le calendrier vers Google/Apple/Outlook */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowExportPanel(v => !v)}
              style={{ ...s.topbarIconBtn, ...(showExportPanel ? s.topbarIconBtnActive : {}) }}
              title="Exporter ce calendrier (Google, Apple, Outlook…)"
              aria-label="Exporter le calendrier"
            >
              <Share size={14} weight="bold" />
            <span className="cal-btn-label">Partager</span>
            </button>
            {showExportPanel && (
              <div style={s.exportPanel}>
                <div style={s.exportHeader}>
                  <span style={s.exportTitle}>Exporter ce calendrier</span>
                  <button type="button" onClick={() => setShowExportPanel(false)} style={s.exportClose} aria-label="Fermer">
                    <X size={13} weight="bold" />
                  </button>
                </div>
                <p style={s.exportDesc}>
                  Colle ce lien dans Google&nbsp;Agenda, Apple Calendar, Outlook ou Notion : tes séjours et rendez-vous s&apos;y mettent à jour tout seuls.
                </p>
                {icalTokenState ? (
                  <>
                    <div style={s.exportUrlRow}>
                      <input
                        readOnly
                        value={exportUrl}
                        onClick={e => (e.target as HTMLInputElement).select()}
                        style={s.exportUrlInput}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(exportUrl)
                            setExportCopied(true)
                            setTimeout(() => setExportCopied(false), 2000)
                          } catch {}
                        }}
                        style={{ ...s.exportCopyBtn, ...(exportCopied ? s.exportCopyBtnOk : {}) }}
                      >
                        {exportCopied
                          ? <><Check size={12} weight="bold" /> Copié</>
                          : <><Copy size={12} weight="bold" /> Copier</>}
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={exportBusy}
                      onClick={async () => {
                        if (!confirm('Régénérer le lien invalidera l\'ancien partout où il a été collé. Continuer ?')) return
                        setExportBusy(true)
                        const res = await generateIcalToken()
                        setExportBusy(false)
                        if ('token' in res && res.token) setIcalTokenState(res.token)
                      }}
                      style={s.exportSecondaryBtn}
                    >
                      <Warning size={11} weight="bold" /> Régénérer le lien
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={exportBusy}
                    onClick={async () => {
                      setExportBusy(true)
                      const res = await generateIcalToken()
                      setExportBusy(false)
                      if ('token' in res && res.token) setIcalTokenState(res.token)
                    }}
                    style={{ ...s.exportPrimaryBtn, opacity: exportBusy ? 0.6 : 1 }}
                  >
                    {exportBusy ? 'Génération…' : 'Activer le lien iCal'}
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Toggle drawer (panneau latéral) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(v => !v)}
            style={{ ...s.topbarIconBtn, ...(drawerOpen ? s.topbarIconBtnActive : {}) }}
            title={drawerOpen ? 'Masquer le panneau de détails' : 'Afficher le panneau de détails'}
            aria-label="Panneau de détails"
            className="cal-drawer-toggle"
          >
            <SidebarSimple size={14} weight={drawerOpen ? 'fill' : 'regular'} />
          </button>
          <button className="cal-today-btn" onClick={goToday} style={s.todayBtn}>Aujourd&apos;hui</button>
          <button className="btn-primary cal-add-btn" onClick={() => openAdd()} style={s.addBtn}>
            <Plus size={15} weight="bold" />
            <span className="cal-add-text">Événement</span>
          </button>
        </div>
      </div>

      {/* Panneau sync iCal (popover sous le chip) */}
      {showSyncPanel && icalFeeds.length > 0 && (
        <div style={s.syncPanel}>
          <div style={s.syncPanelHeader}>
            <span style={s.syncPanelTitle}>Synchronisations iCal</span>
            <button
              type="button"
              onClick={async () => {
                setSyncingAll(true)
                setSyncFeedback(null)
                let total = 0
                const errs: string[] = []
                for (const feed of icalFeeds) {
                  const res = await syncIcalFeed(feed.id)
                  if (res.error) errs.push(`${feed.name}: ${res.error}`)
                  else if (res.synced) total += res.synced
                }
                setSyncingAll(false)
                if (errs.length > 0) setSyncFeedback({ err: errs.join(' · ') })
                else setSyncFeedback({ ok: `${total} événement${total > 1 ? 's' : ''} synchronisé${total > 1 ? 's' : ''}` })
                setTimeout(() => setSyncFeedback(null), 4500)
              }}
              disabled={syncingAll}
              style={{ ...s.syncAllBtn, opacity: syncingAll ? 0.6 : 1 }}
            >
              <ArrowsClockwise size={11} weight="bold" style={syncingAll ? { animation: 'cal-spin 0.8s linear infinite' } : undefined} />
              {syncingAll ? 'Sync…' : 'Tout synchroniser'}
            </button>
          </div>
          {syncFeedback?.ok && <div style={s.syncOk}>{syncFeedback.ok}</div>}
          {syncFeedback?.err && <div style={s.syncErr}>{syncFeedback.err}</div>}
          <div style={s.syncFeedsList}>
            {icalFeeds.map(f => {
              const count = icalEvents.filter(e => e.feed_id === f.id).length
              const lastSync = f.last_synced
                ? new Date(f.last_synced).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'jamais'
              return (
                <div key={f.id} style={s.syncFeedItem}>
                  <span style={{ ...s.sourcesDot, background: f.color }} />
                  <span style={s.sourceName}>{f.name}</span>
                  <span style={s.sourceCount}>{count}</span>
                  <span style={s.sourceSync}>{lastSync}</span>
                </div>
              )
            })}
          </div>
          {icalEvents.length === 0 && (
            <p style={s.syncEmpty}>
              Aucune réservation importée. Clique sur « Tout synchroniser » pour récupérer les dates depuis Airbnb / Booking / Vrbo.
            </p>
          )}
        </div>
      )}

      {/* ── Filters + search */}
      <div style={s.filterBar} className="cal-filter-bar">
        <div style={s.filterChips} className="cal-filter-chips">
          {([
            { id: 'all',         label: 'Tout' },
            { id: 'sejours',     label: 'Séjours' },
            { id: 'menages',     label: 'Ménages' },
            { id: 'rdv-tache',   label: 'RDV & tâches' },
            { id: 'synchro',     label: 'Synchro' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setHiddenSources(new Set()) }}
              className="cal-filter-chip"
              style={{
                ...s.filterChip,
                ...(filter === f.id ? s.filterChipActive : {}),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={s.searchWrap} className="cal-search-wrap">
          <span style={s.searchIcon}>
            <MagnifyingGlass size={13} weight="bold" />
          </span>
          <input
            type="text"
            placeholder="Rechercher un logement, un voyageur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={s.searchClear} aria-label="Effacer">×</button>
          )}
        </div>
      </div>

      {/* ── Quick add (caché derrière l'icône éclair du topbar) */}
      {showQuickAdd && (
        <div style={s.quickAddWrap} className="cal-quick-wrap">
          <span style={s.quickAddIcon}>⚡</span>
          <input
            type="text"
            placeholder="Saisie rapide, ex : Ménage Villa demain 10h, RDV plombier vendredi 14h…"
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd() }}
            style={s.quickAddInput}
            autoFocus
          />
          {quickAdd && (
            <button onClick={handleQuickAdd} style={s.quickAddBtn} disabled={isPending}>
              Créer
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowQuickAdd(false); setQuickAdd('') }}
            style={s.quickAddClose}
            aria-label="Fermer"
          >
            <X size={12} weight="bold" />
          </button>
        </div>
      )}

      {/* ── Actions à traiter, liste compacte par priorité, avec actions inline */}
      {contractEvents.length > 0 && urgentAlerts.length > 0 && (
        <div style={s.alertList}>
          <div style={s.alertHeader}>
            <span style={s.alertHeaderLabel}>
              À traiter
              <span style={s.alertHeaderCount}>{urgentAlerts.length}</span>
            </span>
            <span style={s.alertHeaderHint}>Clique pour voir · ✓ pour cocher</span>
          </div>
          <div style={s.alertItems}>
            {urgentAlerts.map((alert, i) => (
              <div
                key={`${alert.contractId}-${alert.checklistKey}-${i}`}
                style={{
                  ...s.alertItem,
                  borderLeftColor: alert.color,
                }}
              >
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    const d = alert.navigateDate
                    setSelected(d); setYear(Number(d.slice(0, 4))); setMonth(Number(d.slice(5, 7)) - 1)
                    setSelectedContract(alert.contractRef); setShowForm(false)
                  }}
                  style={s.alertItemMain}
                >
                  <span style={{ ...s.alertDot, background: alert.color }} />
                  <span style={s.alertLogement}>{alert.logement}</span>
                  <span style={s.alertSep}>·</span>
                  <span style={s.alertLabel}>{alert.label}</span>
                  <span style={{ ...s.alertDays, color: alert.color }}>{alert.daysInfo}</span>
                </button>
                {(() => {
                  const tpl = CHECKLIST_TO_GABARIT[alert.checklistKey]
                  if (!tpl) return null
                  // Ouvre la séquence de messages DU logement concerné
                  const lid = logementOptions.find(l => l.nom === alert.logement)?.id
                  return (
                    <Link
                      href={`/dashboard/gabarits?cat=${tpl.cat}${lid ? `&logement=${lid}` : ''}`}
                      onClick={e => e.stopPropagation()}
                      style={s.alertGabaritBtn}
                      title={`Ouvrir mes messages : ${tpl.label}`}
                    >
                      <ChatText size={12} weight="bold" />
                      Mes messages
                    </Link>
                  )
                })()}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleChecklistToggle(alert.contractId, alert.checklistKey) }}
                  style={s.alertCheckBtn}
                  title={`Marquer "${alert.label}" comme fait`}
                  aria-label="Marquer fait"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* "Tout est en ordre", "Prochain événement" et "Sources iCal"
          ont été fusionnés dans le résumé compact en haut + chip sync dans le topbar. */}

      {/* ── Main layout */}
      <div className="cal-layout" style={s.layout}>

        {/* Calendar grid (vue mois) */}
        {viewMode === 'month' && (
        <div style={s.gridWrap}>
          <div style={s.dayHeaders}>
            {DAYS_FR.map(d => <div key={d} className="cal-day-header" style={s.dayHeader}>{d}</div>)}
          </div>
          {/* Week rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {weeks.map((weekCells, wi) => {
              const spans   = computeSpans(weekCells)
              const BAR_H   = 18
              const BAR_GAP = 3
              // Offset vertical entre le numero du jour (top:8, hauteur ~22px)
              // et le debut des barres/pills des sejours. Passe de 32 a 42
              // pour aerer et eviter que la pastille "aujourd'hui" verte
              // touche presque le texte du premier evenement en dessous.
              const BAR_TOP = 42
              const nBars   = Math.min(spans.length, 2)

              return (
                <div key={wi} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', flex: 1 }}>
                  {/* Day cells */}
                  {weekCells.map(({ date, day, inMonth }) => {
                    const isToday   = date === TODAY
                    const isSel     = date === selected
                    const dd        = byDate[date]
                    type DotLike = { id: string; color: string; title: string; isIcal?: boolean; progressColor?: string }
                    const contracts: DotLike[] = (dd?.contracts ?? []).map(c => {
                      const cl = contractChecklists[c.contractId] ?? {}
                      let progressColor: string | undefined
                      if (c.type === 'arrivee') {
                        const avantItems = CHECKLIST_ITEMS.filter(i => i.phase === 'avant')
                        const done = avantItems.filter(i => cl[i.key]).length
                        if (done === avantItems.length) progressColor = 'var(--accent-text)'
                        else if (done > 0) progressColor = '#eab308'
                        else progressColor = 'var(--danger)'
                      }
                      return { id: c.id, color: (CAT[c.type] ?? CAT.note).color, title: c.title, progressColor }
                    })
                    const singles:   DotLike[] = (dd?.custom ?? []).filter(e => !e.end_date || e.end_date === e.date).map(e => ({ id: e.id, color: (CAT[e.category] ?? CAT.note).color, title: e.title }))
                    const icalSingles: DotLike[] = (dd?.ical ?? []).filter(e => !e.end_date || e.end_date === e.start_date).map(e => ({ id: `ical-${e.id}`, color: e.feed_color, title: e.title, isIcal: true }))
                    const customMulti: DotLike[] = (dd?.custom ?? []).filter(e => e.end_date && e.end_date !== e.date).map(e => ({ id: e.id, color: (CAT[e.category] ?? CAT.note).color, title: '' }))
                    const icalMulti:   DotLike[] = (dd?.ical ?? []).filter(e => e.end_date && e.end_date !== e.start_date).map(e => ({ id: `ical-${e.id}`, color: e.feed_color, title: '', isIcal: true }))
                    const allDots   = [...contracts, ...singles, ...icalSingles, ...customMulti, ...icalMulti]
                    const seenD     = new Set<string>()
                    const uniqDots  = allDots.filter(e => { if (seenD.has(e.id)) return false; seenD.add(e.id); return true })
                    const pillItems = [...contracts, ...singles, ...icalSingles]
                    const slots     = Math.max(0, 2 - nBars)
                    const visible   = pillItems.slice(0, slots)
                    const extra     = pillItems.length - visible.length
                    const isWeekend    = (() => { const d = new Date(date).getDay(); return d === 0 || d === 6 })()
                    const isPast       = inMonth && date < TODAY
                    const isInDrag     = !!(dragRange && date >= dragRange.start && date <= dragRange.end)
                    const isInSelRange = !!(selRange  && date >= selRange.start  && date <= selRange.end)
                    const spacer       = nBars > 0 ? BAR_TOP + nBars * (BAR_H + BAR_GAP) - BAR_TOP + 4 : 0
                    const alertsForDay = inMonth ? (smartAlerts[date] ?? []) : []

                    return (
                      <div
                        key={date}
                        className={`cal-cell${isSel ? ' cal-cell-sel' : ''}`}
                        onMouseDown={e => { e.preventDefault(); dragState.current = { start: date, cur: date }; setDragRange(null); setSelRange(null) }}
                        onMouseEnter={() => {
                          if (!dragState.current) return
                          dragState.current.cur = date
                          const { start, cur } = dragState.current
                          const [s2, e2] = start <= cur ? [start, cur] : [cur, start]
                          setDragRange({ start: s2, end: e2 })
                        }}
                        style={{
                          ...s.cell,
                          opacity: !inMonth ? 0.4 : isPast ? 0.6 : 1,
                          userSelect: 'none', position: 'relative',
                          background: isInDrag ? 'rgba(255,213,107,0.16)' : isInSelRange ? 'rgba(255,213,107,0.10)' : isSel && !selRange ? 'var(--surface-2)' : isWeekend && inMonth ? 'var(--bg-2)' : 'transparent',
                          outline: isInDrag ? '1.5px solid rgba(183,121,31,0.45)' : (isSel && !selRange) ? '2px solid var(--accent-border)' : isToday && inMonth ? '2px solid var(--accent-text)' : '1.5px solid transparent',
                        }}
                      >
                        {/* Day number, always at top */}
                        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {isToday && inMonth
                            ? <span className="today-num">{day}</span>
                            : (isSel && inMonth)
                              ? <span className="sel-num">{day}</span>
                              : <span style={{ ...s.dayNum, color: isWeekend && inMonth ? 'var(--text-muted)' : 'var(--text-2)' }}>{day}</span>
                          }
                          {(uniqDots.length > 0 || alertsForDay.length > 0) && (
                            <span style={s.dotRow}>
                              {alertsForDay.slice(0, 1).map((a, i) => (
                                <span key={`alert-${i}`} style={{ width: 6, height: 6, borderRadius: '50%', border: `1.5px solid ${a.color}`, flexShrink: 0, background: 'transparent' }} title={a.label} />
                              ))}
                              {uniqDots.slice(0, 3).map((e, i) => <span key={`${e.id}-${i}`} style={{ ...s.dot, background: e.color }} />)}
                              {uniqDots.length > 3 && <span style={{ ...s.dot, background: 'var(--text-muted)' }} />}
                            </span>
                          )}
                        </div>
                        {/* Spacer for day num + bars */}
                        <div style={{ height: BAR_TOP + spacer + 4 }} />
                        {/* Single-day pills */}
                        <div className="cal-pill-wrap" style={s.pillWrap}>
                          {visible.map(e => (
                            <div key={e.id} className="cal-pill" style={{ ...s.pill, borderLeftColor: e.color, background: `${e.color}1f` }}>
                              <span style={s.pillText}>{e.title}</span>
                              {e.progressColor && (
                                <span
                                  style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: e.progressColor,
                                    marginLeft: '4px', flexShrink: 0,
                                    boxShadow: `0 0 0 1.5px ${e.progressColor}30`,
                                  }}
                                  title="Avancement de la checklist d'arrivée"
                                />
                              )}
                            </div>
                          ))}
                          {extra > 0 && <span style={s.extraChip}>+{extra}</span>}
                        </div>
                      </div>
                    )
                  })}

                  {/* Multi-day bars (custom + iCal) */}
                  {spans.slice(0, 2).map((span, si) => {
                    const left  = `calc(${(span.startCol / 7) * 100}% + 2px)`
                    const width = `calc(${((span.endCol - span.startCol + 1) / 7) * 100}% - 4px)`
                    const top   = BAR_TOP + si * (BAR_H + BAR_GAP)
                    const br    = `${span.isStart ? 4 : 0}px ${span.isEnd ? 4 : 0}px ${span.isEnd ? 4 : 0}px ${span.isStart ? 4 : 0}px`
                    return (
                      <div
                        key={span.id}
                        data-bar="1"
                        onClick={span.onClick}
                        title={span.isBlocked
                          ? `${span.platformLabel} · Date fermée par l'hôte (non comptée dans l'occupation)`
                          : span.isIcal && span.platformLabel ? `${span.platformLabel} · ${span.title}` : span.title}
                        style={{
                          position: 'absolute', top, left, width, height: BAR_H, zIndex: 2,
                          background: span.isBlocked
                            ? 'repeating-linear-gradient(45deg, rgba(122,110,95,0.10) 0 6px, rgba(122,110,95,0.20) 6px 12px)'
                            : span.bg,
                          borderLeft: span.isStart ? `2.5px solid ${span.color}` : 'none',
                          borderRadius: br,
                          display: 'flex', alignItems: 'center', gap: '3px',
                          padding: '0 6px', fontSize: '11px', fontWeight: 500,
                          color: 'var(--text-2)', overflow: 'hidden', cursor: 'pointer',
                          opacity: span.isBlocked ? 0.75 : 1,
                        }}
                      >
                        {/* Libellé au début de la barre, et repris en début de
                            semaine quand un séjour continue sur la ligne suivante */}
                        {(span.isStart || span.startCol === 0) && (
                          <>
                            {span.isIcal && span.platformLabel && (
                              <span style={{
                                fontSize: '9px', fontWeight: 800, letterSpacing: '0.2px',
                                padding: '0 3px', borderRadius: '2px', lineHeight: '14px',
                                flexShrink: 0, background: `${span.color}40`, color: span.color,
                              }}>
                                {span.platformLabel === 'Airbnb' ? 'AB'
                                  : span.platformLabel === 'Booking' ? 'BK'
                                  : span.platformLabel === 'Vrbo' ? 'VB'
                                  : '···'}
                              </span>
                            )}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1 }}>
                              {span.title}
                            </span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Legend row : un chip par source. Allumé = events visibles dans le calendrier.
              Click = toggle l'affichage de CETTE source uniquement (sans toucher au reste). */}
          {(contractEvents.length > 0 || legendSources.length > 0) && (
            <div style={s.legend} className="cal-legend">
              {contractEvents.length > 0 && (() => {
                const visible = !hiddenSources.has('internal')
                return (
                  <button
                    type="button"
                    onClick={() => toggleSource('internal')}
                    style={{
                      ...s.legendChip,
                      ...(visible
                        ? { background: `${CAT.arrivee.color}14`, borderColor: `${CAT.arrivee.color}55`, color: CAT.arrivee.color, fontWeight: 600 }
                        : { opacity: 0.45, textDecoration: 'line-through' }),
                    }}
                    title={visible ? 'Masquer les séjours internes' : 'Afficher les séjours internes'}
                  >
                    <span style={{ ...s.legendDot, background: CAT.arrivee.color, opacity: visible ? 1 : 0.35 }} />
                    Séjours
                  </button>
                )
              })()}
              {legendSources.map(src => {
                const visible = !hiddenSources.has(src.color)
                return (
                  <button
                    key={src.color}
                    type="button"
                    onClick={() => toggleSource(src.color)}
                    style={{
                      ...s.legendChip,
                      ...(visible
                        ? { background: `${src.color}14`, borderColor: `${src.color}55`, color: src.color, fontWeight: 600 }
                        : { opacity: 0.45, textDecoration: 'line-through' }),
                    }}
                    title={visible ? `Masquer ${src.label}` : `Afficher ${src.label}`}
                  >
                    <span style={{ ...s.legendDot, background: src.color, opacity: visible ? 1 : 0.35 }} />
                    {src.label}
                  </button>
                )
              })}
              {hiddenSources.size > 0 && (
                <button
                  type="button"
                  onClick={() => setHiddenSources(new Set())}
                  style={s.legendClear}
                >
                  × Tout réafficher
                </button>
              )}
            </div>
          )}
        </div>
        )}

        {/* Vue liste, événements à venir, regroupés par date */}
        {viewMode === 'list' && (
          <ListView
            byDate={byDate}
            contractEvents={filteredContractEvents}
            today={TODAY}
            icalFeeds={icalFeeds}
            onSelect={(d, contract) => {
              setSelected(d)
              setYear(Number(d.slice(0,4))); setMonth(Number(d.slice(5,7))-1)
              if (contract) setSelectedContract(contract)
            }}
            onSelectSejour={(voyageurId) => router.push(`/dashboard/voyageurs/${voyageurId}`)}
          />
        )}

        {/* ── Side drawer (panneau latéral) — overlay sur la grille pour gagner de la place */}
        <div
          className={`cal-side${drawerOpen ? ' cal-side-open' : ' cal-side-closed'}`}
          style={{
            ...s.side,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
            boxShadow: drawerOpen ? '-12px 0 24px rgba(0,0,0,0.10)' : 'none',
            pointerEvents: drawerOpen ? 'auto' : 'none',
          }}
        >
          <div className="cal-side-head" style={s.sideHead}>
            <div style={s.sideHeadLeft}>
              <div style={s.sideDow}>{capitalize(formatDayLong(selected).split(' ')[0])}</div>
              <div style={s.sideDate}>{formatDayLong(selected).split(' ').slice(1).join(' ')}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              {!showForm && !selectedContract
                ? <button onClick={() => openAdd()} style={s.addDayBtn} className="icon-btn" title="Ajouter"><Plus size={15} weight="bold" /></button>
                : <button onClick={() => { cancelForm(); setSelectedContract(null) }} style={s.addDayBtn} className="icon-btn" title="Annuler"><X size={15} /></button>
              }
              <button
                onClick={() => setDrawerOpen(false)}
                style={s.addDayBtn}
                className="icon-btn cal-drawer-close"
                title="Fermer le panneau"
                aria-label="Fermer le panneau"
              >
                <CaretRight size={15} weight="bold" />
              </button>
            </div>
          </div>

          {/* ── Form */}
          {showForm && (() => {
            const isSejour = fCat === 'sejour' && !editing
            // Bloqué uniquement si pas de logement (le voyageur est optionnel)
            const sejourBlocked = isSejour && logementOptions.length === 0
            const sejourSubmitDisabled = isSejour && (!fLogementId || isPending)
            const generalSubmitDisabled = !isSejour && (!fTitle.trim() || isPending)

            return (
            <div style={s.form}>
              {/* Barre d'accent colorée selon la catégorie sélectionnée */}
              <div style={{
                height: '3px', borderRadius: '0 0 3px 3px',
                background: CAT[fCat]?.color ?? 'var(--accent-text)',
                margin: '-16px -16px 2px', transition: 'background 0.2s',
              }} />

              {/* Catégories — placées en haut quand on crée (le choix conditionne le formulaire) */}
              {!editing && (
                <div style={s.catRow}>
                  {PICKER_CATS.map(key => {
                    const cfg = CAT[key]
                    const active = fCat === key
                    return (
                      <button
                        key={key}
                        className="cat-chip"
                        onClick={() => setFCat(key)}
                        style={{
                          ...s.catChip,
                          border: `1.5px solid ${active ? cfg.color : 'var(--border)'}`,
                          background: active ? cfg.bg : 'transparent',
                          color: active ? cfg.color : 'var(--text-3)',
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? cfg.color : 'var(--text-3)', flexShrink: 0, transition: 'background 0.15s' }} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Titre — uniquement pour ménage/rdv/tâche */}
              {!isSejour && (
                <input
                  autoFocus
                  placeholder="Titre de l'événement…"
                  value={fTitle}
                  onChange={e => setFTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && fTitle.trim()) handleSave() }}
                  className="input-field"
                  style={{ ...s.fInput, marginTop: '4px' }}
                />
              )}

              {/* ─── Champs spécifiques séjour ─── */}
              {isSejour && sejourBlocked && (
                <div style={{
                  background: 'var(--accent-bg-2)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '12.5px',
                  color: 'var(--text-2)',
                  lineHeight: 1.55,
                }}>
                  <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '8px', fontSize: '13px' }}>
                    Crée d'abord les bases
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    Pour ajouter un séjour, il te faut au moins un logement.
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Link href="/dashboard/logements" className="btn-primary" style={{ fontSize: '12px', padding: '7px 12px' }}>
                      + Logement
                    </Link>
                  </div>
                </div>
              )}

              {isSejour && !sejourBlocked && (
                <>
                  <div>
                    <label style={s.fLabel}>
                      Voyageur <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: '11px' }}>(optionnel)</span>
                    </label>
                    <SearchableCombobox
                      options={voyageurOptions}
                      value={fVoyageurId}
                      onChange={setFVoyageurId}
                      placeholder="Aucun (séjour personnel / privé)"
                      allowClear
                    />
                  </div>
                  <div>
                    <label style={s.fLabel}>Logement</label>
                    <SearchableCombobox
                      options={logementOptions.map(l => ({ id: l.id, label: l.nom }))}
                      value={fLogementId}
                      onChange={setFLogementId}
                      placeholder="Choisir un logement…"
                      autoFocus
                    />
                  </div>
                </>
              )}

              {/* Plage de dates — toujours visible */}
              <div className="cal-date-row" style={s.dateRow}>
                <CalendarInput
                  value={fStartDate}
                  onChange={v => { setFStartDate(v); if (fEndDate < v) setFEndDate(v) }}
                  placeholder={isSejour ? 'Arrivée' : 'Date début'}
                  disabled={!!editing}
                />
                <span className="cal-row-arrow" style={s.rowArrow}>→</span>
                <CalendarInput
                  value={fEndDate}
                  onChange={setFEndDate}
                  placeholder={isSejour ? 'Départ' : 'Date fin'}
                />
              </div>

              {/* Heures — uniquement pour ménage/rdv/tâche */}
              {!isSejour && (
                <div className="cal-date-row" style={s.dateRow}>
                  <TimePickerInput value={fStart} onChange={setFStart} placeholder="Heure début" />
                  <span className="cal-row-arrow" style={s.rowArrow}>→</span>
                  <TimePickerInput value={fEnd} onChange={setFEnd} placeholder="Heure fin" />
                </div>
              )}

              {/* Montant optionnel */}
              {isSejour && !sejourBlocked && (
                <div>
                  <label style={s.fLabel}>Montant (optionnel)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      placeholder="0"
                      value={fMontant}
                      onChange={e => setFMontant(e.target.value)}
                      className="input-field"
                      style={{ ...s.fInput, paddingRight: '32px' }}
                      min={0}
                      step="0.01"
                    />
                    <span style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '13px', color: 'var(--text-3)',
                      pointerEvents: 'none',
                    }}>€</span>
                  </div>
                </div>
              )}

              {/* Notes — uniquement pour ménage/rdv/tâche */}
              {!isSejour && (
                <textarea
                  placeholder="Notes, détails, liens…"
                  value={fDesc}
                  onChange={e => setFDesc(e.target.value)}
                  rows={3}
                  className="input-field"
                  style={s.fTextarea}
                />
              )}

              {sejourError && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', lineHeight: 1.4 }}>
                  {sejourError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ghost" onClick={cancelForm} style={{ ...s.fCancel, flex: 1 }}>
                  Annuler
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={sejourBlocked || sejourSubmitDisabled || generalSubmitDisabled}
                  style={{
                    ...s.fSave,
                    flex: 2,
                    opacity: sejourBlocked || sejourSubmitDisabled || generalSubmitDisabled ? 0.5 : 1,
                  }}
                >
                  {isPending ? '…' : editing ? 'Modifier' : isSejour ? 'Créer le séjour' : 'Créer'}
                </button>
              </div>
              {!isSejour && fTitle.trim() && !editing && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '-4px' }}>
                  Entrée ↵ pour créer rapidement
                </div>
              )}
            </div>
            )
          })()}

          {/* ── Checklist panel (contract event selected) */}
          {!showForm && selectedContract && (() => {
            const cl = contractChecklists[selectedContract.contractId] ?? {}
            const done = CHECKLIST_ITEMS.filter(i => cl[i.key]).length
            const total = CHECKLIST_ITEMS.length
            const pct = Math.round((done / total) * 100)
            const cat = CAT[selectedContract.type] ?? CAT.note
            const phases = [
              { key: 'avant',   label: 'Avant l\'arrivée' },
              { key: 'pendant', label: 'Pendant le séjour' },
              { key: 'apres',   label: 'Après le départ' },
            ] as const
            return (
              <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Contract header */}
                <div style={{ padding: '12px', borderRadius: '10px', background: cat.bg, border: `1px solid ${cat.border}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: cat.color, marginBottom: '2px' }}>
                    {selectedContract.logement_nom ?? 'Logement'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {cat.label} · {fmtDate(selectedContract.date_arrivee)}
                    {selectedContract.date_depart && ` → ${fmtDate(selectedContract.date_depart)}`}
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Suivi opérationnel</span>
                    <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--accent-text)' : pct > 50 ? '#eab308' : 'var(--danger)' }}>{done}/{total}</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '3px', background: 'var(--surface)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: pct === 100 ? 'var(--accent-text)' : pct > 50 ? '#eab308' : 'var(--danger)', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Checklist by phase */}
                {phases.map(({ key: phase, label }) => {
                  const items = CHECKLIST_ITEMS.filter(i => i.phase === phase)
                  const allChecked = items.every(i => !!cl[i.key])
                  return (
                    <div key={phase}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handlePhaseToggle(selectedContract.contractId, phase, !allChecked)}
                          style={{ fontSize: '10px', color: allChecked ? 'var(--danger)' : 'var(--accent-text)', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${allChecked ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, background: allChecked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', cursor: 'pointer' }}
                        >
                          {allChecked ? 'Tout décocher' : 'Tout cocher'}
                        </button>
                      </div>
                      {items.map(item => {
                        const checked = !!cl[item.key]
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleChecklistToggle(selectedContract.contractId, item.key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '9px',
                              width: '100%', padding: '6px 4px',
                              background: 'none', border: 'none', cursor: 'pointer',
                              textAlign: 'left', borderRadius: '6px',
                              transition: 'background 0.1s',
                            }}
                            className="icon-btn"
                          >
                            <span style={{
                              width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
                              border: `1.5px solid ${checked ? 'var(--accent-text)' : 'var(--border-2)'}`,
                              background: checked ? 'var(--accent-text)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}>
                              {checked && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                            </span>
                            <span style={{ fontSize: '12px', color: checked ? 'var(--text-muted)' : 'var(--text-2)', textDecoration: checked ? 'line-through' : 'none', flex: 1 }}>
                              {item.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* ── Events list */}
          {!showForm && !selectedContract && (
            <div style={s.evtList}>
              {selectedAll.length === 0 ? (
                <div style={s.emptyState}>
                  <CalendarBlank size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 12px' }}>
                    Aucun événement ce jour
                  </p>
                  <button className="btn-ghost" onClick={() => openAdd()} style={{ fontSize: '13px', padding: '7px 16px' }}>
                    + Ajouter
                  </button>
                </div>
              ) : (
                selectedAll.map((ev: Merged) => {
                  const isContract = !!ev.isContract
                  const isIcal     = !!ev.isIcal
                  const cat        = CAT[ev.category] ?? CAT.note
                  const accent     = isIcal ? (ev.feedColor ?? '#8B6D5E') : cat.color
                  const label      = isIcal ? (ev.feedName ?? 'Calendrier externe') : cat.label
                  const isMulti    = !!ev.end_date && ev.end_date !== ev.date
                  const origContract = isContract ? contractEvents.find(c => c.id === ev.id) : null
                  const clDone = origContract ? CHECKLIST_ITEMS.filter(i => (contractChecklists[origContract.contractId] ?? {})[i.key]).length : 0
                  return (
                    <div
                      key={ev.id}
                      className="evt-row"
                      onClick={isContract && origContract ? () => setSelectedContract(origContract) : undefined}
                      style={{ ...s.evtCard, borderLeft: `3px solid ${accent}`, cursor: isContract ? 'pointer' : 'default' }}
                    >
                      <div style={s.evtCardTop}>
                        <span style={s.evtTitle}>{ev.title}</span>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                          {isContract && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: clDone === CHECKLIST_ITEMS.length ? 'var(--accent-text)' : clDone > 0 ? '#eab308' : 'var(--text-muted)', background: 'var(--surface)', padding: '2px 7px', borderRadius: '100px' }}>
                              {clDone}/{CHECKLIST_ITEMS.length}
                            </span>
                          )}
                          {isIcal && (
                            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.4px', color: accent, background: `${accent}1f`, padding: '2px 7px', borderRadius: '100px', textTransform: 'uppercase' }}>
                              Synchro
                            </span>
                          )}
                          {!isContract && !isIcal && (
                            <>
                              <button className="icon-btn" onClick={() => openEdit(ev as CalEvent)} style={s.iconBtn} title="Modifier">
                                <PencilSimple size={12} />
                              </button>
                              <button className="icon-btn" onClick={() => handleDelete(ev.id)} style={{ ...s.iconBtn, color: 'var(--text-3)' }} title="Supprimer">
                                <Trash size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                        {isMulti && ev.end_date && (
                          <span style={s.spanBadge}>
                            {fmtDate(ev.date)} → {fmtDate(ev.end_date)}
                          </span>
                        )}
                        {ev.start_time && (
                          <span style={s.evtTime}>
                            <Clock size={11} />
                            {fmtTime(ev.start_time)}{ev.end_time ? ` → ${fmtTime(ev.end_time)}` : ''}
                          </span>
                        )}
                        <span style={{ ...s.catLabel, color: accent }}>{label}</span>
                      </div>

                      {ev.description && (
                        <p style={s.evtDesc}>{ev.description}</p>
                      )}

                      {/* Réservation importée : le flux Airbnb / Booking ne
                          transmet que les dates, l'hôte complète le reste */}
                      {isIcal && ev.completion && (
                        <div style={s.completeBox}>
                          <p style={s.completeText}>
                            {ev.completion.platform === 'booking' ? 'Booking' : ev.completion.platform === 'vrbo' ? 'Vrbo' : ev.completion.platform === 'airbnb' ? 'Airbnb' : 'La plateforme'} ne transmet que les dates. Ajoute le voyageur (sa nationalité sert à la déclaration) et le montant.
                          </p>
                          <button type="button" onClick={() => setCompleteIcal(ev.completion!)} style={s.completeBtn}>
                            <Plus size={13} weight="bold" /> Compléter la réservation
                          </button>
                        </div>
                      )}
                      {isIcal && ev.linked && (
                        <span style={s.linkedChip}><Check size={11} weight="bold" /> Voyageur ajouté</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>
      </div>

      {completeIcal && (
        <QuickSejourModal
          voyageurs={quickVoyageurs}
          logements={logementOptions}
          onClose={() => setCompleteIcal(null)}
          defaults={{ logementNom: completeIcal.logementNom ?? undefined, dateArrivee: completeIcal.dateArrivee, dateDepart: completeIcal.dateDepart }}
          platform={completeIcal.platform ?? undefined}
        />
      )}

      {/* ── Mini-popover quand on clique sur un séjour ────────────────────── */}
      {sejourPopover && (() => {
        const sej = sejourPopover.sejour
        const logementLow = sej.logement_label.trim().toLowerCase()
        const matchLogement = (s: { logementName: string }) =>
          s.logementName.trim().toLowerCase() === logementLow

        // Ménage APRÈS le départ : date_depart de ce séjour
        const slotAfter = menageSlots.find(m => m.date === sej.date_depart && matchLogement(m)) ?? null
        // Ménage AVANT l'arrivée : un slot dont le prochain check-in == l'arrivée
        // de ce séjour. C'est physiquement le ménage du départ précédent. Null
        // si premier séjour du logement sur la période.
        const slotBefore = menageSlots.find(m => m.prochainCheckIn === sej.date_arrivee && matchLogement(m)) ?? null

        // Détecte si un calendar_event 'menage' [FAIT] existe déjà pour ce
        // créneau (titre contient le nom du logement + même date). C'est
        // l'état "coché" qui permet le toggle.
        const isDoneFor = (date: string | null) => {
          if (!date) return false
          return events.some(e =>
            e.category === 'menage'
            && e.date === date
            && (e.title ?? '').toLowerCase().includes(logementLow)
            && (e.description ?? '').includes('[FAIT]')
          )
        }

        const menageBefore = slotBefore ? { slot: slotBefore, done: isDoneFor(slotBefore.date) } : null
        const menageAfter  = slotAfter  ? { slot: slotAfter,  done: isDoneFor(slotAfter.date)  } : null

        return (
          <SejourPopover
            sejour={sej}
            menageBefore={menageBefore}
            menageAfter={menageAfter}
            logementNames={logementOptions.map(l => l.nom).filter(Boolean)}
            anchorRect={sejourPopover.anchor}
            onClose={() => setSejourPopover(null)}
            onUpdateSejour={async (form) => {
              // Optimiste : le calendrier reflète la modification tout de suite,
              // l'appel serveur suit ; retour arrière si le serveur refuse.
              const before = sejourEvents
              setSejourEvents(prev => prev.map(s => s.id === sej.id ? {
                ...s,
                date_arrivee: form.date_arrivee,
                date_depart: form.date_depart,
                logement_label: form.logement,
                montant: form.montant,
              } : s))
              setSejourPopover(curr => curr ? {
                ...curr,
                sejour: { ...curr.sejour, date_arrivee: form.date_arrivee, date_depart: form.date_depart, logement_label: form.logement, montant: form.montant },
              } : null)
              const r = await updateSejourFromCalendar({
                id: sej.id,
                date_arrivee: form.date_arrivee,
                date_depart: form.date_depart,
                logement: form.logement,
                montant: form.montant,
              })
              if ('error' in r && r.error) {
                setSejourEvents(before)
                return { ok: false, error: r.error }
              }
              // Pas de router.refresh() : l'action appelle revalidatePath sur cette page, dont la réponse contient déjà la page à jour (un refresh en plus refaisait tout le rendu une 2e fois).
              return { ok: true }
            }}
            onDeleteSejour={async () => {
              const r = await deleteSejourFromCalendar({ id: sej.id })
              if (!r.ok) return { ok: false, error: r.error }
              // Optimiste : retire du state local + ferme le popover
              setSejourEvents(prev => prev.filter(s => s.id !== sej.id))
              // Pas de router.refresh() : l'action appelle revalidatePath sur cette page, dont la réponse contient déjà la page à jour (un refresh en plus refaisait tout le rendu une 2e fois).
              return { ok: true }
            }}
            onToggleMenage={async (slot, done) => {
              // Update optimiste : on modifie events localement AVANT l'appel
              // serveur pour que la checkbox bascule immédiatement. Sinon
              // useState(initial) ignore la nouvelle prop initial après
              // router.refresh → l'UI reste figée sur l'ancien état alors
              // que la DB a bien changé.
              const logLow = slot.logementName.trim().toLowerCase()
              const matchesEvent = (e: CalEvent) =>
                e.category === 'menage'
                && e.date === slot.date
                && (e.title ?? '').toLowerCase().includes(logLow)

              setEvents(prev => {
                if (done) {
                  // COCHER : si un event existe → ajouter [FAIT], sinon créer
                  // un event temporaire (le router.refresh remplacera l'id
                  // temporaire par le vrai après sync serveur).
                  const idx = prev.findIndex(matchesEvent)
                  if (idx >= 0) {
                    const e = prev[idx]
                    const desc = (e.description ?? '').replace(/^\[FAIT\]\s*/, '')
                    return prev.map((x, i) => i === idx
                      ? { ...x, description: `[FAIT] ${desc}`.trim() }
                      : x
                    )
                  }
                  return [...prev, {
                    id: `tmp-menage-${slot.id}`,
                    title: `Ménage · ${slot.logementName}`,
                    date: slot.date,
                    end_date: null,
                    start_time: slot.startTime,
                    end_time: slot.endTime,
                    category: 'menage',
                    description: `[FAIT]${slot.notes ? ' · ' + slot.notes : ''}`,
                  } satisfies CalEvent]
                }
                // DÉCOCHER : retirer [FAIT] de la description, supprimer
                // l'event s'il devient vide (= juste créé via cocher avant).
                return prev.flatMap(e => {
                  if (!matchesEvent(e)) return [e]
                  const stripped = (e.description ?? '').replace(/^\[FAIT\]\s*/, '').trim()
                  if (stripped.length > 0 && stripped !== '·') {
                    return [{ ...e, description: stripped }]
                  }
                  return []
                })
              })

              // Appel serveur en arrière-plan : router.refresh garantit
              // la cohérence à terme. En cas d'erreur on signale et on
              // re-fetch pour rollback.
              const r = await setMenageDone({
                date: slot.date,
                logementName: slot.logementName,
                done,
                startTime: slot.startTime,
                endTime: slot.endTime,
                notes: slot.notes ?? undefined,
              })
              // Succès : rien à faire (état déjà à jour localement, et
              // revalidatePath côté serveur). Échec : on recharge pour annuler.
              if (!r.ok) {
                alert(r.error)
                router.refresh()
              }
            }}
          />
        )
      })()}

      {/* ── Modal d'export ménage (PDF, WhatsApp, iCal cleaner) ───────────── */}
      {menageExportOpen && (() => {
        // Liste des noms de logements disponibles (pour le select Ajouter ménage).
        const logementNames: string[] = logementOptions.map(l => l.nom).filter(Boolean) as string[]
        // Calcule l'ensemble des slots qui ont déjà un calendar_event [FAIT]
        // associé (matching date + nom de logement). Sert au modal + au PDF
        // pour afficher visuellement l'état "fait" — sinon le PDF ne reflète
        // pas les ménages que l'hôte a marqués comme finis dans le popover.
        const doneIds = new Set<string>()
        for (const slot of menageSlots) {
          const logementLow = slot.logementName.trim().toLowerCase()
          const isDone = events.some(e =>
            e.category === 'menage'
            && e.date === slot.date
            && (e.title ?? '').toLowerCase().includes(logementLow)
            && (e.description ?? '').includes('[FAIT]')
          )
          if (isDone) doneIds.add(slot.id)
        }
        // Map nom-de-logement → id pour le raccourci "Modifier les valeurs
        // par défaut" dans le formulaire d'édition d'un ménage.
        const logementIdByName: Record<string, string> = {}
        for (const l of logementOptions) {
          if (l.nom) logementIdByName[l.nom] = l.id
        }
        return (
          <MenageExportModal
            slots={menageSlots}
            doneIds={doneIds}
            logementNames={logementNames}
            logementIdByName={logementIdByName}
            appUrl={appUrl}
            icalToken={icalTokenState}
            hostName={hostName}
            onClose={() => setMenageExportOpen(false)}
            onSlotsChanged={() => router.refresh()}
          />
        )
      })()}

    </div>
  )
}

export type { CalEvent } from './calendrier-shared'

// Bandeau d'en-tête du calendrier (même dégradé que HubHero, en plus compact)
const hb: Record<string, React.CSSProperties> = {
  band: {
    display: 'flex', flexWrap: 'wrap', gap: '16px 28px', alignItems: 'center',
    padding: 'clamp(16px,2.2vw,22px) clamp(18px,2.6vw,28px)', borderRadius: 20,
    background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(99,214,131,0.10) 55%, rgba(255,213,107,0.14) 100%)',
    border: '1px solid var(--accent-border)',
  },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,2.6vw,32px)', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.15, letterSpacing: '-0.4px' },
  desc: { fontSize: 13.5, color: 'var(--text-2)', margin: '6px 0 0', lineHeight: 1.5 },
  // Flex (pas grid) : une tuile seule en fin de ligne s'étire au lieu de rester petite
  stats: { flex: '2 1 460px', display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 },
  stat: { flex: '1 1 112px', display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 0, textAlign: 'left' },
  statBtn: { cursor: 'pointer', fontFamily: 'inherit' },
  statNum: { fontFamily: 'var(--font-fraunces), serif', fontSize: 22, lineHeight: 1.1, color: 'var(--text)' },
  statSep: { color: 'var(--text-3)', margin: '0 3px', fontSize: 18 },
  statLbl: { fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.35 },
}
