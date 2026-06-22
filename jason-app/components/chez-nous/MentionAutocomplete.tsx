'use client'

import { useEffect, useRef, useState } from 'react'
import { searchMentions } from '@/app/dashboard/chez-nous/actions'

/**
 * Textarea avec autocomplete des mentions @pseudo et @tousleshôtes.
 *
 * Quand l'utilisateur tape '@' suivi d'au moins 1 caractère, on requête
 * `searchMentions` côté serveur et on affiche un popover de suggestions
 * sous le caret. Tab ou Enter insère la suggestion sélectionnée.
 * Arrow up/down navigue dans la liste. Escape ferme le popover.
 *
 * Utilisé dans :
 * - Le NewPostForm (modale de création de post Entre Hôtes)
 * - Les inline reply forms (commentaire rapide depuis le feed et page détail)
 * - Le ReplyForm complet sur la page détail
 *
 * Note : on garde un <textarea> standard avec ref forwarding pour que
 * les parents puissent toujours gérer le ref (auto-focus, etc.).
 */

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  style?: React.CSSProperties
  // Union pour accepter useRef<HTMLTextAreaElement>(null!) (MutableRefObject sans null)
  // ET useRef<HTMLTextAreaElement | null>(null) (avec null).
  textareaRef?:
    | React.MutableRefObject<HTMLTextAreaElement | null>
    | React.MutableRefObject<HTMLTextAreaElement>
  onKeyDownExtra?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  required?: boolean
}

type Suggestion = { pseudo: string; isBroadcast?: true }

export default function MentionAutocomplete({
  value, onChange, placeholder, maxLength, rows = 4, style, textareaRef, onKeyDownExtra, required,
}: Props) {
  const localRef = useRef<HTMLTextAreaElement>(null)
  const taRef = textareaRef ?? localRef
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [highlighted, setHighlighted] = useState(0)
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null)

  // Détecte si le caret est à l'intérieur d'un token @xxx.
  // Renvoie le préfixe (sans @) + les bornes start/end (inclus le @).
  function getMentionContext(): { prefix: string; start: number; end: number } | null {
    const ta = taRef.current
    if (!ta) return null
    const caret = ta.selectionStart ?? 0
    const before = value.slice(0, caret)
    // Match le dernier @ qui n'est pas dans un mot. On accepte les
    // pseudos avec ô (pour 'tousleshôtes') + ASCII standard.
    const m = before.match(/(^|\s)@([a-zA-Z0-9_\-ô]*)$/)
    if (!m) return null
    const start = caret - m[2].length - 1 // -1 pour le @
    return { prefix: m[2], start, end: caret }
  }

  // À chaque changement de texte, on recompute le contexte et on lance
  // la query si on est dans une mention en cours.
  useEffect(() => {
    const ctx = getMentionContext()
    if (!ctx) {
      setSuggestions([])
      setMentionRange(null)
      return
    }
    setMentionRange({ start: ctx.start, end: ctx.end })
    setHighlighted(0)

    // Debounce : 120 ms pour éviter de spammer le serveur à chaque touche
    let cancelled = false
    const t = setTimeout(() => {
      searchMentions(ctx.prefix).then(res => {
        if (cancelled) return
        setSuggestions(res.suggestions)
      })
    }, 120)

    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function insertSuggestion(s: Suggestion) {
    if (!mentionRange) return
    const before = value.slice(0, mentionRange.start)
    const after = value.slice(mentionRange.end)
    const newValue = `${before}@${s.pseudo} ${after}`
    onChange(newValue)
    setSuggestions([])
    setMentionRange(null)
    // Replace caret après la suggestion + l'espace
    setTimeout(() => {
      const pos = mentionRange.start + s.pseudo.length + 2
      taRef.current?.setSelectionRange(pos, pos)
      taRef.current?.focus()
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlighted(h => (h + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlighted(h => (h - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertSuggestion(suggestions[highlighted])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setSuggestions([])
        setMentionRange(null)
        return
      }
    }
    onKeyDownExtra?.(e)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={taRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setSuggestions([]), 150)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        required={required}
        style={{ width: '100%', boxSizing: 'border-box', ...style }}
      />
      {suggestions.length > 0 && (
        <div style={popover}>
          {suggestions.map((s, i) => (
            <button
              key={s.pseudo}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertSuggestion(s) }}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                ...item,
                ...(i === highlighted ? itemActive : {}),
              }}
            >
              <span style={s.isBroadcast ? itemBroadcastBadge : itemAtMark}>@</span>
              <span style={{ flex: 1, textAlign: 'left' as const }}>
                {s.pseudo}
                {s.isBroadcast && <span style={broadcastHint}> · notifie tous les hôtes</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const popover: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '4px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
  zIndex: 10,
  overflow: 'hidden',
  maxHeight: '240px',
  overflowY: 'auto',
}

const item: React.CSSProperties = {
  width: '100%',
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '8px 12px',
  background: 'transparent', border: 'none',
  fontFamily: 'inherit',
  fontSize: '13px', color: 'var(--text)',
  textAlign: 'left' as const,
  cursor: 'pointer',
}

const itemActive: React.CSSProperties = {
  background: 'var(--surface-2)',
}

const itemAtMark: React.CSSProperties = {
  width: '20px', height: '20px',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--accent-bg-2)', color: 'var(--accent-text)',
  border: '1px solid var(--accent-border-2)',
  borderRadius: '999px', fontSize: '11px', fontWeight: 700,
}

const itemBroadcastBadge: React.CSSProperties = {
  ...itemAtMark,
  background: 'rgba(217,119,6,0.12)',
  color: '#b45309',
  borderColor: 'rgba(217,119,6,0.30)',
}

const broadcastHint: React.CSSProperties = {
  fontSize: '11px', color: 'var(--text-muted)',
  marginLeft: '4px',
}
