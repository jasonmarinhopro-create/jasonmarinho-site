'use client'

import { useState, useEffect } from 'react'
import { ArrowUp, CircleNotch, CheckCircle, PaperPlaneTilt } from '@phosphor-icons/react'

interface Idea {
  id: string
  title: string
  votes: number
  created_at: string
  status: 'pending' | 'planned' | 'done'
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Proposée',    color: 'rgba(255,255,255,0.4)',  bg: 'rgba(255,255,255,0.05)' },
  planned: { label: 'Planifiée',   color: '#FFD56B',                bg: 'rgba(255,213,107,0.1)'  },
  done:    { label: 'Réalisée',    color: '#34d399',                bg: 'rgba(52,211,153,0.1)'   },
}

function getVoted(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem('jm_idea_votes')
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

function saveVoted(ids: Set<string>) {
  localStorage.setItem('jm_idea_votes', JSON.stringify(Array.from(ids)))
}

export default function SuggestionsBoard() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setVoted(getVoted())
    fetch('/api/ideas/list')
      .then(r => r.json())
      .then(data => { setIdeas(data.ideas ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleVote(id: string) {
    if (voted.has(id)) return
    const newVoted = new Set(voted)
    newVoted.add(id)
    setVoted(newVoted)
    saveVoted(newVoted)
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i).sort((a, b) => b.votes - a.votes))
    fetch('/api/ideas/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t || t.length < 5) { setError('Décris ton idée en quelques mots (min. 5 caractères)'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/ideas/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur'); setSubmitting(false); return }
      const data = await res.json()
      setIdeas(prev => [data.idea, ...prev])
      setTitle('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch {
      setError('Erreur réseau.')
    }
    setSubmitting(false)
  }

  return (
    <div style={s.wrap}>
      {/* Submit form */}
      <div style={s.formWrap}>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="text"
            placeholder="Décris ton idée en une phrase…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            style={s.input}
            disabled={submitting}
          />
          <button type="submit" style={s.submitBtn} disabled={submitting || !title.trim()}>
            {submitting
              ? <CircleNotch size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <PaperPlaneTilt size={16} weight="bold" />
            }
            Proposer
          </button>
        </form>
        {error && <p style={s.err}>{error}</p>}
        {submitted && (
          <p style={s.ok}>
            <CheckCircle size={14} weight="fill" />
            Idée soumise, merci !
          </p>
        )}
      </div>

      {/* Ideas list */}
      {loading ? (
        <div style={s.loadingWrap}>
          <CircleNotch size={20} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : ideas.length === 0 ? (
        <div style={s.empty}>
          <p>Aucune idée pour l&apos;instant. Sois le premier à proposer !</p>
        </div>
      ) : (
        <div style={s.list}>
          {ideas.map((idea, i) => {
            const st = STATUS_LABELS[idea.status] ?? STATUS_LABELS.pending
            const hasVoted = voted.has(idea.id)
            return (
              <div key={idea.id} style={{ ...s.item, ...(i === 0 ? s.itemTop : {}) }}>
                <button
                  onClick={() => handleVote(idea.id)}
                  disabled={hasVoted}
                  style={{ ...s.voteBtn, ...(hasVoted ? s.voteBtnActive : {}) }}
                  title={hasVoted ? 'Déjà voté' : 'Voter pour cette idée'}
                >
                  <ArrowUp size={14} weight="bold" />
                  <span style={s.voteCount}>{idea.votes}</span>
                </button>

                <div style={s.itemBody}>
                  <p style={s.itemTitle}>{idea.title}</p>
                  <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '24px' },

  formWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  form: { display: 'flex', gap: '10px' },
  input: {
    flex: 1, padding: '14px 18px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '14px 20px', borderRadius: '12px',
    background: 'rgba(255,213,107,0.12)',
    border: '1px solid rgba(255,213,107,0.25)',
    color: '#FFD56B', fontSize: '13px', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
    whiteSpace: 'nowrap',
  },
  err: { fontSize: '12px', color: '#f87171', margin: 0 },
  ok: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#34d399', margin: 0 },

  loadingWrap: { display: 'flex', justifyContent: 'center', padding: '40px 0' },
  empty: {
    padding: '32px', textAlign: 'center',
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.08)',
    borderRadius: '14px', fontSize: '14px', color: 'rgba(255,255,255,0.3)',
  },

  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  item: {
    display: 'flex', gap: '14px', alignItems: 'center',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px', transition: 'border-color .15s',
  },
  itemTop: {
    border: '1px solid rgba(255,213,107,0.2)',
    background: 'rgba(255,213,107,0.04)',
  },

  voteBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    padding: '8px 12px', borderRadius: '10px', flexShrink: 0,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer', transition: 'all .15s',
  },
  voteBtnActive: {
    background: 'rgba(255,213,107,0.12)',
    border: '1px solid rgba(255,213,107,0.3)',
    color: '#FFD56B', cursor: 'default',
  },
  voteCount: { fontSize: '13px', fontWeight: 700, lineHeight: 1 },

  itemBody: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const },
  itemTitle: { fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: 0, flex: 1 },
  statusBadge: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.4px',
    padding: '3px 9px', borderRadius: '100px', flexShrink: 0,
    textTransform: 'uppercase',
  },
}
