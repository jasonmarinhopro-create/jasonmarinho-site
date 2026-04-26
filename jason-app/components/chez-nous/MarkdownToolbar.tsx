'use client'

import { useRef, type RefObject } from 'react'
import { TextB, TextItalic, Link } from '@phosphor-icons/react'

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement>
  value: string
  onChange: (next: string) => void
}

/**
 * Toolbar légère de mise en forme markdown pour textareas.
 * Insère les marqueurs autour de la sélection ou à la position du curseur.
 */
export default function MarkdownToolbar({ textareaRef, value, onChange }: Props) {
  const focusBack = useRef<number | null>(null)

  function wrap(prefix: string, suffix = prefix, placeholder = 'texte') {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const selected = value.slice(start, end) || placeholder
    const before   = value.slice(0, start)
    const after    = value.slice(end)
    const next = `${before}${prefix}${selected}${suffix}${after}`
    onChange(next)
    focusBack.current = start + prefix.length + selected.length + suffix.length
    requestAnimationFrame(() => {
      el.focus()
      const pos = focusBack.current ?? next.length
      el.setSelectionRange(pos, pos)
    })
  }

  function insertLink() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const selected = value.slice(start, end) || 'texte'
    const url = window.prompt('URL du lien (https://…)') ?? ''
    if (!url) return
    const before = value.slice(0, start)
    const after  = value.slice(end)
    const inserted = `[${selected}](${url})`
    const next = `${before}${inserted}${after}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + inserted.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div style={s.bar}>
      <button type="button" onClick={() => wrap('**')} style={s.btn} title="Gras (**)">
        <TextB size={13} weight="bold" />
      </button>
      <button type="button" onClick={() => wrap('*')} style={s.btn} title="Italique (*)">
        <TextItalic size={13} />
      </button>
      <button type="button" onClick={insertLink} style={s.btn} title="Lien">
        <Link size={13} />
      </button>
      <span style={s.help}>
        <strong>**gras**</strong> · <em>*italique*</em> · [texte](url)
      </span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '4px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
  btn: {
    width: '28px', height: '28px',
    background: 'transparent', border: '1px solid transparent',
    color: 'var(--text-2)', cursor: 'pointer',
    borderRadius: '6px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  help: {
    marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)',
    paddingRight: '6px',
  },
}
