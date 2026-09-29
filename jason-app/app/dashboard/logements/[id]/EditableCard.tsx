'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { PencilSimple, Check } from '@phosphor-icons/react/dist/ssr'

type Props = {
  title: ReactNode
  icon?: ReactNode
  /** Une ligne sous le titre : à quoi sert la section */
  subtitle?: ReactNode
  /** Ancre de la carte (`#id`). `#modifier-<id>` ouvre directement le formulaire. */
  id?: string
  view: ReactNode
  edit: ReactNode
  onSave: () => Promise<{ error?: string } | void>
  onCancel?: () => void
  /** When true, the card has no value to display in view mode — show a CTA. */
  emptyView?: ReactNode
  hasValue?: boolean
  /** Libellé du bouton quand la section est vide (« Ajouter… ») */
  addLabel?: string
}

export function EditableCard({ title, icon, subtitle, id, view, edit, onSave, onCancel, emptyView, hasValue = true, addLabel }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!editing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  // Lien « À compléter » de la fiche : #modifier-<id> ouvre le formulaire
  useEffect(() => {
    if (!id) return
    const open = () => {
      if (window.location.hash !== `#modifier-${id}`) return
      setEditing(true)
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `#${id}`)
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [id])

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
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
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

  const empty = !hasValue && !editing

  return (
    <section ref={ref} id={id} style={{ ...card, ...(editing ? cardEditing : {}) }}>
      <header style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {icon && <span style={iconBox}>{icon}</span>}
          <div style={{ minWidth: 0 }}>
            <h3 style={titleStyle}>{title}</h3>
            {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          </div>
        </div>
        {saved && !editing && <span style={savedPill}><Check size={12} weight="bold" /> Enregistré</span>}
        {!editing && !saved && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={empty ? addBtn : editBtn}
            aria-label={typeof title === 'string' ? `Modifier : ${title}` : 'Modifier la section'}
          >
            <PencilSimple size={13} weight="bold" />
            <span>{empty ? (addLabel ?? 'Compléter') : 'Modifier'}</span>
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
    </section>
  )
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '18px',
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  minWidth: 0,
  scrollMarginTop: '90px',
  transition: 'border-color .15s ease, box-shadow .15s ease',
}

const cardEditing: React.CSSProperties = {
  borderColor: 'var(--accent-border)',
  boxShadow: '0 0 0 3px var(--accent-bg)',
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
}

const iconBox: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: '11px', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--accent-bg)', color: 'var(--accent-text)',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-fraunces), serif',
  fontSize: '18px',
  fontWeight: 400,
  color: 'var(--text)',
  margin: 0,
  lineHeight: 1.25,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '12.5px', color: 'var(--text-3)', margin: '3px 0 0', lineHeight: 1.45,
}

const editBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 11px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-2)',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '9px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  flexShrink: 0,
}

const addBtn: React.CSSProperties = {
  ...editBtn,
  color: 'var(--accent-text)',
  background: 'var(--accent-bg)',
  border: '1px solid var(--accent-border)',
}

const savedPill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '9px',
  fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)', background: 'var(--accent-bg)', flexShrink: 0,
}

const footer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  borderTop: '1px solid var(--border)',
  paddingTop: '14px',
}

const footerActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
}

const errMsg: React.CSSProperties = {
  fontSize: '12.5px',
  color: 'var(--danger-text)',
}

const ghostBtn: React.CSSProperties = {
  padding: '9px 15px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-2)',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  padding: '9px 18px',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--bg)',
  background: 'var(--accent-text)',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
