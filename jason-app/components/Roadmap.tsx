'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Rocket, CheckCircle, Plus, ArrowUp, SpinnerGap, X } from '@phosphor-icons/react'

interface RoadmapItem {
  id: string
  title: string
  description: string | null
  status: 'suggestion' | 'planned' | 'in_progress' | 'done'
  author_name: string | null
  upvotes: number
  created_at: string
}

const COLUMNS: { key: RoadmapItem['status']; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'suggestion',  label: 'Idées proposées', icon: Lightbulb,    color: '#FFD56B', bg: 'rgba(255,213,107,0.08)' },
  { key: 'planned',     label: 'Prévu',           icon: Lightbulb,    color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  { key: 'in_progress', label: 'En cours',        icon: Rocket,       color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { key: 'done',        label: 'Terminé',         icon: CheckCircle,  color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
]

export default function Roadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [fTitle, setFTitle] = useState('')
  const [fDesc, setFDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voted, setVoted] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/roadmap')
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fTitle.trim()) return
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: fTitle, description: fDesc }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSubmitting(false); return }
    setItems(prev => [data.item, ...prev])
    setFTitle(''); setFDesc(''); setShowForm(false)
    setSubmitting(false)
  }

  const byStatus = (status: RoadmapItem['status']) =>
    items.filter(i => i.status === status)

  return (
    <div style={s.wrap}>

      {/* Header */}
      <div style={s.head}>
        <div>
          <h3 style={s.title}>Roadmap</h3>
          <p style={s.sub}>Ce qui est prévu, ce qui est en train d&apos;être construit — avec vos idées.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ ...s.addBtn, ...(showForm ? s.addBtnCancel : {}) }}>
          {showForm ? <X size={13} weight="bold" /> : <Plus size={13} weight="bold" />}
          {showForm ? 'Annuler' : 'Proposer une idée'}
        </button>
      </div>

      {/* Suggestion form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            value={fTitle}
            onChange={e => setFTitle(e.target.value)}
            placeholder="Une idée, une fonctionnalité, une amélioration…"
            style={s.formInput}
            className="input-field"
            maxLength={200}
            required
          />
          <textarea
            value={fDesc}
            onChange={e => setFDesc(e.target.value)}
            placeholder="Détaille ton idée si besoin (optionnel)"
            style={{ ...s.formInput, height: '72px', resize: 'vertical' }}
            className="input-field"
            maxLength={800}
          />
          {error && <p style={s.errMsg}>{error}</p>}
          <button type="submit" disabled={submitting || !fTitle.trim()} style={s.submitBtn}>
            {submitting
              ? <SpinnerGap size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Plus size={14} weight="bold" />
            }
            Soumettre
          </button>
        </form>
      )}

      {/* Columns */}
      {loading ? (
        <div style={s.loadWrap}>
          <SpinnerGap size={22} style={{ animation: 'spin 1s linear infinite', color: '#FFD56B' }} />
        </div>
      ) : (
        <div style={s.columns}>
          {COLUMNS.map(col => {
            const colItems = byStatus(col.key)
            const Icon = col.icon
            return (
              <div key={col.key} style={{ ...s.col, background: col.bg, borderColor: `${col.color}22` }}>
                <div style={s.colHead}>
                  <Icon size={14} color={col.color} weight="fill" />
                  <span style={{ ...s.colTitle, color: col.color }}>{col.label}</span>
                  <span style={{ ...s.colCount, color: col.color }}>{colItems.length}</span>
                </div>

                {colItems.length === 0 ? (
                  <p style={s.empty}>
                    {col.key === 'suggestion'
                      ? 'Aucune idée pour l\'instant — sois le premier !'
                      : 'Rien ici pour l\'instant.'}
                  </p>
                ) : (
                  <div style={s.cardList}>
                    {colItems.map(item => (
                      <div key={item.id} style={s.card}>
                        <div style={s.cardTitle}>{item.title}</div>
                        {item.description && (
                          <p style={s.cardDesc}>{item.description}</p>
                        )}
                        <div style={s.cardFoot}>
                          {item.author_name && (
                            <span style={s.cardAuthor}>{item.author_name}</span>
                          )}
                          <button
                            onClick={() => setVoted(v => new Set([...v, item.id]))}
                            disabled={voted.has(item.id)}
                            style={{ ...s.voteBtn, ...(voted.has(item.id) ? s.votedBtn : {}) }}
                            title="Voter pour cette idée"
                          >
                            <ArrowUp size={11} weight="bold" />
                            {item.upvotes + (voted.has(item.id) ? 1 : 0)}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
  head: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '16px', flexWrap: 'wrap',
  },
  title: { fontSize: '17px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' },
  sub:   { fontSize: '13px', color: 'var(--text-2)', margin: 0 },

  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 600,
    background: 'rgba(255,213,107,0.12)', color: '#FFD56B',
    border: '1px solid rgba(255,213,107,0.25)',
    borderRadius: '10px', padding: '8px 16px',
    cursor: 'pointer', flexShrink: 0,
    transition: 'background 0.15s',
  },
  addBtnCancel: {
    background: 'var(--border)', color: 'var(--text-3)', borderColor: 'transparent',
  },

  form: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    background: 'var(--surface)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '14px', padding: '16px',
  },
  formInput: {
    width: '100%', fontSize: '13px',
    padding: '10px 12px', borderRadius: '9px',
    boxSizing: 'border-box',
  },
  errMsg:    { fontSize: '12px', color: '#f87171', margin: 0 },
  submitBtn: {
    alignSelf: 'flex-start',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 700,
    background: 'linear-gradient(135deg, #FFD56B 0%, #f59e0b 100%)',
    color: '#1a1a0e', border: 'none', borderRadius: '9px',
    padding: '9px 20px', cursor: 'pointer',
  },

  loadWrap:   { display: 'flex', justifyContent: 'center', padding: '40px 0' },

  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  col: {
    border: '1px solid',
    borderRadius: '14px', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  colHead: {
    display: 'flex', alignItems: 'center', gap: '7px',
  },
  colTitle: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', flex: 1 },
  colCount: {
    fontSize: '11px', fontWeight: 700,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '999px', padding: '1px 7px',
  },
  empty: { fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 },

  cardList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  card: {
    background: 'var(--nav-bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  cardTitle: { fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 },
  cardDesc:  { fontSize: '12px', color: 'var(--text-2)', margin: 0, lineHeight: 1.4 },
  cardFoot:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '2px' },
  cardAuthor:{ fontSize: '11px', color: 'var(--text-muted)' },
  voteBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 600,
    color: 'var(--text-3)', background: 'var(--border)',
    border: 'none', borderRadius: '999px', padding: '3px 8px',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  votedBtn: {
    color: '#FFD56B', background: 'rgba(255,213,107,0.12)',
    cursor: 'default',
  },
}
