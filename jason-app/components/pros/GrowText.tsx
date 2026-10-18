'use client'

// Champ de texte des fiches pros qui grandit avec le texte (au téléphone, un
// <input> d'une ligne cachait la fin d'une phrase longue) et compte les
// caractères restants. Pas de retour à la ligne quand `oneLine` : le serveur
// remet tout sur une ligne (lib/pros/fiche-vitrine.ts).
import { useLayoutEffect, useRef } from 'react'

export default function GrowText({ value, onChange, max, style, oneLine = true, minRows = 1, counter = true, ...rest }: {
  value: string
  onChange: (v: string) => void
  max: number
  style: React.CSSProperties
  oneLine?: boolean
  minRows?: number
  counter?: boolean
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'style' | 'maxLength'>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  const left = max - value.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
      <textarea
        ref={ref}
        {...rest}
        rows={minRows}
        value={value}
        maxLength={max}
        autoComplete="off"
        enterKeyHint={oneLine ? 'done' : undefined}
        onKeyDown={e => { if (oneLine && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLTextAreaElement).blur() } }}
        onChange={e => onChange(oneLine ? e.target.value.replace(/\s*\n\s*/g, ' ') : e.target.value)}
        style={{ ...style, resize: 'none', overflow: 'hidden', lineHeight: 1.45, display: 'block', width: '100%', boxSizing: 'border-box' }}
      />
      {counter && (
        <span aria-live="polite" style={{ alignSelf: 'flex-end', fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: left <= 10 ? '#B7791F' : 'var(--text-muted)' }}>
          {left <= 0 ? 'Maximum atteint' : `${left} caractère${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}`}
        </span>
      )}
    </div>
  )
}
