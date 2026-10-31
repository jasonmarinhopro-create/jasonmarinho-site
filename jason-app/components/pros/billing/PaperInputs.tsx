'use client'

// Champs posés directement sur la feuille du devis (31/10/2026, Jason : « le
// visuel est très bien, change juste la manière de le remplir »). Invisibles
// au repos (même police, même taille que le texte de la feuille), un filet
// pointillé au survol, un fond jaune pâle quand on écrit. Utilisés seulement
// dans l'éditeur : la page du client garde la feuille en lecture seule.

import { useEffect, useRef, useState } from 'react'

const base: React.CSSProperties = {
  font: 'inherit', color: 'inherit', background: 'transparent', border: 'none', padding: '1px 4px', margin: '-1px -4px',
  borderRadius: 5, width: 'calc(100% + 8px)', minWidth: 0, outline: '1.5px dashed transparent', outlineOffset: 0,
}

export function PaperText({ value, onChange, placeholder, multiline = false, style, ariaLabel }: {
  value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean; style?: React.CSSProperties; ariaLabel?: string
}) {
  const common = { className: 'paper-in', value, placeholder, 'aria-label': ariaLabel ?? placeholder, style: { ...base, ...style } }
  return multiline
    ? <textarea {...common} rows={Math.max(1, value.split('\n').length)} onChange={e => onChange(e.target.value)} style={{ ...common.style, resize: 'none', display: 'block', lineHeight: 'inherit' }} />
    : <input {...common} onChange={e => onChange(e.target.value)} />
}

/** Nombre au clavier français : la virgule est acceptée, « 12, » reste tel quel pendant la saisie */
export function PaperNumber({ value, onChange, ariaLabel, placeholder = '0', style, emptyWhenZero = false }: {
  value: number; onChange: (v: number) => void; ariaLabel: string; placeholder?: string; style?: React.CSSProperties; emptyWhenZero?: boolean
}) {
  const shown = (n: number) => (emptyWhenZero && !n ? '' : String(n).replace('.', ','))
  const [txt, setTxt] = useState(() => shown(value))
  const editing = useRef(false)
  useEffect(() => { if (!editing.current) setTxt(shown(value)) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      className="paper-in" inputMode="decimal" value={txt} placeholder={placeholder} aria-label={ariaLabel}
      style={{ ...base, textAlign: 'right', ...style }}
      onFocus={() => { editing.current = true }}
      onBlur={() => { editing.current = false; setTxt(shown(value)) }}
      onChange={e => {
        const t = e.target.value.replace(/[^\d.,]/g, '')
        setTxt(t)
        const n = Number(t.replace(',', '.'))
        onChange(Number.isFinite(n) ? n : 0)
      }}
    />
  )
}

/** Styles des champs de la feuille (survol et saisie), à poser une fois */
export const PAPER_INPUT_CSS = `
.paper-in::placeholder { color: #7A8C80; opacity: 1 }
.paper-in:hover { outline-color: #C9D9CF !important }
.paper-in:focus { outline: 2px solid #0B6B57 !important; background: #FFFBEA !important }
.paper-unit { font: inherit; color: #7A8C80; background: transparent; border: none; padding: 0; cursor: pointer; appearance: none; -webkit-appearance: none }
.paper-unit:hover, .paper-unit:focus { color: #004C3F }
`
