'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  CaretLeft, CaretRight, Plus, Trash, PencilSimple,
  CalendarBlank, Clock, X, House, ArrowRight,
} from '@phosphor-icons/react'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './actions'
import type { ContractEvent } from './page'

export interface CalEvent {
  id: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  description: string | null
  category: string
}

interface Props {
  events: CalEvent[]
  contractEvents: ContractEvent[]
}

const CAT = {
  arrivee:   { label: 'Arrivée',   color: '#10b981', bg: 'rgba(16,185,129,0.13)' },
  depart:    { label: 'Départ',    color: '#60a5fa', bg: 'rgba(96,165,250,0.13)' },
  entretien: { label: 'Entretien', color: '#fb923c', bg: 'rgba(251,146,60,0.13)' },
  admin:     { label: 'Admin',     color: '#a78bfa', bg: 'rgba(167,139,250,0.13)' },
  rdv:       { label: 'RDV',       color: '#FFD56B', bg: 'rgba(255,213,107,0.13)' },
  note:      { label: 'Note',      color: '#94a3b8', bg: 'rgba(148,163,184,0.13)' },
} as const

type CatKey = keyof typeof CAT

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
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
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDow = firstDay.getDay() - 1 // Mon=0 … Sun=6
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

function fmtTime(t: string) { return t.slice(0, 5) }

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

// ─── Component ─────────────────────────────────────────────────────────────

export default function CalendrierView({ events: initial, contractEvents }: Props) {
  const TODAY = todayString()
  const now = new Date()

  const [year, setYear]     = useState(now.getFullYear())
  const [month, setMonth]   = useState(now.getMonth())
  const [selected, setSelected] = useState(TODAY)
  const [events, setEvents] = useState<CalEvent[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<CalEvent | null>(null)
  const [isPending, startT]     = useTransition()

  // form fields
  const [fTitle, setFTitle] = useState('')
  const [fStart, setFStart] = useState('')
  const [fEnd,   setFEnd]   = useState('')
  const [fCat,   setFCat]   = useState<CatKey>('note')
  const [fDesc,  setFDesc]  = useState('')

  // ── calendar cells
  const cells = useMemo(() => buildCalendarDays(year, month), [year, month])

  // ── event index by date
  const byDate = useMemo(() => {
    const m: Record<string, { custom: CalEvent[]; contracts: ContractEvent[] }> = {}
    events.forEach(e => {
      ;(m[e.date] ??= { custom: [], contracts: [] }).custom.push(e)
    })
    contractEvents.forEach(c => {
      ;(m[c.date] ??= { custom: [], contracts: [] }).contracts.push(c)
    })
    return m
  }, [events, contractEvents])

  // ── selected day merged events
  const selectedAll = useMemo(() => {
    const day = byDate[selected] ?? { custom: [], contracts: [] }
    type Merged = CalEvent & { isContract?: boolean }
    const list: Merged[] = [
      ...day.contracts.map(c => ({
        id: c.id, title: c.title, date: c.date,
        start_time: null, end_time: null,
        description: c.logement_nom,
        category: c.type,
        isContract: true,
      })),
      ...day.custom,
    ]
    return list.sort((a, b) =>
      (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
    )
  }, [byDate, selected])

  // ── upcoming (next 7 days, for mini strip)
  const upcoming = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    const end = new Date(t); end.setDate(t.getDate() + 14)
    const todayIso = toStr(t.getFullYear(), t.getMonth(), t.getDate())
    const endIso   = toStr(end.getFullYear(), end.getMonth(), end.getDate())
    const all: Array<{ date: string; title: string; category: string }> = [
      ...contractEvents.map(c => ({ date: c.date, title: c.title, category: c.type })),
      ...events.map(e => ({ date: e.date, title: e.title, category: e.category })),
    ]
    return all
      .filter(e => e.date >= todayIso && e.date <= endIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6)
  }, [events, contractEvents])

  // ── month navigation
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
  function openAdd() {
    setEditing(null)
    setFTitle(''); setFStart(''); setFEnd(''); setFCat('note'); setFDesc('')
    setShowForm(true)
  }
  function openEdit(ev: CalEvent) {
    setEditing(ev)
    setFTitle(ev.title)
    setFStart(ev.start_time ?? '')
    setFEnd(ev.end_time ?? '')
    setFCat((ev.category as CatKey) || 'note')
    setFDesc(ev.description ?? '')
    setShowForm(true)
  }
  function cancelForm() { setShowForm(false); setEditing(null) }

  function handleSave() {
    if (!fTitle.trim()) return
    startT(async () => {
      if (editing) {
        const res = await updateCalendarEvent(editing.id, {
          title: fTitle.trim(),
          start_time: fStart || null,
          end_time: fEnd || null,
          category: fCat,
          description: fDesc.trim() || null,
        })
        if (!res.error && res.event) {
          setEvents(prev => prev.map(e => e.id === editing.id ? (res.event as CalEvent) : e))
        }
      } else {
        const res = await createCalendarEvent({
          title: fTitle.trim(),
          date: selected,
          start_time: fStart || null,
          end_time: fEnd || null,
          category: fCat,
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
    <div style={s.root}>
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
        @media (max-width: 800px) {
          .cal-layout { flex-direction: column !important; }
          .cal-side   { width: 100% !important; border-left: none !important; border-top: 1px solid var(--border) !important; max-height: 50vh; overflow-y: auto; }
        }
      `}</style>

      {/* ── Top bar */}
      <div style={s.topBar}>
        <div style={s.monthNav}>
          <button className="btn-ghost" onClick={prevMonth} style={s.navBtn}><CaretLeft size={15} /></button>
          <h2 style={s.monthTitle}>
            {MONTHS_FR[month]}&nbsp;
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '18px' }}>{year}</span>
          </h2>
          <button className="btn-ghost" onClick={nextMonth} style={s.navBtn}><CaretRight size={15} /></button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" onClick={goToday} style={s.todayBtn}>Aujourd'hui</button>
          <button className="btn-primary" onClick={openAdd} style={s.addBtn}>
            <Plus size={15} weight="bold" />
            Événement
          </button>
        </div>
      </div>

      {/* ── Upcoming strip */}
      {upcoming.length > 0 && (
        <div style={s.strip}>
          {upcoming.map((ev, i) => {
            const cat = CAT[ev.category as CatKey] ?? CAT.note
            const [yy, mm, dd] = ev.date.split('-').map(Number)
            const label = new Date(yy, mm - 1, dd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            return (
              <button
                key={`${ev.date}-${i}`}
                onClick={() => { setSelected(ev.date); setYear(yy); setMonth(mm - 1) }}
                style={{ ...s.stripChip, borderColor: `${cat.color}40` }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0 }}>{label}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)', fontSize: '12px' }}>
                  {ev.title}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Main layout */}
      <div className="cal-layout" style={s.layout}>

        {/* Calendar grid */}
        <div style={s.gridWrap}>
          {/* Day headers */}
          <div style={s.dayHeaders}>
            {DAYS_FR.map(d => (
              <div key={d} style={s.dayHeader}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={s.grid}>
            {cells.map(({ date, day, inMonth }) => {
              const isToday    = date === TODAY
              const isSel      = date === selected
              const dayEvents  = byDate[date]
              const allEvts    = [
                ...(dayEvents?.contracts ?? []).map(c => ({ id: c.id, category: c.type, title: c.title })),
                ...(dayEvents?.custom ?? []).map(e => ({ id: e.id, category: e.category, title: e.title })),
              ]
              const visible    = allEvts.slice(0, 2)
              const extra      = allEvts.length - visible.length
              const isWeekend  = (() => { const dow = new Date(date).getDay(); return dow === 0 || dow === 6 })()

              return (
                <div
                  key={date}
                  className={`cal-cell${isSel ? ' cal-cell-sel' : ''}`}
                  onClick={() => setSelected(date)}
                  style={{
                    ...s.cell,
                    opacity: inMonth ? 1 : 0.28,
                    background: isSel
                      ? 'var(--surface)'
                      : isWeekend && inMonth
                        ? 'rgba(255,255,255,0.015)'
                        : 'var(--bg)',
                    outline: isSel
                      ? '1.5px solid var(--border-2)'
                      : isToday && inMonth
                        ? '1.5px solid var(--accent-text)'
                        : '1.5px solid transparent',
                  }}
                >
                  <div style={s.cellTop}>
                    {isToday && inMonth
                      ? <span className="today-num">{day}</span>
                      : <span style={{ ...s.dayNum, color: isWeekend && inMonth ? 'var(--text-muted)' : 'var(--text-2)' }}>{day}</span>
                    }
                    {allEvts.length > 0 && (
                      <span style={s.dotRow}>
                        {allEvts.slice(0, 3).map((e, i) => (
                          <span key={i} style={{
                            ...s.dot,
                            background: CAT[e.category as CatKey]?.color ?? CAT.note.color,
                          }} />
                        ))}
                        {allEvts.length > 3 && <span style={{ ...s.dot, background: 'var(--text-muted)' }} />}
                      </span>
                    )}
                  </div>
                  <div style={s.pillWrap}>
                    {visible.map(e => {
                      const c = CAT[e.category as CatKey] ?? CAT.note
                      return (
                        <div key={e.id} style={{ ...s.pill, borderLeftColor: c.color, background: c.bg }}>
                          <span style={s.pillText}>{e.title}</span>
                        </div>
                      )
                    })}
                    {extra > 0 && (
                      <span style={s.extraChip}>+{extra}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Side panel */}
        <div className="cal-side" style={s.side}>
          {/* Day header */}
          <div style={s.sideHead}>
            <div style={s.sideHeadLeft}>
              <div style={s.sideDow}>{capitalize(formatDayLong(selected).split(' ')[0])}</div>
              <div style={s.sideDate}>{formatDayLong(selected).split(' ').slice(1).join(' ')}</div>
            </div>
            {!showForm && (
              <button onClick={openAdd} style={s.addDayBtn} className="icon-btn" title="Ajouter">
                <Plus size={15} weight="bold" />
              </button>
            )}
            {showForm && (
              <button onClick={cancelForm} style={s.addDayBtn} className="icon-btn" title="Fermer">
                <X size={15} />
              </button>
            )}
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

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Clock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="time"
                  value={fStart}
                  onChange={e => setFStart(e.target.value)}
                  className="input-field"
                  style={s.fTime}
                />
                <ArrowRight size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <input
                  type="time"
                  value={fEnd}
                  onChange={e => setFEnd(e.target.value)}
                  className="input-field"
                  style={s.fTime}
                />
              </div>

              <div style={s.catRow}>
                {(Object.entries(CAT) as [CatKey, (typeof CAT)[CatKey]][]).map(([key, cfg]) => (
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
                ))}
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
                <button className="btn-ghost" onClick={cancelForm} style={s.fCancel}>
                  Annuler
                </button>
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

          {/* ── Events list */}
          {!showForm && (
            <div style={s.evtList}>
              {selectedAll.length === 0 ? (
                <div style={s.emptyState}>
                  <CalendarBlank size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 12px' }}>
                    Aucun événement ce jour
                  </p>
                  <button className="btn-ghost" onClick={openAdd} style={{ fontSize: '13px', padding: '7px 16px' }}>
                    + Ajouter
                  </button>
                </div>
              ) : (
                selectedAll.map((ev: any) => {
                  const cat = CAT[ev.category as CatKey] ?? CAT.note
                  const isContract = !!ev.isContract
                  return (
                    <div
                      key={ev.id}
                      className="evt-row"
                      style={{
                        ...s.evtCard,
                        borderLeft: `3px solid ${cat.color}`,
                      }}
                    >
                      <div style={s.evtCardTop}>
                        <span style={s.evtTitle}>{ev.title}</span>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          {isContract && (
                            <span style={{ ...s.autoBadge, color: cat.color, background: cat.bg }}>AUTO</span>
                          )}
                          {!isContract && (
                            <>
                              <button
                                className="icon-btn"
                                onClick={() => openEdit(ev as CalEvent)}
                                style={s.iconBtn}
                                title="Modifier"
                              >
                                <PencilSimple size={12} />
                              </button>
                              <button
                                className="icon-btn"
                                onClick={() => handleDelete(ev.id)}
                                style={{ ...s.iconBtn, color: 'var(--error, #f87171)' }}
                                title="Supprimer"
                              >
                                <Trash size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
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
        </div>
      </div>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    padding: '20px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
  },

  // top bar
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  monthNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
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
    width: '34px',
    height: '34px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
  },

  // upcoming strip
  strip: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    padding: '0',
  },
  stripChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '100px',
    border: '1px solid',
    background: 'var(--surface)',
    cursor: 'pointer',
    textDecoration: 'none',
    maxWidth: '200px',
    overflow: 'hidden',
    transition: 'all 0.12s',
  },

  // layout
  layout: {
    display: 'flex',
    gap: '0',
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
    minHeight: '560px',
  },

  // grid
  gridWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  dayHeaders: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid var(--border)',
  },
  dayHeader: {
    padding: '10px 8px',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0',
  },
  cell: {
    minHeight: '92px',
    padding: '8px',
    borderRight: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    outlineOffset: '-1px',
  },
  cellTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2px',
  },
  dayNum: {
    fontSize: '13px',
    fontWeight: 500,
    lineHeight: 1,
  },
  dotRow: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  pillWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 6px 2px 5px',
    borderRadius: '4px',
    borderLeft: '2.5px solid',
    overflow: 'hidden',
  },
  pillText: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  extraChip: {
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    padding: '1px 4px',
  },

  // side panel
  side: {
    width: '290px',
    flexShrink: 0,
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  sideHead: {
    padding: '18px 18px 14px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
    position: 'sticky',
    top: 0,
    background: 'var(--card-bg)',
    zIndex: 1,
  },
  sideHeadLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  sideDow: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text)',
    fontFamily: 'Fraunces, serif',
    textTransform: 'capitalize',
    letterSpacing: '-0.2px',
  },
  sideDate: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    textTransform: 'capitalize',
  },
  addDayBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: '1px solid var(--border-2)',
    background: 'var(--surface)',
    color: 'var(--text-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },

  // form
  form: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderBottom: '1px solid var(--border)',
  },
  fInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '10px',
  },
  fTime: {
    flex: 1,
    padding: '8px 10px',
    fontSize: '13px',
    borderRadius: '8px',
  },
  catRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  catChip: {
    padding: '4px 11px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  fTextarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '13px',
    borderRadius: '10px',
    resize: 'vertical',
    minHeight: '72px',
  },
  fCancel: {
    padding: '8px 14px',
    fontSize: '13px',
  },
  fSave: {
    padding: '8px 18px',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '9px',
  },

  // events
  evtList: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  evtCard: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  evtCardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  evtTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text)',
    lineHeight: 1.35,
  },
  evtTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  catLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  evtDesc: {
    fontSize: '12px',
    color: 'var(--text-2)',
    margin: '2px 0 0',
    lineHeight: 1.5,
  },
  autoBadge: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    padding: '2px 7px',
    borderRadius: '100px',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  iconBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '7px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '32px 16px',
    textAlign: 'center',
  },
}
