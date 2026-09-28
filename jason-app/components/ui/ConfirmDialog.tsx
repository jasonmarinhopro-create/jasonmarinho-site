'use client'

// Remplace window.confirm / window.prompt dans le dashboard (sept. 2026).
// Les boîtes natives peuvent ne rien afficher sur mobile ou en webview et
// renvoyer tout de suite : le clic ne déclenchait alors jamais l'action (vu
// sur Réseaux sociaux). Elles cassent aussi le thème de l'app.
//
// Usage :
//   const { confirm, prompt, dialog } = useConfirm()
//   if (!(await confirm({ message: 'Supprimer ce gabarit ?', confirmLabel: 'Supprimer', danger: true }))) return
//   const motif = await prompt({ message: 'Motif du refus', placeholder: 'Optionnel' }) // null = annulé
//   ...
//   return <>{dialog}...</>
//
// Rendu dans document.body (portail) : un parent animé (transform) confinerait
// un position: fixed à sa propre boîte.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Opts = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}
type PromptOpts = Opts & { placeholder?: string; defaultValue?: string }

type Pending = (Opts & { input: false; resolve: (v: boolean) => void })
  | (PromptOpts & { input: true; resolve: (v: string | null) => void })

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback((opts: Opts) => new Promise<boolean>(resolve => {
    setPending({ ...opts, input: false, resolve })
  }), [])
  const prompt = useCallback((opts: PromptOpts) => new Promise<string | null>(resolve => {
    setPending({ ...opts, input: true, resolve })
  }), [])

  const dialog = pending ? <Dialog pending={pending} onClose={() => setPending(null)} /> : null
  return { confirm, prompt, dialog }
}

function Dialog({ pending, onClose }: { pending: Pending; onClose: () => void }) {
  const [text, setText] = useState(pending.input ? (pending.defaultValue ?? '') : '')
  const okRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const cancel = useCallback(() => {
    if (pending.input) pending.resolve(null)
    else pending.resolve(false)
    onClose()
  }, [pending, onClose])
  const ok = () => {
    if (pending.input) pending.resolve(text.trim())
    else pending.resolve(true)
    onClose()
  }

  useEffect(() => {
    (pending.input ? inputRef.current : okRef.current)?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, cancel])

  if (typeof document === 'undefined') return null
  const tone = pending.danger
    ? { bg: 'var(--danger)', color: '#fff' }
    : { bg: 'var(--accent-text)', color: 'var(--bg)' }

  return createPortal(
    <div role="presentation" onClick={cancel} style={s.backdrop}>
      <div role="dialog" aria-modal="true" aria-label={pending.title ?? pending.message}
        onClick={e => e.stopPropagation()} style={s.box}>
        {pending.title && <div style={s.title}>{pending.title}</div>}
        <p style={s.message}>{pending.message}</p>
        {pending.input && (
          <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} rows={3}
            placeholder={pending.placeholder} style={s.input}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ok() }} />
        )}
        <div style={s.actions}>
          <button type="button" onClick={cancel} style={s.cancel}>{pending.cancelLabel ?? 'Annuler'}</button>
          <button ref={okRef} type="button" onClick={ok} style={{ ...s.ok, background: tone.bg, color: tone.color }}>
            {pending.confirmLabel ?? 'Confirmer'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  },
  box: {
    width: '100%', maxWidth: '420px', background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px 22px', boxShadow: 'var(--shadow-md)',
  },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--text)', marginBottom: '8px' },
  message: { fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-line' },
  input: {
    width: '100%', marginTop: '12px', padding: '10px 12px', borderRadius: '10px', resize: 'vertical',
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
    fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px', flexWrap: 'wrap' },
  cancel: {
    padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent',
    color: 'var(--text-2)', fontSize: '13.5px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  },
  ok: {
    padding: '9px 16px', borderRadius: '10px', border: 'none',
    fontSize: '13.5px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
  },
}
