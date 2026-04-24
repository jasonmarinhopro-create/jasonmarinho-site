'use client'

import { useState } from 'react'
import { Lock, PencilSimpleLine, X, SpinnerGap, Trash } from '@phosphor-icons/react'

export interface CoulissesPost {
  id: string
  content: string
  created_at: string
}

interface Props {
  initialPosts: CoulissesPost[]
  isAdmin: boolean
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function CoulissesJason({ initialPosts, isAdmin }: Props) {
  const [posts, setPosts]       = useState<CoulissesPost[]>(initialPosts)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setSaving(true); setErr(null)
    const res  = await fetch('/api/coulisses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft }),
    })
    const data = await res.json()
    if (data.error) { setErr(data.error); setSaving(false); return }
    setPosts(prev => [data.post, ...prev])
    setDraft(''); setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch('/api/coulisses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPosts(prev => prev.filter(p => p.id !== id))
    setDeleting(null)
  }

  return (
    <div style={s.wrap}>

      {/* Header */}
      <div style={s.head}>
        <div style={s.headLeft}>
          <Lock size={14} color="#FFD56B" weight="fill" />
          <span style={s.headTitle}>Les Coulisses</span>
          <span style={s.headBadge}>Exclusif</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(v => !v)}
            style={{ ...s.postBtn, ...(showForm ? s.postBtnCancel : {}) }}
          >
            {showForm
              ? <><X size={12} weight="bold" /> Annuler</>
              : <><PencilSimpleLine size={12} weight="bold" /> Partager un coulisse</>
            }
          </button>
        )}
      </div>

      <p style={s.sub}>
        Ce que je construis en ce moment — pour toi.
      </p>

      {/* Admin post form */}
      {isAdmin && showForm && (
        <form onSubmit={handlePost} style={s.form}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Partage ce que tu construis, une décision en coulisse, un défi en cours… (2–3 phrases suffisent)"
            style={s.textarea}
            maxLength={1200}
            rows={4}
            required
          />
          <div style={s.formFoot}>
            <span style={s.charCount}>{draft.length}/1200</span>
            {err && <span style={s.errMsg}>{err}</span>}
            <button type="submit" disabled={saving || !draft.trim()} style={s.submitBtn}>
              {saving
                ? <SpinnerGap size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <PencilSimpleLine size={13} weight="bold" />
              }
              Publier
            </button>
          </div>
        </form>
      )}

      {/* Posts feed */}
      {posts.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyText}>Rien ici pour l&apos;instant.</p>
          {isAdmin
            ? <p style={s.emptyNote}>Partage tes premières coulisses ci-dessus.</p>
            : <p style={s.emptyNote}>Jason partagera bientôt ce qu&apos;il construit.</p>
          }
        </div>
      ) : (
        <div style={s.feed}>
          {posts.map((post, i) => (
            <div key={post.id} style={{ ...s.entry, ...(i === 0 ? s.entryFirst : {}) }}>
              <div style={s.entryMeta}>
                <span style={s.entryDate}>{formatDate(post.created_at)}</span>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deleting === post.id}
                    style={s.deleteBtn}
                    title="Supprimer"
                  >
                    {deleting === post.id
                      ? <SpinnerGap size={11} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Trash size={11} weight="bold" />
                    }
                  </button>
                )}
              </div>
              <div style={s.entryContent}>
                <div style={s.jmAvatar}>JM</div>
                <p style={s.entryText}>{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '14px' },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px',
  },
  headLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  headTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  headBadge: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase',
    color: '#FFD56B', background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '999px', padding: '2px 8px',
  },
  sub: { fontSize: '13px', color: 'var(--text-2)', margin: 0, marginTop: '-6px' },

  postBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 600,
    background: 'rgba(255,213,107,0.1)', color: '#FFD56B',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '8px', padding: '7px 14px',
    cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
  },
  postBtnCancel: {
    background: 'var(--border)', color: 'var(--text-3)', borderColor: 'transparent',
  },

  form: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    background: 'var(--surface)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '14px', padding: '14px',
  },
  textarea: {
    width: '100%', fontSize: '13px', lineHeight: 1.6,
    padding: '10px 12px', borderRadius: '9px', resize: 'vertical',
    boxSizing: 'border-box',
  },
  formFoot: { display: 'flex', alignItems: 'center', gap: '10px' },
  charCount: { fontSize: '11px', color: 'var(--text-muted)', flex: 1 },
  errMsg:    { fontSize: '12px', color: '#f87171' },
  submitBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 700,
    background: 'linear-gradient(135deg, #FFD56B 0%, #f59e0b 100%)',
    color: '#1a1a0e', border: 'none', borderRadius: '8px',
    padding: '8px 18px', cursor: 'pointer',
  },

  empty: {
    padding: '24px', textAlign: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed var(--border)',
    borderRadius: '14px',
  },
  emptyText: { fontSize: '13px', color: 'var(--text-2)', margin: '0 0 4px' },
  emptyNote: { fontSize: '12px', color: 'var(--text-muted)', margin: 0 },

  feed: { display: 'flex', flexDirection: 'column', gap: '0' },
  entry: {
    padding: '16px 0',
    borderTop: '1px solid var(--border)',
  },
  entryFirst: { borderTop: 'none', paddingTop: '0' },
  entryMeta: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '10px',
  },
  entryDate: {
    fontSize: '11px', color: 'var(--text-muted)',
    fontWeight: 600, letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    display: 'inline-flex', alignItems: 'center',
    color: 'var(--text-muted)', background: 'none',
    border: 'none', cursor: 'pointer', padding: '3px',
    opacity: 0.5, transition: 'opacity 0.15s',
  },
  entryContent: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  jmAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.2) 0%, rgba(255,213,107,0.08) 100%)',
    border: '1px solid rgba(255,213,107,0.25)',
    fontSize: '10px', fontWeight: 800, color: '#FFD56B',
    fontFamily: 'var(--font-fraunces), serif',
  },
  entryText: {
    fontSize: '14px', lineHeight: 1.7,
    color: 'var(--text-2)', margin: 0,
    flex: 1,
  },
}
