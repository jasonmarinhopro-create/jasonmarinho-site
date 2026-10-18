'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CalendarBlank, CaretDown, CaretLeft, CaretRight, Clock } from '@phosphor-icons/react/dist/ssr'

// Calendrier maison de l'app (choix de Jason : « l'agenda du navigateur est à bannir »).
// Un seul composant pour toute l'app, jamais le champ date du navigateur. Le site statique
// a le même, dans /calendrier.js. Jours, mois et années : un clic sur le titre passe
// du mois aux mois puis aux années (dates de naissance). Langue : `locale`.

const fmtIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parseIso = (v?: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T12:00:00') : null)
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

const LABELS: Record<string, { today: string; clear: string; prev: string; next: string }> = {
  fr: { today: 'Aujourd’hui', clear: 'Effacer', prev: 'Précédent', next: 'Suivant' },
  en: { today: 'Today', clear: 'Clear', prev: 'Previous', next: 'Next' },
  es: { today: 'Hoy', clear: 'Borrar', prev: 'Anterior', next: 'Siguiente' },
  pt: { today: 'Hoje', clear: 'Limpar', prev: 'Anterior', next: 'Seguinte' },
  de: { today: 'Heute', clear: 'Löschen', prev: 'Zurück', next: 'Weiter' },
}

function clamp(val: number, min: number, max: number) { return Math.max(min, Math.min(max, val)) }

type View = 'days' | 'months' | 'years'

export function CalendarInput({
  value,
  onChange,
  placeholder = 'Choisir une date',
  disabled = false,
  min,
  max,
  locale = 'fr',
  birth = false,
  invalid = false,
  ariaLabel,
  style,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  /** Bornes AAAA-MM-JJ (jours hors bornes grisés) */
  min?: string
  max?: string
  /** fr, en, es, pt, de (noms des mois et des jours) */
  locale?: string
  /** Date de naissance : s'ouvre sur les années, jamais après aujourd'hui */
  birth?: boolean
  invalid?: boolean
  ariaLabel?: string
  /** Surcharge du style du bouton (taille, fond) */
  style?: React.CSSProperties
}) {
  const [open, setOpen]         = useState(false)
  const [view, setView]         = useState<View>('days')
  const [pos, setPos]           = useState<{ top: number; left: number; width: number } | null>(null)
  const [viewDate, setViewDate] = useState(() => parseIso(value) ?? (birth ? new Date(1990, 0, 1) : new Date()))
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef   = useRef<HTMLDivElement>(null)
  const loc = LABELS[locale] ? locale : 'fr'
  const L = LABELS[loc]
  const maxIso = max ?? (birth ? fmtIso(new Date()) : undefined)

  useEffect(() => { const d = parseIso(value); if (d) setViewDate(d) }, [value])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent | TouchEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current   && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    function onScroll(e: Event) { if (popupRef.current && popupRef.current.contains(e.target as Node)) return; setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  function handleOpen() {
    if (disabled) return
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const W = Math.min(Math.max(rect.width, 296), window.innerWidth - 24)
      const H = 360
      let top  = rect.bottom + 6
      let left = rect.left
      if (left + W > window.innerWidth  - 12) left = clamp(window.innerWidth  - W - 12, 12, window.innerWidth)
      if (top  + H > window.innerHeight - 12) top  = Math.max(12, rect.top - H - 6)
      setPos({ top, left, width: W })
      setView(birth && !value ? 'years' : 'days')
    }
    setOpen(o => !o)
  }

  const year      = viewDate.getFullYear()
  const month     = viewDate.getMonth()
  const daysInMo  = new Date(year, month + 1, 0).getDate()
  const firstDay  = (new Date(year, month, 1).getDay() + 6) % 7
  const selDate   = parseIso(value)
  const today     = new Date(); today.setHours(0,0,0,0)
  const todayIso  = fmtIso(today)
  const display   = selDate
    ? selDate.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
    : placeholder
  const monthNames = Array.from({ length: 12 }, (_, i) => cap(new Date(2026, i, 1).toLocaleDateString(loc, { month: 'long' })))
  const monthShort = Array.from({ length: 12 }, (_, i) => cap(new Date(2026, i, 1).toLocaleDateString(loc, { month: 'short' })))
  const dayNames   = Array.from({ length: 7 }, (_, i) => cap(new Date(2026, 0, 5 + i).toLocaleDateString(loc, { weekday: 'short' }).replace('.', '').slice(0, 2)))
  const out = (iso: string) => (min && iso < min) || (maxIso && iso > maxIso)
  const decade = Math.floor(year / 12) * 12

  function pick(iso: string) {
    if (out(iso)) return
    onChange(iso)
    setOpen(false)
    triggerRef.current?.focus()
  }
  function shift(n: number) {
    if (view === 'days') setViewDate(new Date(year, month + n, 1))
    else if (view === 'months') setViewDate(new Date(year + n, month, 1))
    else setViewDate(new Date(year + 12 * n, month, 1))
  }
  const title = view === 'days' ? `${monthNames[month]} ${year}` : view === 'months' ? String(year) : `${decade} – ${decade + 11}`

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-label={ariaLabel ? `${ariaLabel} : ${selDate ? display : placeholder}` : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          background: 'var(--surface)',
          border: `1px solid ${invalid ? 'var(--danger, #c0392b)' : open ? 'var(--accent-border-2)' : 'var(--border)'}`,
          borderRadius: '10px', padding: '10px 12px',
          fontSize: '13px', color: selDate ? 'var(--text)' : 'var(--text-muted)',
          cursor: disabled ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}
      >
        <CalendarBlank size={15} color="var(--accent-text)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</span>
        {!disabled && <CaretDown size={12} color="var(--text-muted)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />}
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          role="dialog"
          aria-label={ariaLabel ?? placeholder}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
            width: pos.width,
            background: 'var(--bg-2)',
            border: '1px solid var(--border-2)',
            borderRadius: '16px', padding: '14px 14px 10px',
            boxShadow: 'var(--card-shadow, 0 20px 60px rgba(0,0,0,0.7))',
            fontFamily: 'inherit',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: '10px' }}>
            <button type="button" aria-label={L.prev} onClick={() => shift(-1)} style={navBtn}><CaretLeft size={14} weight="bold" /></button>
            <button type="button" onClick={() => setView(v => (v === 'days' ? 'months' : v === 'months' ? 'years' : 'days'))}
              style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {title}<CaretDown size={11} weight="bold" color="var(--text-muted)" />
            </button>
            <button type="button" aria-label={L.next} onClick={() => shift(1)} style={navBtn}><CaretRight size={14} weight="bold" /></button>
          </div>

          {view === 'days' && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
              {dayNames.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', padding: '3px 0', letterSpacing: '0.5px' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ height: '34px' }} />)}
              {Array.from({ length: daysInMo }).map((_, i) => {
                const day  = i + 1
                const iso  = fmtIso(new Date(year, month, day))
                const isSel = value === iso
                const isToday2 = iso === todayIso
                const off = !!out(iso)
                return (
                  <button key={day} type="button" disabled={off} onClick={() => pick(iso)} aria-pressed={isSel} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '34px', borderRadius: '8px', border: 'none', fontFamily: 'inherit',
                    fontSize: '13px', fontWeight: isSel || isToday2 ? 700 : 400,
                    background: isSel ? 'var(--accent-bg-2)' : isToday2 ? 'var(--surface-2)' : 'transparent',
                    color: off ? 'var(--text-muted)' : isSel ? 'var(--accent-text)' : isToday2 ? 'var(--success)' : 'var(--text-2)',
                    opacity: off ? 0.35 : 1,
                    cursor: off ? 'default' : 'pointer',
                    outline: isSel ? '1.5px solid var(--accent-border-2)' : 'none',
                    transition: 'background 0.1s',
                  }}>{day}</button>
                )
              })}
            </div>
          </>)}

          {view === 'months' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {monthNames.map((m, i) => {
                const on = selDate && selDate.getFullYear() === year && selDate.getMonth() === i
                return <button key={m} type="button" onClick={() => { setViewDate(new Date(year, i, 1)); setView('days') }} style={cell(!!on)}>{monthShort[i]}</button>
              })}
            </div>
          )}

          {view === 'years' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {Array.from({ length: 12 }, (_, i) => decade + i).map(y => {
                const on = selDate?.getFullYear() === y
                const off = (maxIso && `${y}-01-01` > maxIso) || (min && `${y}-12-31` < min)
                return <button key={y} type="button" disabled={!!off} onClick={() => { setViewDate(new Date(y, month, 1)); setView('months') }} style={{ ...cell(!!on), opacity: off ? 0.35 : 1 }}>{y}</button>
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            {!birth && !out(todayIso)
              ? <button type="button" onClick={() => pick(todayIso)} style={linkBtn}>{L.today}</button>
              : <span />}
            {value ? <button type="button" onClick={() => { onChange(''); setOpen(false) }} style={{ ...linkBtn, color: 'var(--text-muted)' }}>{L.clear}</button> : <span />}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const cell = (on: boolean): React.CSSProperties => ({
  height: 42, borderRadius: 10, border: 'none', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
  fontWeight: on ? 700 : 500,
  background: on ? 'var(--accent-bg-2)' : 'var(--surface)',
  color: on ? 'var(--accent-text)' : 'var(--text-2)',
  outline: on ? '1.5px solid var(--accent-border-2)' : 'none',
})

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
  color: 'var(--accent-text)', cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = 'Heure',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef   = useRef<HTMLDivElement>(null)

  const times: string[] = []
  for (let h = 6; h <= 23; h++) {
    times.push(`${String(h).padStart(2,'0')}:00`)
    if (h < 23) times.push(`${String(h).padStart(2,'0')}:30`)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current   && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const W = Math.max(rect.width, 220)
      const H = 260
      let top  = rect.bottom + 6
      let left = rect.left
      if (left + W > window.innerWidth  - 12) left = clamp(window.innerWidth  - W - 12, 0, window.innerWidth)
      if (top  + H > window.innerHeight - 12) top  = rect.top - H - 6
      setPos({ top, left, width: W })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          background: 'var(--surface)',
          border: `1px solid ${open ? 'var(--accent-border-2)' : 'var(--border)'}`,
          borderRadius: '10px', padding: '9px 12px',
          fontSize: '13px', color: value ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
      >
        <Clock size={15} color="var(--accent-text)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{value || placeholder}</span>
        <CaretDown size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
            width: pos.width,
            background: 'var(--bg-2)',
            border: '1px solid var(--border-2)',
            borderRadius: '16px', padding: '12px',
            boxShadow: 'var(--card-shadow, 0 20px 60px rgba(0,0,0,0.7))',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
            {times.map(t => (
              <button key={t} type="button" onClick={() => { onChange(t); setOpen(false) }} style={{
                padding: '8px 4px', borderRadius: '8px', border: 'none',
                fontSize: '13px', fontWeight: value === t ? 700 : 400,
                background: value === t ? 'var(--accent-bg-2)' : 'transparent',
                color: value === t ? 'var(--accent-text)' : 'var(--text-2)',
                cursor: 'pointer',
                outline: value === t ? '1.5px solid var(--accent-border-2)' : 'none',
                transition: 'background 0.1s',
              }}>{t}</button>
            ))}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} style={{
              width: '100%', marginTop: '6px', padding: '5px',
              borderRadius: '6px', fontSize: '11px',
              color: 'var(--text-muted)', background: 'transparent',
              border: 'none', cursor: 'pointer',
              borderTop: '1px solid var(--border)', paddingTop: '6px',
            }}>
              Effacer
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

const navBtn: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '50%', color: 'var(--text-2)', fontSize: '18px',
  width: '32px', height: '32px', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', lineHeight: '1',
}
