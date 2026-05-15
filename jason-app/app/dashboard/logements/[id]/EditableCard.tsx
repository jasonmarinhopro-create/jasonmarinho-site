'use client'

import { ReactNode, useEffect, useState } from 'react'
import { PencilSimple } from '@phosphor-icons/react/dist/ssr'

type Props = {
  title: ReactNode
  icon?: ReactNode
  view: ReactNode
  edit: ReactNode
  onSave: () => Promise<{ error?: string } | void>
  onCancel?: () => void
  /** When true, the card has no value to display in view mode — show a CTA. */
  emptyView?: ReactNode
  hasValue?: boolean
}

export function EditableCard({ title, icon, view, edit, onSave, onCancel, emptyView, hasValue = true }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await onSave()
      if (res && 'error' in res && res.error) {
        setError(res.error)
        setSaving(false)
        return
      }
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    }
    setSaving(false)
  }

  function handleCancel() {
    onCancel?.()
    setEditing(false)
    setError(null)
  }

  return (
    <div style={card}>
      <header style={header}>
        <h3 style={titleStyle}>
          {icon}
          {title}
        </h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={editBtn}
            aria-label={typeof title === 'string' ? `Modifier ${title}` : 'Modifier la section'}
          >
            <PencilSimple size={13} weight="bold" />
            <span style={editBtnLabel}>Modifier</span>
          </button>
        )}
      </header>

      <div>
        {editing ? edit : (hasValue ? view : (emptyView ?? view))}
      </div>

      {editing && (
        <footer style={footer}>
          {error && <span style={errMsg} role="alert">{error}</span>}
          <div style={footerActions}>
            <button type="button" onClick={handleCancel} style={ghostBtn} disabled={saving}>
              Annuler
            </button>
            <button type="button" onClick={handleSave} style={primaryBtn} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-2)',
  borderRadius: '14px',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
}

const titleStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-fraunces), serif',
  fontSize: '15px',
  fontWeight: 500,
  color: 'var(--text)',
  margin: 0,
}

const editBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 10px',
  fontSize: '11.5px',
  fontWeight: 500,
  color: 'var(--text-2)',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s ease',
}

const editBtnLabel: React.CSSProperties = {
  fontSize: '11.5px',
}

const footer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  borderTop: '1px solid var(--border-2)',
  paddingTop: '12px',
  marginTop: '4px',
}

const footerActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
}

const errMsg: React.CSSProperties = {
  fontSize: '12.5px',
  color: 'var(--danger)',
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-2)',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '9px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--bg)',
  background: 'var(--accent-text)',
  border: 'none',
  borderRadius: '9px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
