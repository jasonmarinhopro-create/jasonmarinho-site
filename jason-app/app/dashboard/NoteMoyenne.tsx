'use client'

import { useState, useRef } from 'react'
import { updateAvisMoyen } from './actions'
import { PencilSimple, Check, X } from '@phosphor-icons/react'

export default function NoteMoyenne({ initial }: { initial: number | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial != null ? String(initial) : '')
  const [saved, setSaved]   = useState<number | null>(initial)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setValue(saved != null ? String(saved) : '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function confirm() {
    const n = parseFloat(value.replace(',', '.'))
    if (isNaN(n) || n < 1 || n > 5) { setEditing(false); return }
    setSaving(true)
    await updateAvisMoyen(n)
    setSaved(Math.round(n * 100) / 100)
    setEditing(false)
    setSaving(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          ref={inputRef}
          type="number" min="1" max="5" step="0.01"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') setEditing(false) }}
          disabled={saving}
          style={{
            width: '62px', padding: '4px 8px', fontSize: '16px', fontWeight: 700,
            background: 'var(--surface)', border: '1px solid rgba(255,213,107,0.4)',
            borderRadius: '6px', color: 'var(--text)', outline: 'none',
          }}
          autoFocus
        />
        <button onClick={confirm} disabled={saving} style={btnStyle('#10b981')}>
          <Check size={12} weight="bold" />
        </button>
        <button onClick={() => setEditing(false)} style={btnStyle('#94a3b8')}>
          <X size={12} weight="bold" />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
      <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, color: saved ? '#f59e0b' : 'var(--text-muted)' }}>
        {saved != null ? saved.toFixed(2) : '—'}
      </span>
      <button onClick={startEdit} title="Modifier ma note" style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
      }}>
        <PencilSimple size={13} />
      </button>
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    width: '24px', height: '24px', borderRadius: '6px', border: 'none',
    background: color + '22', color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
}
