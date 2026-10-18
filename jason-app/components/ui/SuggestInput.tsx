'use client'

// Champ avec liste de suggestions (18/10/2026, Jason : « ce petit panneau noir,
// je ne peux plus le voir », propositions B + D choisies). Remplace <datalist>,
// que Chrome dessine en noir et qu'on ne peut pas styler.
// - ordinateur : liste sous le champ (repère de lieu, région, « Page dédiée »
//   pour les villes, lettres tapées soulignées, flèches / Entrée / Échap,
//   « Utiliser « … » ») ;
// - téléphone (≤ 640 px) : feuille plein écran avec sa propre recherche.
// Même composant que suggestions.js du site : les faire évoluer ensemble.
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CITY_REGIONS } from '@/lib/ui/suggest-regions'
import { suggestList, cityKey, matchParts } from '@/lib/ui/suggest'

const PHONE = '(max-width: 640px)'

export default function SuggestInput({
  value, onChange, options, kind = 'plain', style, placeholder, id, ariaLabel, strict, required, maxLength,
  onKeyDown, onBlur, onPick,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  /** « ville » : repères de lieu, région et « Page dédiée » */
  kind?: 'ville' | 'plain'
  style?: React.CSSProperties
  placeholder?: string
  id?: string
  ariaLabel?: string
  /** Pas de ligne « Utiliser « … » » */
  strict?: boolean
  required?: boolean
  maxLength?: number
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  /** Appelé quand une suggestion est choisie (après onChange) */
  onPick?: (v: string) => void
}) {
  const listId = useId().replace(/:/g, '')
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [active, setActive] = useState(-1)
  const [rect, setRect] = useState<{ left: number; top?: number; bottom?: number; width: number; maxH: number } | null>(null)
  const city = kind === 'ville'

  const res = useMemo(() => suggestList(options, value, { city, strict, max: 8 }), [options, value, city, strict])
  const count = res.items.length + (res.free !== null ? 1 : 0)

  const isPhone = () => typeof window !== 'undefined' && window.matchMedia(PHONE).matches

  const place = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const b = el.getBoundingClientRect()
    const below = window.innerHeight - b.bottom
    const w = Math.min(Math.max(b.width, city ? 360 : 240), window.innerWidth - 16)
    const left = Math.max(8, Math.min(b.left, window.innerWidth - w - 8))
    if (below < 240 && b.top > below) setRect({ left, bottom: window.innerHeight - b.top + 8, width: w, maxH: Math.min(340, b.top - 16) })
    else setRect({ left, top: b.bottom + 8, width: w, maxH: Math.min(340, below - 16) })
  }, [city])

  useLayoutEffect(() => {
    if (!open) return
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
  }, [open, place])

  function pick(i: number) {
    const v = i < res.items.length ? res.items[i] : res.free
    setOpen(false)
    setActive(-1)
    if (v != null) { onChange(v); onPick?.(v) }
  }

  const showPop = open && (count > 0 || !!res.heading)

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        value={value}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPop}
        aria-controls={listId}
        aria-activedescendant={showPop && active >= 0 ? `${listId}-${active}` : undefined}
        style={style}
        onFocus={() => {
          if (isPhone()) { inputRef.current?.blur(); setSheet(true); return }
          setOpen(true); setActive(-1)
        }}
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(city && e.target.value.trim() ? 0 : -1) }}
        onBlur={e => { setTimeout(() => setOpen(false), 120); onBlur?.(e) }}
        onKeyDown={e => {
          if (showPop) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, count - 1)); return }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); return }
            if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); return }
            if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return }
            if (e.key === 'Tab') setOpen(false)
          } else if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); return }
          onKeyDown?.(e)
        }}
      />
      {showPop && rect && typeof document !== 'undefined' && createPortal(
        <div
          id={listId}
          role="listbox"
          onMouseDown={e => e.preventDefault()}
          style={{ ...ui.pop, left: rect.left, top: rect.top, bottom: rect.bottom, width: rect.width, maxHeight: rect.maxH }}
        >
          {res.heading && <div style={ui.head}>{res.heading}</div>}
          {res.items.map((v, i) => (
            <Row key={v} id={`${listId}-${i}`} v={v} q={value} city={city} on={i === active}
              onHover={() => setActive(i)} onPick={() => pick(i)} />
          ))}
          {res.free !== null && (
            <div id={`${listId}-${res.items.length}`} role="option" aria-selected={active === res.items.length}
              onMouseMove={() => setActive(res.items.length)} onMouseDown={() => pick(res.items.length)}
              style={{ ...ui.free, background: active === res.items.length ? '#F4F1E9' : 'transparent' }}>
              <span style={{ ...ui.pin, background: 'transparent', border: '1.5px dashed #C9C2B2', color: '#5E6B5B' }}><PlusIcon /></span>
              <span>Utiliser « <strong>{res.free}</strong> »</span>
            </div>
          )}
        </div>,
        document.body,
      )}
      {sheet && typeof document !== 'undefined' && createPortal(
        <Sheet
          title={ariaLabel ?? placeholder ?? 'Choisir'}
          placeholder={placeholder}
          initial={value}
          options={options}
          city={city}
          strict={strict}
          onClose={() => setSheet(false)}
          onPick={v => { setSheet(false); onChange(v); onPick?.(v) }}
        />,
        document.body,
      )}
    </>
  )
}

function Row({ id, v, q, city, on, onHover, onPick }: { id: string; v: string; q: string; city: boolean; on: boolean; onHover: () => void; onPick: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (on) ref.current?.scrollIntoView({ block: 'nearest' }) }, [on])
  const region = city ? CITY_REGIONS[cityKey(v)] : undefined
  const [pre, mid, post] = matchParts(v, q)
  return (
    <div ref={ref} id={id} role="option" aria-selected={on} onMouseMove={onHover} onMouseDown={onPick}
      style={{ ...ui.row, minHeight: city ? 48 : 40, background: on ? '#F4F1E9' : 'transparent' }}>
      {city && <span style={ui.pin}><PinIcon /></span>}
      <span style={ui.text}>
        <span style={ui.name}>{pre}{mid && <span style={ui.mid}>{mid}</span>}{post}</span>
        {region && <span style={ui.region}>{region}</span>}
      </span>
      {region && <span style={ui.badge}>Page dédiée</span>}
    </div>
  )
}

function Sheet({ title, placeholder, initial, options, city, strict, onClose, onPick }: {
  title: string; placeholder?: string; initial: string; options: string[]; city: boolean; strict?: boolean
  onClose: () => void; onPick: (v: string) => void
}) {
  const [q, setQ] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  const openedAt = useRef(Date.now())
  const res = useMemo(() => suggestList(options, q, { city, strict, max: 30 }), [options, q, city, strict])
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    const t = setTimeout(() => ref.current?.focus(), 30)
    return () => { html.style.overflow = prev; clearTimeout(t) }
  }, [])
  return (
    <>
      {/* Le « clic » du toucher qui a ouvert la feuille arrive après : pas de fermeture tout de suite */}
      <div onClick={() => { if (Date.now() - openedAt.current > 450) onClose() }} style={ui.veil} />
      <div role="dialog" aria-modal="true" aria-label={title} style={ui.sheet}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}><span style={ui.grab} /></div>
        <div style={ui.top}>
          <label style={ui.box}>
            <SearchIcon />
            <input ref={ref} value={q} onChange={e => setQ(e.target.value)} autoComplete="off" enterKeyHint="done"
              aria-label={title} placeholder={placeholder ?? 'Rechercher'}
              onKeyDown={e => {
                if (e.key === 'Escape') onClose()
                if (e.key === 'Enter') { e.preventDefault(); const t = q.trim(); if (t) onPick(res.items.find(v => v.toLowerCase() === t.toLowerCase()) ?? t) }
              }}
              style={ui.sheetInput} />
          </label>
          <button type="button" onClick={onClose} style={ui.cancel}>Annuler</button>
        </div>
        <div role="listbox" style={ui.list}>
          {res.heading && <div style={ui.head}>{res.heading}</div>}
          {res.items.map(v => {
            const region = city ? CITY_REGIONS[cityKey(v)] : undefined
            const [pre, mid, post] = matchParts(v, q)
            return (
              <button key={v} type="button" role="option" aria-selected={false} onClick={() => onPick(v)} style={ui.sheetRow}>
                {city && <span style={{ ...ui.pin, borderRadius: '50%', width: 36, height: 36 }}><PinIcon /></span>}
                <span style={ui.text}>
                  <span style={{ ...ui.name, fontSize: 16 }}>{pre}{mid && <span style={{ color: '#004C3F' }}>{mid}</span>}{post}</span>
                  {region && <span style={ui.region}>{region}</span>}
                </span>
                {region && <span style={ui.badge}>Page dédiée</span>}
              </button>
            )
          })}
          {res.free !== null && (
            <button type="button" onClick={() => onPick(res.free!)} style={ui.sheetFree}>Utiliser « <strong>{res.free}</strong> »</button>
          )}
        </div>
      </div>
    </>
  )
}

const PinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>

// Couleurs fixes (comme le site) : la liste reste lisible en thème sombre aussi
const ui: Record<string, React.CSSProperties> = {
  pop: { position: 'fixed', zIndex: 9990, padding: 8, background: '#FFFFFF', border: '1px solid #E7E2D6', borderRadius: 16, boxShadow: '0 18px 44px rgba(0,40,30,.15), 0 2px 6px rgba(0,40,30,.06)', overflow: 'auto', overscrollBehavior: 'contain', boxSizing: 'border-box', color: '#0F1A0D', fontFamily: 'inherit' },
  head: { padding: '6px 10px 8px', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#6B7568' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 10px', borderRadius: 11, cursor: 'pointer' },
  pin: { width: 34, height: 34, borderRadius: 10, background: '#EEF4F1', color: '#004C3F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' },
  name: { fontSize: 15, fontWeight: 600, color: '#22311F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  mid: { color: '#004C3F', textDecoration: 'underline', textDecorationColor: '#FFD56B', textDecorationThickness: 3, textUnderlineOffset: 3 },
  region: { fontSize: 12.5, color: '#6B7568' },
  badge: { fontSize: 11.5, fontWeight: 600, color: '#004C3F', background: '#EEF4F1', borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' },
  free: { display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, marginTop: 4, padding: '6px 10px', borderTop: '1px dashed #E1DCD0', cursor: 'pointer', fontSize: 14.5, color: '#22311F' },
  veil: { position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(15,26,13,.35)' },
  sheet: { position: 'fixed', left: 0, right: 0, bottom: 0, top: 28, zIndex: 9991, background: '#FFFFFF', borderRadius: '22px 22px 0 0', boxShadow: '0 -10px 40px rgba(0,40,30,.18)', display: 'flex', flexDirection: 'column', color: '#0F1A0D', fontFamily: 'inherit' },
  grab: { width: 40, height: 5, borderRadius: 3, background: '#DDD7CA' },
  top: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 12px', borderBottom: '1px solid #EFEBE2' },
  box: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 14px', borderRadius: 12, background: '#F4F1E9', color: '#5E6B5B' },
  sheetInput: { flex: 1, minWidth: 0, border: 'none', background: 'transparent', font: 'inherit', fontSize: 16, color: '#0F1A0D', padding: 0, outline: 'none' },
  cancel: { height: 44, padding: '0 6px', border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: '#004C3F', cursor: 'pointer' },
  list: { flex: 1, overflow: 'auto', padding: '8px 8px 32px', overscrollBehavior: 'contain' },
  sheetRow: { width: '100%', display: 'flex', alignItems: 'center', gap: 14, minHeight: 58, padding: '6px 12px', border: 'none', borderBottom: '1px solid #F2EFE8', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' },
  sheetFree: { width: '100%', minHeight: 54, marginTop: 10, border: '1.5px dashed #C9C2B2', borderRadius: 12, background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: '#22311F', cursor: 'pointer' },
}
