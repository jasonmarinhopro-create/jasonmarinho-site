'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, LinkSimple, Archive, ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr'
import { LINK_CHANNELS, LINK_DESTINATIONS } from '@/lib/acquisition/rules'
import { createTrackedLink, setTrackedLinkArchived } from './actions'

export function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      style={btn}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800) }, () => undefined)
      }}
    >
      {done ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />} {done ? 'Copié' : label}
    </button>
  )
}

export function ArchiveButton({ id, archived }: { id: string; archived: boolean }) {
  const [pending, start] = useTransition()
  return (
    <button type="button" style={btnGhost} disabled={pending} onClick={() => start(async () => { await setTrackedLinkArchived(id, !archived) })}>
      {archived ? <ArrowCounterClockwise size={14} /> : <Archive size={14} />} {archived ? 'Réactiver' : 'Archiver'}
    </button>
  )
}

export function CreateLinkForm() {
  const [label, setLabel] = useState('')
  const [channel, setChannel] = useState('facebook_groupe')
  const [dest, setDest] = useState(LINK_DESTINATIONS[0].url)
  const [other, setOther] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    start(async () => {
      const r = await createTrackedLink({ label, channel, destination: dest === 'autre' ? other : dest })
      if (r.ok) { setCreated(r.url); setLabel('') }
      else setError(r.error)
    })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={field}>
        <span style={lab}>Nom du lien</span>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex. Groupe Hôtes Airbnb France, post du 10/10" style={input} maxLength={120} />
        <span style={hint}>Le nom du groupe et du post : c&apos;est lui que tu retrouveras dans les résultats.</span>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 12 }}>
        <label style={field}>
          <span style={lab}>Où tu le partages</span>
          <select value={channel} onChange={e => setChannel(e.target.value)} style={input}>
            {LINK_CHANNELS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
        <label style={field}>
          <span style={lab}>Page d&apos;arrivée</span>
          <select value={dest} onChange={e => setDest(e.target.value)} style={input}>
            {LINK_DESTINATIONS.map(d => <option key={d.url} value={d.url}>{d.label}</option>)}
            <option value="autre">Une autre page…</option>
          </select>
        </label>
      </div>
      {dest === 'autre' && (
        <label style={field}>
          <span style={lab}>Adresse de la page</span>
          <input value={other} onChange={e => setOther(e.target.value)} placeholder="https://jasonmarinho.com/blog/…" style={input} />
        </label>
      )}
      {error && <p style={{ margin: 0, fontSize: 13, color: 'var(--danger, #B42318)' }}>{error}</p>}
      <button type="submit" disabled={pending} style={btnPrimary}>
        <LinkSimple size={15} weight="bold" /> {pending ? 'Création…' : 'Créer le lien'}
      </button>
      {created && (
        <div style={createdBox}>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Ton lien est prêt, colle-le dans ton post :</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <code style={code}>{created}</code>
            <CopyButton text={created} />
          </div>
        </div>
      )}
    </form>
  )
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }
const lab: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--text)' }
const hint: React.CSSProperties = { fontSize: 12, color: 'var(--text-3)' }
const input: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', minWidth: 0,
}
const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
const btnGhost: React.CSSProperties = { ...btn, color: 'var(--text-3)' }
const btnPrimary: React.CSSProperties = {
  alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none',
  background: 'var(--accent-text)', color: 'var(--bg)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
}
const createdBox: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 12,
  background: 'color-mix(in srgb, var(--accent-text) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-text) 25%, transparent)',
}
const code: React.CSSProperties = { fontSize: 13.5, fontWeight: 600, color: 'var(--accent-text)', overflowWrap: 'anywhere' }

/** Relit la page toutes les 5 minutes tant que l'onglet est visible (comme le CRM Driing) */
export function AutoRefresh({ minutes = 5 }: { minutes?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === 'visible') router.refresh() }, minutes * 60_000)
    return () => clearInterval(id)
  }, [router, minutes])
  return null
}
