'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Question } from '@phosphor-icons/react/dist/ssr'

interface Props {
  content: string
  /** Optionnel : lien vers un article d'aide complet */
  helpHref?: string
  /** Taille de l'icône en px (défaut 13) */
  size?: number
  /** Décalage du tooltip vs trigger */
  side?: 'top' | 'bottom'
}

/**
 * Petit icône `?` qui affiche un tooltip au hover/click.
 * À placer à côté d'un label pour expliquer un concept (TOM, RevPAR, micro-BIC…).
 */
export function HelpTooltip({ content, helpHref, size = 13, side = 'bottom' }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const W = 280
      let left = rect.left + rect.width / 2 - W / 2
      if (left < 12) left = 12
      if (left + W > window.innerWidth - 12) left = window.innerWidth - W - 12
      const top = side === 'top'
        ? rect.top - 8
        : rect.bottom + 8
      setPos({ top, left })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        style={{ ...s.trigger, width: `${size + 6}px`, height: `${size + 6}px` }}
        aria-label="Aide"
        title="Aide"
      >
        <Question size={size} weight="regular" />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popupRef}
          style={{
            ...s.popup,
            top: pos.top,
            left: pos.left,
            transform: side === 'top' ? 'translateY(-100%)' : 'none',
          }}
        >
          <div style={s.popupContent}>{content}</div>
          {helpHref && (
            <a href={helpHref} style={s.popupLink}>
              En savoir plus →
            </a>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-3)',
    cursor: 'help',
    borderRadius: '50%',
    padding: 0,
    flexShrink: 0,
    transition: 'color 0.15s, background 0.15s',
  },
  popup: {
    position: 'fixed',
    width: '280px',
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '12px',
    padding: '12px 14px',
    zIndex: 9999,
    boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
  },
  popupContent: {
    fontSize: '12.5px',
    fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.55,
  },
  popupLink: {
    display: 'inline-block',
    fontSize: '11.5px',
    fontWeight: 500,
    color: 'var(--accent-text)',
    textDecoration: 'none',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border)',
  },
}
