'use client'

import { useEffect, useRef, useState } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react/dist/ssr'

/**
 * <Select> — dropdown reutilisable aligne sur le design system dashboard.
 *
 * Pourquoi pas un <select> HTML natif ?
 *   Les options d'un select natif sont rendues par le navigateur et
 *   ignorent tout CSS custom (fond, texte, hover). Sur un dashboard dark
 *   theme, ça donne des dropdowns illisibles (texte gris sur fond gris).
 *
 * Ce composant garantit une coherence visuelle a chaque nouveau champ :
 *   - Trigger : meme background/border que les inputs (var(--surface))
 *   - Panel : var(--bg-2) + border-2 + shadow (comme les user menu / property selector)
 *   - Option hover : accent-bg subtil
 *   - Selected : accent-text + check icon
 *   - Fermeture au clic externe + touche Escape
 *
 * A UTILISER PARTOUT en remplacement des <select> natifs.
 */
export interface SelectOption<T extends string = string> {
  value: T
  label: string
  /** Petit indicateur visuel a gauche de l'option (couleur point, etc.) */
  hint?: React.ReactNode
}

interface SelectProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  /** Label affiche a la place de la valeur quand aucune n'est active */
  placeholder?: string
  /** Largeur min du trigger (default: fit-content) */
  minWidth?: number | string
  /** Style optionnel pour le trigger (rare, prefere garder le style par defaut) */
  triggerStyle?: React.CSSProperties
  ariaLabel?: string
}

export default function Select<T extends string = string>({
  value, onChange, options, placeholder, minWidth, triggerStyle, ariaLabel,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} style={{ ...s.wrap, minWidth }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={{ ...s.trigger, ...(open ? s.triggerOpen : {}), ...triggerStyle }}
      >
        <span style={s.triggerLabel}>
          {selected?.hint && <span style={s.triggerHint}>{selected.hint}</span>}
          <span style={s.triggerText}>{selected?.label ?? placeholder ?? 'Choisir…'}</span>
        </span>
        <CaretDown size={12} weight="bold" style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={s.panel} role="listbox">
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{ ...s.option, ...(isSelected ? s.optionSelected : {}) }}
              >
                {opt.hint && <span style={s.optionHint}>{opt.hint}</span>}
                <span style={s.optionLabel}>{opt.label}</span>
                {isSelected && <Check size={13} weight="bold" style={{ color: 'var(--accent-text)', marginLeft: 'auto', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { position: 'relative' },
  trigger: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '7px 10px 7px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 9,
    color: 'var(--text-2)',
    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
    cursor: 'pointer',
    minHeight: 34,
    transition: 'background 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap' as const,
  },
  triggerOpen: {
    background: 'var(--accent-bg)',
    borderColor: 'var(--accent-border)',
    color: 'var(--text)',
  },
  triggerLabel: { display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0, overflow: 'hidden' },
  // Libellé long (ex. « DNI / documento de identidad ») : ellipse au lieu de
  // déborder du champ
  triggerText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  triggerHint: { display: 'inline-flex', alignItems: 'center', flexShrink: 0 },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 6px)', left: 0, right: 0,
    minWidth: '100%',
    background: 'var(--bg-2)',
    border: '1px solid var(--border-2)',
    borderRadius: 10,
    padding: 4,
    boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
    zIndex: 100,
    maxHeight: 320,
    overflowY: 'auto' as const,
  },
  option: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%',
    padding: '8px 10px',
    background: 'none',
    border: '1px solid transparent',
    borderRadius: 7,
    color: 'var(--text-2)',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 400,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background 0.12s, color 0.12s',
  },
  optionSelected: {
    background: 'var(--accent-bg)',
    color: 'var(--accent-text)',
    fontWeight: 600,
  },
  optionHint: { display: 'inline-flex', alignItems: 'center', flexShrink: 0 },
  optionLabel: { flex: 1, minWidth: 0, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
}
