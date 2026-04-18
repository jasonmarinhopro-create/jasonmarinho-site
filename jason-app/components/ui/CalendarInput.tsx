'use client'

import { useState, useEffect, useRef } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'

const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

export function CalendarInput({
  value,
  onChange,
  placeholder = 'Choisir une date',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T12:00:00') : new Date())
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { if (value) setViewDate(new Date(value + 'T12:00:00')) }, [value])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current  && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPopupPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 280) })
    }
    setOpen(o => !o)
  }

  const year      = viewDate.getFullYear()
  const month     = viewDate.getMonth()
  const daysInMo  = new Date(year, month + 1, 0).getDate()
  const firstDay  = (new Date(year, month, 1).getDay() + 6) % 7
  const monthName = viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const selDate   = value ? new Date(value + 'T12:00:00') : null
  const display   = selDate
    ? selDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : placeholder

  function selectDay(day: number) {
    const d = new Date(year, month, day)
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    setOpen(false)
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
          border: `1px solid ${open ? '#4a7260' : 'var(--border)'}`,
          borderRadius: '10px', padding: '10px 12px',
          fontSize: '14px', color: selDate ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
      >
        <CalendarBlank size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{display}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>▼</span>
      </button>

      {open && popupPos && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed', top: popupPos.top, left: popupPos.left,
            zIndex: 9999, minWidth: popupPos.width,
            background: 'var(--bg-2, #0f2018)',
            border: '1px solid #2a5040',
            borderRadius: '16px', padding: '14px 14px 10px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={navBtn}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{monthName}</span>
            <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={navBtn}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '2px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#4a7260', padding: '3px 0', letterSpacing: '0.5px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ height: '34px' }} />)}
            {Array.from({ length: daysInMo }).map((_, i) => {
              const day = i + 1
              const d = new Date(year, month, day); d.setHours(0, 0, 0, 0)
              const isSel    = selDate ? d.getTime() === selDate.getTime() : false
              const isToday2 = d.getTime() === today.getTime()
              return (
                <button key={day} type="button" onClick={() => selectDay(day)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '34px', borderRadius: '8px', border: 'none',
                  fontSize: '13px', fontWeight: isSel ? 700 : 400,
                  background: isSel ? 'rgba(255,213,107,0.18)' : isToday2 ? 'rgba(52,211,153,0.1)' : 'transparent',
                  color: isSel ? '#FFD56B' : isToday2 ? '#34D399' : '#a5c4b0',
                  cursor: 'pointer',
                  outline: isSel ? '1.5px solid rgba(255,213,107,0.45)' : 'none',
                  transition: 'background 0.1s',
                }}>{day}</button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = 'Choisir une heure',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef   = useRef<HTMLDivElement>(null)

  const times: string[] = []
  for (let h = 6; h <= 23; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 23) times.push(`${String(h).padStart(2, '0')}:30`)
  }

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current  && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPopupPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 220) })
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
          border: `1px solid ${open ? '#4a7260' : 'var(--border)'}`,
          borderRadius: '10px', padding: '10px 12px',
          fontSize: '14px', color: value ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0 }}>⏰</span>
        <span style={{ flex: 1 }}>{value || placeholder}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>▼</span>
      </button>

      {open && popupPos && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed', top: popupPos.top, left: popupPos.left,
            zIndex: 9999, width: popupPos.width,
            background: 'var(--bg-2, #0f2018)',
            border: '1px solid #2a5040',
            borderRadius: '16px', padding: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
            {times.map(t => (
              <button key={t} type="button" onClick={() => { onChange(t); setOpen(false) }} style={{
                padding: '8px 4px', borderRadius: '8px', border: 'none',
                fontSize: '13px', fontWeight: value === t ? 700 : 400,
                background: value === t ? 'rgba(255,213,107,0.18)' : 'transparent',
                color: value === t ? '#FFD56B' : '#a5c4b0',
                cursor: 'pointer',
                outline: value === t ? '1.5px solid rgba(255,213,107,0.45)' : 'none',
                transition: 'background 0.1s',
              }}>{t}</button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

const navBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid #1e3d2f',
  borderRadius: '8px', color: '#a5c4b0', fontSize: '18px',
  width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', lineHeight: '1',
}
