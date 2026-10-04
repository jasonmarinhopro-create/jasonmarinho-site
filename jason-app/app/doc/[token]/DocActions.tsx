'use client'

import { useEffect, useState } from 'react'
import { DownloadSimple, Check, CheckCircle } from '@phosphor-icons/react/dist/ssr'

export default function DocActions({ token, canAccept, clientName }: { token: string; canAccept: boolean; clientName: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(clientName)
  const [agree, setAgree] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('print') === '1') {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [])

  async function accept(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !agree) return
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/pro-docs/accept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setState('error'); setError(j.error ?? 'Acceptation impossible, réessaie.'); return }
      setState('done')
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      setState('error')
      setError('Connexion impossible, réessaie.')
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <button onClick={() => window.print()} style={s.ghost}><DownloadSimple size={16} weight="bold" /> Télécharger en PDF</button>
      {canAccept && !open && state !== 'done' && (
        <button onClick={() => setOpen(true)} style={s.primary}><Check size={16} weight="bold" /> Accepter le devis</button>
      )}
      {state === 'done' && <span style={s.done}><CheckCircle size={18} weight="fill" /> Devis accepté, merci !</span>}
      {open && state !== 'done' && (
        <form onSubmit={accept} style={s.form}>
          <div style={s.formTitle}>Bon pour accord</div>
          <label style={s.label}>Ton nom et prénom
            <input value={name} onChange={e => setName(e.target.value)} required maxLength={120} style={s.input} />
          </label>
          <label style={s.check}>
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
            <span>J&apos;accepte ce devis et ses conditions (bon pour accord).</span>
          </label>
          {error && <div style={s.error}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setOpen(false)} style={s.cancel}>Annuler</button>
            <button type="submit" disabled={!agree || !name.trim() || state === 'sending'} style={{ ...s.primary, opacity: !agree || !name.trim() ? 0.6 : 1 }}>
              {state === 'sending' ? 'Envoi…' : 'Confirmer'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  ghost: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.35)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  primary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#FFD56B', color: '#003329', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  done: { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#FFD56B', fontWeight: 700, fontSize: 14 },
  form: { position: 'absolute', right: 'clamp(16px, 4vw, 40px)', top: 'calc(100% + 8px)', width: 'min(360px, calc(100vw - 32px))', background: '#fff', color: '#0B1D0F', borderRadius: 14, padding: 16, boxShadow: '0 18px 48px rgba(0,30,20,.25)', display: 'flex', flexDirection: 'column', gap: 10 },
  formTitle: { fontFamily: 'var(--font-fraunces), Fraunces, Georgia, serif', fontSize: 18 },
  label: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#4A5D51' },
  input: { padding: '10px 12px', borderRadius: 9, border: '1px solid #D5E5DB', fontSize: 14, fontFamily: 'inherit', color: '#0B1D0F', background: '#fff' },
  check: { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#0B1D0F', lineHeight: 1.45 },
  error: { fontSize: 12.5, color: '#B4462F', fontWeight: 600 },
  cancel: { background: 'none', border: 'none', color: '#4A5D51', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
}
