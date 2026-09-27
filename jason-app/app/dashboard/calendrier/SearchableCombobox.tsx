'use client'

// Extrait de CalendrierView.tsx (découpage sept. 2026, code inchangé).
// Liste déroulante avec recherche (choix du voyageur, du logement).
import { useState, useRef, useEffect } from 'react'
import { X, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'


export default function SearchableCombobox({
  options, value, onChange, placeholder, autoFocus, allowClear,
}: {
  options: Array<{ id: string; label: string }>
  value: string
  onChange: (id: string) => void
  placeholder: string
  autoFocus?: boolean
  allowClear?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.id === value)
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  function handleTriggerClick() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        onClick={handleTriggerClick}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 12px',
          background: 'var(--bg-2)',
          border: `1.5px solid ${open ? 'var(--accent-text)' : value ? 'var(--accent-border)' : 'var(--border)'}`,
          borderRadius: '10px',
          cursor: 'text',
          minHeight: '40px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? '0 0 0 3px var(--accent-bg-2)' : 'none',
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            autoFocus={autoFocus}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher…"
            style={{
              border: 'none', background: 'transparent', flex: 1,
              outline: 'none', fontSize: '13.5px', color: 'var(--text)',
              fontFamily: 'inherit',
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span style={{ flex: 1, fontSize: '13.5px', color: selected ? 'var(--text)' : 'var(--text-3)' }}>
            {selected?.label ?? placeholder}
          </span>
        )}
        {allowClear && selected && !open && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--text-3)', padding: '2px', display: 'flex', alignItems: 'center',
            }}
            title="Effacer"
            aria-label="Effacer"
          >
            <X size={12} weight="bold" />
          </button>
        )}
        <MagnifyingGlass size={13} weight="bold" style={{ color: open ? 'var(--accent-text)' : 'var(--text-3)', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg)',
          border: '1.5px solid var(--accent-border)',
          borderRadius: '10px',
          zIndex: 1000,
          maxHeight: '220px',
          overflowY: 'auto',
          boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px var(--accent-bg-2)',
          padding: '4px',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-3)' }}>
              Aucun résultat
            </div>
          ) : filtered.map(o => {
            const isSel = value === o.id
            const isHov = hovered === o.id
            return (
              <div
                key={o.id}
                onMouseDown={() => handleSelect(o.id)}
                onMouseEnter={() => setHovered(o.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: '10px 12px',
                  fontSize: '13.5px',
                  color: isSel ? 'var(--accent-text)' : 'var(--text)',
                  background: isSel ? 'var(--accent-bg-2)' : isHov ? 'var(--surface-2)' : 'transparent',
                  cursor: 'pointer',
                  fontWeight: isSel ? 600 : 400,
                  borderRadius: '6px',
                  transition: 'background 0.1s',
                }}
              >
                {o.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
