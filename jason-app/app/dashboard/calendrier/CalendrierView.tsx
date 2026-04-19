'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import {
  CaretLeft, CaretRight, Plus, Trash, PencilSimple,
  CalendarBlank, Clock, X,
} from '@phosphor-icons/react'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, updateContractChecklist } from './actions'
import { CalendarInput, TimePickerInput } from '@/components/ui/CalendarInput'
import type { ContractEvent, IcalFeed, IcalEvent } from './page'

export interface CalEvent {
  id: string
  title: string
  date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  description: string | null
  category: string
}

interface Props {
  events: CalEvent[]
  contractEvents: ContractEvent[]
  icalFeeds: IcalFeed[]
  icalEvents: IcalEvent[]
  icalToken: string | null
  appUrl: string
}

const CAT: Record<string, { label: string; color: string; bg: string }> = {
  arrivee:   { label: 'Arrivée',     color: '#10b981', bg: 'rgba(16,185,129,0.13)' },
  depart:    { label: 'Départ',      color: '#60a5fa', bg: 'rgba(96,165,250,0.13)' },
  menage:    { label: 'Ménage',      color: '#fb923c', bg: 'rgba(251,146,60,0.13)' },
  rdv:       { label: 'RDV',         color: '#FFD56B', bg: 'rgba(255,213,107,0.13)' },
  tache:     { label: 'Tâche',       color: '#a78bfa', bg: 'rgba(167,139,250,0.13)' },
  note:      { label: 'Note',        color: '#94a3b8', bg: 'rgba(148,163,184,0.13)' },
  // Legacy aliases (display only, not shown in pickers)
  entretien: { label: 'Ménage',      color: '#fb923c', bg: 'rgba(251,146,60,0.13)' },
  admin:     { label: 'Tâche',       color: '#a78bfa', bg: 'rgba(167,139,250,0.13)' },
}

type CatKey = 'arrivee' | 'depart' | 'menage' | 'rdv' | 'tache' | 'note'
const PICKER_CATS: CatKey[] = ['menage', 'rdv', 'tache']

function catToDisplay(c: string): CatKey {
  if (c === 'entretien') return 'menage'
  if (c === 'admin')     return 'tache'
  return (c as CatKey) || 'menage'
}

const CHECKLIST_ITEMS: Array<{ key: string; label: string; phase: 'avant' | 'pendant' | 'apres' }> = [
  { key: 'contrat_envoye',        label: 'Contrat envoyé',                 phase: 'avant' },
  { key: 'contrat_signe',         label: 'Contrat signé',                  phase: 'avant' },
  { key: 'acompte_recu',          label: 'Acompte reçu',                   phase: 'avant' },
  { key: 'solde_recu',            label: 'Solde reçu',                     phase: 'avant' },
  { key: 'caution_recue',         label: 'Caution reçue',                  phase: 'avant' },
  { key: 'identite_verifiee',     label: "Pièce d'identité vérifiée",      phase: 'avant' },
  { key: 'instructions_envoyees', label: "Instructions d'arrivée envoyées", phase: 'avant' },
  { key: 'menage_planifie',       label: 'Ménage planifié',                phase: 'avant' },
  { key: 'checkin_effectue',      label: 'Check-in effectué',              phase: 'pendant' },
  { key: 'checkout_effectue',     label: 'Check-out effectué',             phase: 'apres' },
  { key: 'etat_des_lieux',        label: 'État des lieux de sortie',       phase: 'apres' },
  { key: 'caution_restituee',     label: 'Caution restituée',              phase: 'apres' },
  { key: 'avis_demande',          label: 'Avis demandé',                   phase: 'apres' },
]

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function pad2(n: number) { return String(n).padStart(2, '0') }
function toStr(y: number, m: number, d: number) { return `${y}-${pad2(m + 1)}-${pad2(d)}` }
function todayString() {
  const t = new Date()
  return toStr(t.getFullYear(), t.getMonth(), t.getDate())
}

function buildCalendarDays(year: number, month: number) {
  const firstDay    = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: { date: string; day: number; inMonth: boolean }[] = []
  for (let i = startDow; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    cells.push({ date: toStr(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toStr(year, month, d), day: d, inMonth: true })
  }
  const trailing = 7 - (cells.length % 7)
  if (trailing < 7) {
    for (let d = 1; d <= trailing; d++) {
      const nd = new Date(year, month + 1, d)
      cells.push({ date: toStr(nd.getFullYear(), nd.getMonth(), nd.getDate()), day: d, inMonth: false })
    }
  }
  return cells
}

function formatDayLong(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtTime(t: string) { return t.slice(0, 5) }
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendrierView({
  events: initial,
  contractEvents,
}: Props) {
  const TODAY = todayString()
  const now   = new Date()

  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [selected, setSelected] = useState(TODAY)
  const [events,   setEvents]   = useState<CalEvent[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<CalEvent | null>(null)
  const [isPending, startT]     = useTransition()

  // form fields
  const [fTitle,   setFTitle]   = useState('')
  const [fStart,   setFStart]   = useState('')
  const [fEnd,     setFEnd]     = useState('')
  const [fCat,     setFCat]     = useState<CatKey>('menage')
  const [fDesc,    setFDesc]    = useState('')
  const [fStartDate, setFStartDate] = useState('')
  const [fEndDate,   setFEndDate]   = useState('')

  // ── drag-to-create
  const dragState  = useRef<{ start: string; cur: string } | null>(null)
  const [dragRange, setDragRange] = useState<{ start: string; end: string } | null>(null)

  // ── checklist state (contractId → { key: boolean })
  const [contractChecklists, setContractChecklists] = useState<Record<string, Record<string, boolean>>>(() =>
    Object.fromEntries(contractEvents.map(ev => [ev.contractId, ev.checklist_status ?? {}]))
  )
  const [selectedContract, setSelectedContract] = useState<import('./page').ContractEvent | null>(null)

  // ── calendar cells
  const cells = useMemo(() => buildCalendarDays(year, month), [year, month])

  // ── group into week rows
  const weeks = useMemo(() => {
    const rows = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cells])

  // ── multi-day spans per week row
  function computeSpans(weekCells: typeof cells) {
    const ws = weekCells[0].date
    const we = weekCells[6].date
    const seen = new Set<string>()
    return events
      .filter(e => e.end_date && e.end_date !== e.date && e.date <= we && e.end_date >= ws)
      .map(e => {
        if (seen.has(e.id)) return null
        seen.add(e.id)
        const ss = e.date >= ws ? e.date : ws
        const se = e.end_date! <= we ? e.end_date! : we
        const sc = weekCells.findIndex(c => c.date === ss)
        const ec = weekCells.findIndex(c => c.date === se)
        return { event: e, startCol: sc < 0 ? 0 : sc, endCol: ec < 0 ? 6 : ec,
                 isStart: e.date >= ws, isEnd: e.end_date! <= we }
      })
      .filter(Boolean) as Array<{ event: CalEvent; startCol: number; endCol: number; isStart: boolean; isEnd: boolean }>
  }

  // ── event index by date — multi-day events are indexed for every day they span
  const byDate = useMemo(() => {
    const m: Record<string, { custom: CalEvent[]; contracts: ContractEvent[] }> = {}

    events.forEach(e => {
      const startD = e.date
      const endD   = e.end_date ?? e.date
      const [sy, sm, sd] = startD.split('-').map(Number)
      const [ey, em, ed] = endD.split('-').map(Number)
      const cur    = new Date(sy, sm - 1, sd)
      const endDt  = new Date(ey, em - 1, ed)
      while (cur <= endDt) {
        const ds = toStr(cur.getFullYear(), cur.getMonth(), cur.getDate())
        ;(m[ds] ??= { custom: [], contracts: [] }).custom.push(e)
        cur.setDate(cur.getDate() + 1)
      }
    })

    contractEvents.forEach(c => {
      ;(m[c.date] ??= { custom: [], contracts: [] }).contracts.push(c)
    })
    return m
  }, [events, contractEvents])

  // ── selected day merged events (deduplicated by id)
  const selectedAll = useMemo(() => {
    const day  = byDate[selected] ?? { custom: [], contracts: [] }
    const seen = new Set<string>()
    type Merged = CalEvent & { isContract?: boolean }
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

    day.custom.forEach(e => {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        list.push(e)
      }
    })

    return list.sort((a, b) =>
      (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
    )
  }, [byDate, selected])

  const LOGEMENT_COLORS = ['#10b981','#60a5fa','#f59e0b','#a78bfa','#fb923c','#f472b6']
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
      if (dta >= 0 && dta <= 7 && !cl.contrat_signe)        add(arr, '#ef4444', 'Contrat non signé')
      if (dta >= 0 && dta <= 3 && !cl.solde_recu)            add(arr, '#f97316', 'Solde non reçu')
      if (dta >= 0 && dta <= 2 && !cl.instructions_envoyees) add(arr, '#eab308', 'Instructions non envoyées')
      if (dep) {
        const dtd = diff(dep, today)
        if (dtd >= 1 && dtd <= 3 && !cl.avis_demande)        add(dep, '#3b82f6', 'Avis non demandé')
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
    type Item = { color: string; label: string; logement: string; daysInfo: string; navigateDate: string; contractRef: import('./page').ContractEvent }
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
      if (dta >= 0 && dta <= 7 && !cl.contrat_signe)        items.push({ color: '#ef4444', label: 'Contrat non signé',      logement: nom, daysInfo: arrInfo(dta), navigateDate: arr, contractRef: arrRef })
      if (dta >= 0 && dta <= 3 && !cl.solde_recu)            items.push({ color: '#f97316', label: 'Solde non reçu',          logement: nom, daysInfo: arrInfo(dta), navigateDate: arr, contractRef: arrRef })
      if (dta >= 0 && dta <= 2 && !cl.instructions_envoyees) items.push({ color: '#eab308', label: 'Instructions non envoyées', logement: nom, daysInfo: arrInfo(dta), navigateDate: arr, contractRef: arrRef })
      if (dep) {
        const dtd = diff(dep, today)
        const di  = dtd === 1 ? 'Départ hier' : `Départ il y a ${dtd}j`
        if (dtd >= 1 && dtd <= 3 && !cl.avis_demande) items.push({ color: '#3b82f6', label: 'Avis non demandé', logement: nom, daysInfo: di, navigateDate: dep, contractRef: depRef })
      }
    })
    const pri: Record<string, number> = { '#ef4444': 0, '#f97316': 1, '#eab308': 2, '#3b82f6': 3 }
    return items.sort((a, b) => (pri[a.color] ?? 9) - (pri[b.color] ?? 9))
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
  function openAdd(endDate?: string) {
    setEditing(null)
    setFTitle(''); setFStart(''); setFEnd('')
    setFCat('menage'); setFDesc('')
    setFStartDate(selected)
    setFEndDate(endDate ?? selected)
    setShowForm(true)
  }
  // Document-level mouseup — click selects day, drag opens form with date range
  useEffect(() => {
    function onUp() {
      if (!dragState.current) return
      const { start, cur } = dragState.current
      dragState.current = null
      setDragRange(null)
      if (start === cur) { setSelected(start); return }
      const [s, e] = start <= cur ? [start, cur] : [cur, start]
      setSelected(s)
      setYear(Number(s.slice(0, 4)))
      setMonth(Number(s.slice(5, 7)) - 1)
      setEditing(null); setFTitle(''); setFStart(''); setFEnd('')
      setFCat('menage'); setFDesc('')
      setFStartDate(s); setFEndDate(e)
      setShowForm(true)
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
    setShowForm(true)
  }
  function cancelForm() { setShowForm(false); setEditing(null) }

  function handleSave() {
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
      setShowForm(false); setEditing(null)
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
      <style>{`
        .cal-cell { transition: background 0.12s; cursor: pointer; }
        .cal-cell:hover { background: var(--surface-2) !important; }
        .cal-cell-sel { background: var(--surface) !important; }
        .evt-row { transition: all 0.12s; }
        .evt-row:hover { background: var(--surface-2) !important; border-color: var(--border-2) !important; }
        .cat-chip { transition: all 0.12s; cursor: pointer; }
        .cat-chip:hover { opacity: 0.82; }
        .icon-btn { transition: all 0.12s; cursor: pointer; }
        .icon-btn:hover { background: var(--surface-2) !important; color: var(--text) !important; }
        .today-num { background: var(--accent-text); color: var(--bg); border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
        .time-sel:hover { border-color: var(--border-2) !important; }
        .time-sel:focus { border-color: var(--accent-text) !important; outline: none; box-shadow: 0 0 0 2px rgba(var(--accent-rgb, 0,76,63), 0.12); }
        .multi-toggle { transition: all 0.15s; cursor: pointer; }
        .multi-toggle:hover { background: var(--surface-2) !important; }
        @media (max-width: 900px) {
          .cal-layout { flex-direction: column !important; }
          .cal-side   { width: 100% !important; border-left: none !important; border-top: 1px solid var(--border) !important; max-height: none !important; }
        }
        @media (max-width: 640px) {
          .cal-root        { padding: 8px 8px 24px !important; gap: 8px !important; }
          .cal-topbar      { gap: 6px !important; }
          .cal-cell        { min-height: 54px !important; padding: 4px !important; }
          .cal-pill-wrap   { display: none !important; }
          .cal-day-header  { padding: 6px 2px !important; font-size: 9px !important; letter-spacing: 0 !important; }
          .cal-date-row    { grid-template-columns: 1fr !important; }
          .cal-row-arrow   { display: none !important; }
          .cal-add-text    { display: none !important; }
          .cal-month-title { font-size: 16px !important; min-width: unset !important; }
          .cal-layout      { min-height: 0 !important; }
          .cal-side-head   { padding: 10px 14px 8px !important; }
          /* Alert grid — horizontal scroll on mobile */
          .cal-alert-grid  { display: flex !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; gap: 8px !important; }
          .cal-alert-grid::-webkit-scrollbar { display: none; }
          .cal-alert-col   { min-width: 128px !important; flex-shrink: 0 !important; }
          /* Hide legend sections on mobile */
          .cal-legend      { display: none !important; }
          /* Alert section compact */
          .cal-alert-wrap  { padding: 8px 10px !important; }
        }
      `}</style>

      {/* ── Top bar */}
      <div className="cal-topbar" style={s.topBar}>
        <div style={s.monthNav}>
          <button className="btn-ghost" onClick={prevMonth} style={s.navBtn}><CaretLeft size={15} /></button>
          <h2 className="cal-month-title" style={s.monthTitle}>
            {MONTHS_FR[month]}&nbsp;
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '18px' }}>{year}</span>
          </h2>
          <button className="btn-ghost" onClick={nextMonth} style={s.navBtn}><CaretRight size={15} /></button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" onClick={goToday} style={s.todayBtn}>Aujourd'hui</button>
          <button className="btn-primary" onClick={() => openAdd()} style={s.addBtn}>
            <Plus size={15} weight="bold" />
            <span className="cal-add-text">Événement</span>
          </button>
        </div>
      </div>

      {/* ── Actions à traiter */}
      {contractEvents.length > 0 && (
        <div className="cal-alert-wrap" style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '10px 14px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: urgentAlerts.length > 0 ? 'var(--text-2)' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {urgentAlerts.length > 0 ? `À traiter · ${urgentAlerts.length} action${urgentAlerts.length > 1 ? 's' : ''}` : '✓ Tout est en ordre'}
            </span>
          </div>
          {urgentAlerts.length > 0 && (() => {
            const GROUPS = [
              { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: 'Critique' },
              { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Urgent' },
              { color: '#eab308', bg: 'rgba(234,179,8,0.08)',  label: 'Important' },
              { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'À faire' },
            ]
            return (
              <div className="cal-alert-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {GROUPS.map(group => {
                  const groupItems = urgentAlerts.filter(a => a.color === group.color)
                  return (
                    <div key={group.color} className="cal-alert-col" style={{
                      borderRadius: '8px', border: `1px solid ${group.color}30`,
                      background: group.bg, padding: '8px 10px',
                      opacity: groupItems.length === 0 ? 0.35 : 1,
                      display: 'flex', flexDirection: 'column', gap: '4px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: group.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{group.label}</span>
                        {groupItems.length > 0 && (
                          <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: group.color }}>{groupItems.length}</span>
                        )}
                      </div>
                      {groupItems.length === 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                      ) : groupItems.map((alert, i) => (
                        <button
                          key={i}
                          type="button"
                          className="icon-btn"
                          onClick={() => {
                            const d = alert.navigateDate
                            setSelected(d); setYear(Number(d.slice(0, 4))); setMonth(Number(d.slice(5, 7)) - 1)
                            setSelectedContract(alert.contractRef); setShowForm(false)
                          }}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                            padding: '4px 6px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px',
                            border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                          }}
                        >
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', lineHeight: 1.3 }}>{alert.logement}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3 }}>{alert.label}</span>
                          <span style={{ fontSize: '10px', color: group.color, lineHeight: 1.3, marginTop: '1px' }}>{alert.daysInfo}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Main layout */}
      <div className="cal-layout" style={s.layout}>

        {/* Calendar grid */}
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
              const BAR_TOP = 32
              const nBars   = Math.min(spans.length, 2)

              return (
                <div key={wi} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', flex: 1 }}>
                  {/* Day cells */}
                  {weekCells.map(({ date, day, inMonth }) => {
                    const isToday   = date === TODAY
                    const isSel     = date === selected
                    const dd        = byDate[date]
                    const contracts = (dd?.contracts ?? []).map(c => ({ id: c.id, category: c.type, title: c.title }))
                    const singles   = (dd?.custom ?? []).filter(e => !e.end_date || e.end_date === e.date).map(e => ({ id: e.id, category: e.category, title: e.title }))
                    const allDots   = [...contracts, ...singles, ...(dd?.custom ?? []).filter(e => e.end_date && e.end_date !== e.date).map(e => ({ id: e.id, category: e.category, title: '' }))]
                    const seenD     = new Set<string>()
                    const uniqDots  = allDots.filter(e => { if (seenD.has(e.id)) return false; seenD.add(e.id); return true })
                    const pillItems = [...contracts, ...singles]
                    const slots     = Math.max(0, 2 - nBars)
                    const visible   = pillItems.slice(0, slots)
                    const extra     = pillItems.length - visible.length
                    const isWeekend    = (() => { const d = new Date(date).getDay(); return d === 0 || d === 6 })()
                    const isInDrag     = !!(dragRange && date >= dragRange.start && date <= dragRange.end)
                    const spacer       = nBars > 0 ? BAR_TOP + nBars * (BAR_H + BAR_GAP) - BAR_TOP + 4 : 0
                    const alertsForDay = inMonth ? (smartAlerts[date] ?? []) : []

                    return (
                      <div
                        key={date}
                        className={`cal-cell${isSel ? ' cal-cell-sel' : ''}`}
                        onMouseDown={e => { e.preventDefault(); dragState.current = { start: date, cur: date }; setDragRange(null) }}
                        onMouseEnter={() => {
                          if (!dragState.current) return
                          dragState.current.cur = date
                          const { start, cur } = dragState.current
                          const [s2, e2] = start <= cur ? [start, cur] : [cur, start]
                          setDragRange({ start: s2, end: e2 })
                        }}
                        style={{
                          ...s.cell, opacity: inMonth ? 1 : 0.28, userSelect: 'none', position: 'relative',
                          background: isInDrag ? 'rgba(96,165,250,0.12)' : isSel ? 'var(--surface)' : isWeekend && inMonth ? 'rgba(255,255,255,0.015)' : 'var(--bg)',
                          outline: isInDrag ? '1.5px solid rgba(96,165,250,0.4)' : isSel ? '1.5px solid var(--border-2)' : isToday && inMonth ? '1.5px solid var(--accent-text)' : '1.5px solid transparent',
                        }}
                      >
                        {/* Day number — always at top */}
                        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {isToday && inMonth
                            ? <span className="today-num">{day}</span>
                            : <span style={{ ...s.dayNum, color: isWeekend && inMonth ? 'var(--text-muted)' : 'var(--text-2)' }}>{day}</span>
                          }
                          {(uniqDots.length > 0 || alertsForDay.length > 0) && (
                            <span style={s.dotRow}>
                              {alertsForDay.slice(0, 1).map((a, i) => (
                                <span key={`alert-${i}`} style={{ width: 6, height: 6, borderRadius: '50%', border: `1.5px solid ${a.color}`, flexShrink: 0, background: 'transparent' }} title={a.label} />
                              ))}
                              {uniqDots.slice(0, 3).map((e, i) => <span key={`${e.id}-${i}`} style={{ ...s.dot, background: CAT[e.category]?.color ?? CAT.note.color }} />)}
                              {uniqDots.length > 3 && <span style={{ ...s.dot, background: 'var(--text-muted)' }} />}
                            </span>
                          )}
                        </div>
                        {/* Spacer for day num + bars */}
                        <div style={{ height: BAR_TOP + spacer + 4 }} />
                        {/* Single-day pills */}
                        <div className="cal-pill-wrap" style={s.pillWrap}>
                          {visible.map(e => {
                            const c = CAT[e.category] ?? CAT.note
                            return <div key={e.id} style={{ ...s.pill, borderLeftColor: c.color, background: c.bg }}><span style={s.pillText}>{e.title}</span></div>
                          })}
                          {extra > 0 && <span style={s.extraChip}>+{extra}</span>}
                        </div>
                      </div>
                    )
                  })}

                  {/* Multi-day bars */}
                  {spans.slice(0, 2).map((span, si) => {
                    const cat   = CAT[span.event.category as CatKey] ?? CAT.note
                    const left  = `calc(${(span.startCol / 7) * 100}% + 2px)`
                    const width = `calc(${((span.endCol - span.startCol + 1) / 7) * 100}% - 4px)`
                    const top   = BAR_TOP + si * (BAR_H + BAR_GAP)
                    const br    = `${span.isStart ? 4 : 0}px ${span.isEnd ? 4 : 0}px ${span.isEnd ? 4 : 0}px ${span.isStart ? 4 : 0}px`
                    return (
                      <div
                        key={span.event.id}
                        onClick={() => { setSelected(span.event.date); setYear(Number(span.event.date.slice(0,4))); setMonth(Number(span.event.date.slice(5,7))-1) }}
                        style={{
                          position: 'absolute', top, left, width, height: BAR_H, zIndex: 2,
                          background: cat.bg,
                          borderLeft: span.isStart ? `2.5px solid ${cat.color}` : 'none',
                          borderRadius: br,
                          display: 'flex', alignItems: 'center',
                          padding: '0 6px', fontSize: '11px', fontWeight: 500,
                          color: 'var(--text-2)', overflow: 'hidden', cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {span.isStart && span.event.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Side panel */}
        <div className="cal-side" style={s.side}>
          <div className="cal-side-head" style={s.sideHead}>
            <div style={s.sideHeadLeft}>
              <div style={s.sideDow}>{capitalize(formatDayLong(selected).split(' ')[0])}</div>
              <div style={s.sideDate}>{formatDayLong(selected).split(' ').slice(1).join(' ')}</div>
            </div>
            {!showForm && !selectedContract
              ? <button onClick={() => openAdd()} style={s.addDayBtn} className="icon-btn" title="Ajouter"><Plus size={15} weight="bold" /></button>
              : <button onClick={() => { cancelForm(); setSelectedContract(null) }} style={s.addDayBtn} className="icon-btn" title="Fermer"><X size={15} /></button>
            }
          </div>

          {/* ── Form */}
          {showForm && (
            <div style={s.form}>
              <input
                autoFocus
                placeholder="Titre de l'événement…"
                value={fTitle}
                onChange={e => setFTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                className="input-field"
                style={s.fInput}
              />

              {/* Date row */}
              <div className="cal-date-row" style={s.dateRow}>
                <CalendarInput
                  value={fStartDate}
                  onChange={v => { setFStartDate(v); if (fEndDate < v) setFEndDate(v) }}
                  placeholder="Date début"
                  disabled={!!editing}
                />
                <span className="cal-row-arrow" style={s.rowArrow}>→</span>
                <CalendarInput
                  value={fEndDate}
                  onChange={setFEndDate}
                  placeholder="Date fin"
                />
              </div>

              {/* Time row */}
              <div className="cal-date-row" style={s.dateRow}>
                <TimePickerInput value={fStart} onChange={setFStart} placeholder="Heure début" />
                <span className="cal-row-arrow" style={s.rowArrow}>→</span>
                <TimePickerInput value={fEnd} onChange={setFEnd} placeholder="Heure fin" />
              </div>

              {/* Category chips */}
              <div style={s.catRow}>
                {PICKER_CATS.map(key => {
                  const cfg = CAT[key]
                  return (
                  <button
                    key={key}
                    className="cat-chip"
                    onClick={() => setFCat(key)}
                    style={{
                      ...s.catChip,
                      border: `1.5px solid ${fCat === key ? cfg.color : 'transparent'}`,
                      background: fCat === key ? cfg.bg : 'var(--surface)',
                      color: fCat === key ? cfg.color : 'var(--text-3)',
                    }}
                  >
                    {cfg.label}
                  </button>
                  )
                })}
              </div>

              <textarea
                placeholder="Notes, détails, liens…"
                value={fDesc}
                onChange={e => setFDesc(e.target.value)}
                rows={3}
                className="input-field"
                style={s.fTextarea}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={cancelForm} style={s.fCancel}>Annuler</button>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={!fTitle.trim() || isPending}
                  style={{ ...s.fSave, opacity: !fTitle.trim() || isPending ? 0.5 : 1 }}
                >
                  {editing ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          )}

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
                <div style={{ padding: '12px', borderRadius: '10px', background: cat.bg, border: `1px solid ${cat.color}30` }}>
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
                    <span style={{ fontWeight: 600, color: pct === 100 ? '#10b981' : pct > 50 ? '#eab308' : '#ef4444' }}>{done}/{total}</span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '3px', background: 'var(--surface)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: pct === 100 ? '#10b981' : pct > 50 ? '#eab308' : '#ef4444', transition: 'width 0.3s' }} />
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
                          style={{ fontSize: '10px', color: allChecked ? '#ef4444' : '#10b981', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${allChecked ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, background: allChecked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', cursor: 'pointer' }}
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
                              border: `1.5px solid ${checked ? '#10b981' : 'var(--border-2)'}`,
                              background: checked ? '#10b981' : 'transparent',
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
                selectedAll.map((ev: any) => {
                  const cat        = CAT[ev.category] ?? CAT.note
                  const isContract = !!ev.isContract
                  const isMulti    = !!ev.end_date && ev.end_date !== ev.date
                  const origContract = isContract ? contractEvents.find(c => c.id === ev.id) : null
                  const clDone = origContract ? CHECKLIST_ITEMS.filter(i => (contractChecklists[origContract.contractId] ?? {})[i.key]).length : 0
                  return (
                    <div
                      key={ev.id}
                      className="evt-row"
                      onClick={isContract && origContract ? () => setSelectedContract(origContract) : undefined}
                      style={{ ...s.evtCard, borderLeft: `3px solid ${cat.color}`, cursor: isContract ? 'pointer' : 'default' }}
                    >
                      <div style={s.evtCardTop}>
                        <span style={s.evtTitle}>{ev.title}</span>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                          {isContract && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: clDone === CHECKLIST_ITEMS.length ? '#10b981' : clDone > 0 ? '#eab308' : 'var(--text-muted)', background: 'var(--surface)', padding: '2px 7px', borderRadius: '100px' }}>
                              {clDone}/{CHECKLIST_ITEMS.length}
                            </span>
                          )}
                          {!isContract && (
                            <>
                              <button className="icon-btn" onClick={() => openEdit(ev as CalEvent)} style={s.iconBtn} title="Modifier">
                                <PencilSimple size={12} />
                              </button>
                              <button className="icon-btn" onClick={() => handleDelete(ev.id)} style={{ ...s.iconBtn, color: 'var(--error, #f87171)' }} title="Supprimer">
                                <Trash size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const }}>
                        {isMulti && (
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
                        <span style={{ ...s.catLabel, color: cat.color }}>{cat.label}</span>
                      </div>

                      {ev.description && (
                        <p style={s.evtDesc}>{ev.description}</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Logements legend */}
          {!selectedContract && logements.length > 0 && (
            <div className="cal-legend" style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                Logements
              </div>
              {logements.map((nom, i) => (
                <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0', fontSize: '12px', color: 'var(--text-2)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: LOGEMENT_COLORS[i % LOGEMENT_COLORS.length], flexShrink: 0 }} />
                  {nom}
                </div>
              ))}
            </div>
          )}

          {/* ── Event types legend */}
          {!selectedContract && (
            <div className="cal-legend" style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                Types d'événements
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                {PICKER_CATS.concat(['arrivee', 'depart'] as CatKey[]).map(key => {
                  const cfg = CAT[key]
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-2)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: cfg.color, flexShrink: 0 }} />
                      {cfg.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    padding: '20px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  monthNav: { display: 'flex', alignItems: 'center', gap: '10px' },
  monthTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
    letterSpacing: '-0.4px',
    fontFamily: 'Fraunces, serif',
    minWidth: '220px',
    textAlign: 'center',
  },
  navBtn: {
    width: '34px', height: '34px',
    padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '9px',
    border: '1px solid var(--border-2)',
    background: 'var(--surface)',
    color: 'var(--text-2)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  todayBtn: {
    padding: '8px 16px',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid var(--border-2)',
    background: 'var(--surface)',
    color: 'var(--text-2)',
    cursor: 'pointer',
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '9px 18px',
    fontSize: '13px', fontWeight: 600,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
  },
  layout: {
    display: 'flex',
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
    minHeight: '560px',
  },
  gridWrap: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  dayHeaders: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' },
  dayHeader: {
    padding: '10px 8px',
    textAlign: 'center',
    fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  grid: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' },
  cell: {
    minHeight: '92px',
    padding: '8px',
    borderRight: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', gap: '4px',
    outlineOffset: '-1px',
  },
  cellTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '2px',
  },
  dayNum: { fontSize: '13px', fontWeight: 500, lineHeight: 1 },
  dotRow: { display: 'flex', gap: '2px', alignItems: 'center' },
  dot: { width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0 },
  pillWrap: { display: 'flex', flexDirection: 'column', gap: '2px' },
  pill: {
    display: 'flex', alignItems: 'center',
    padding: '2px 6px 2px 5px',
    borderRadius: '4px', borderLeft: '2.5px solid',
    overflow: 'hidden',
  },
  pillText: {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-2)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
  },
  extraChip: { fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '1px 4px' },

  // side
  side: {
    width: '290px', flexShrink: 0,
    borderLeft: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
  },
  sideHead: {
    padding: '18px 18px 14px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px',
    position: 'sticky', top: 0,
    background: 'var(--card-bg)', zIndex: 1,
  },
  sideHeadLeft: { display: 'flex', flexDirection: 'column', gap: '1px' },
  sideDow: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text)',
    fontFamily: 'Fraunces, serif',
    textTransform: 'capitalize', letterSpacing: '-0.2px',
  },
  sideDate: { fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' },
  addDayBtn: {
    width: '30px', height: '30px',
    borderRadius: '8px',
    border: '1px solid var(--border-2)',
    background: 'var(--surface)',
    color: 'var(--text-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, padding: 0,
  },

  // form
  form: {
    padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    borderBottom: '1px solid var(--border)',
  },
  fInput: {
    width: '100%', padding: '10px 12px',
    fontSize: '14px', fontWeight: 500, borderRadius: '10px',
  },
  dateRow: {
    display: 'grid', gridTemplateColumns: '1fr auto 1fr',
    gap: '4px', alignItems: 'center',
  },
  rowArrow: {
    color: 'var(--text-muted)', fontSize: '12px',
    flexShrink: 0, textAlign: 'center',
  },
  catRow: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  catChip: {
    padding: '4px 11px', borderRadius: '100px',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
  },
  fTextarea: {
    width: '100%', padding: '10px 12px',
    fontSize: '13px', borderRadius: '10px',
    resize: 'vertical', minHeight: '72px',
  },
  fCancel: { padding: '8px 14px', fontSize: '13px' },
  fSave:   { padding: '8px 18px', fontSize: '13px', border: 'none', cursor: 'pointer', borderRadius: '9px' },

  // events
  evtList: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  evtCard: {
    padding: '12px 14px', borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex', flexDirection: 'column', gap: '5px',
  },
  evtCardTop: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px',
  },
  evtTitle: { fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 },
  spanBadge: {
    fontSize: '11px', fontWeight: 500,
    color: '#60a5fa',
    background: 'rgba(96,165,250,0.1)',
    padding: '2px 8px', borderRadius: '100px',
  },
  evtTime: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500,
  },
  catLabel: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' },
  evtDesc: { fontSize: '12px', color: 'var(--text-2)', margin: '2px 0 0', lineHeight: 1.5 },
  autoBadge: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
    padding: '2px 7px', borderRadius: '100px', flexShrink: 0, alignSelf: 'flex-start',
  },
  iconBtn: {
    width: '26px', height: '26px', borderRadius: '7px',
    border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, flexShrink: 0,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    flex: 1, padding: '32px 16px', textAlign: 'center',
  },
}
