'use client'

import { useState, useTransition } from 'react'
import {
  Lightbulb, Clock, Rocket, CheckCircle,
  ArrowFatUp, ChatCircle, Plus, X, SpinnerGap, Trash,
} from '@phosphor-icons/react'
import {
  submitRoadmapIdea,
  voteRoadmapItem,
  addRoadmapComment,
  updateRoadmapStatus,
  deleteRoadmapItem,
} from '@/app/dashboard/contributeurs/roadmap-actions'

export interface RoadmapItemData {
  id: string
  title: string
  description: string | null
  status: 'suggestion' | 'planned' | 'in_progress' | 'done'
  author_id: string | null
  author_name: string | null
  created_at: string
}

export interface RoadmapCommentData {
  id: string
  item_id: string
  author_id: string | null
  author_name: string | null
  content: string
  created_at: string
}

const STATUS_CONFIG = {
  suggestion:  { label: 'Idée',     icon: Lightbulb,   color: '#FFD56B', bg: 'rgba(255,213,107,0.1)',  border: 'rgba(255,213,107,0.25)' },
  planned:     { label: 'Prévu',    icon: Clock,       color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
  in_progress: { label: 'En cours', icon: Rocket,      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)' },
  done:        { label: 'Terminé',  icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)' },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

const FILTERS: { key: StatusKey | 'all'; label: string }[] = [
  { key: 'all',         label: 'Tout' },
  { key: 'suggestion',  label: 'Idées' },
  { key: 'planned',     label: 'Prévu' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'done',        label: 'Terminé' },
]

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)      return "À l'instant"
  if (diff < 3600)    return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400)   return `Il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800)  return `Il y a ${Math.floor(diff / 86400)}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function avatarColor(name: string): string {
  const PALETTE = ['#FFD56B', '#60a5fa', '#a78bfa', '#34d399', '#f87171', '#fb923c']
  let h = 0
  for (const c of name) h = (h + c.charCodeAt(0)) % PALETTE.length
  return PALETTE[h]
}

export default function Roadmap({
  items: initialItems,
  comments: initialComments,
  voteCounts: initialVoteCounts,
  userVotes: initialUserVotes,
  userId,
  isAdmin,
}: {
  items: RoadmapItemData[]
  comments: RoadmapCommentData[]
  voteCounts: Record<string, number>
  userVotes: string[]
  userId: string | null
  isAdmin: boolean
}) {
  const [filter, setFilter]               = useState<StatusKey | 'all'>('all')
  const [items, setItems]                 = useState(initialItems)
  const [allComments, setAllComments]     = useState(initialComments)
  const [voteCounts, setVoteCounts]       = useState(initialVoteCounts)
  const [userVotes, setUserVotes]         = useState(new Set(initialUserVotes))
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [showForm, setShowForm]           = useState(false)
  const [formTitle, setFormTitle]         = useState('')
  const [formDesc, setFormDesc]           = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [formError, setFormError]         = useState<string | null>(null)
  const [, startTransition]               = useTransition()

  const filtered = (filter === 'all' ? items : items.filter(i => i.status === filter))
    .slice()
    .sort((a, b) => {
      const diff = (voteCounts[b.id] ?? 0) - (voteCounts[a.id] ?? 0)
      return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const counts: Record<string, number> = { all: items.length }
  items.forEach(i => { counts[i.status] = (counts[i.status] ?? 0) + 1 })

  function getItemComments(itemId: string) {
    return allComments.filter(c => c.item_id === itemId)
  }

  function toggleExpand(itemId: string) {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function handleVote(itemId: string) {
    if (!userId) return
    const alreadyVoted = userVotes.has(itemId)
    setUserVotes(prev => {
      const next = new Set(prev)
      if (alreadyVoted) next.delete(itemId); else next.add(itemId)
      return next
    })
    setVoteCounts(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + (alreadyVoted ? -1 : 1)),
    }))
    startTransition(() => { voteRoadmapItem(itemId) })
  }

  async function handleSubmitIdea(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return
    setSubmitting(true); setFormError(null)
    const result = await submitRoadmapIdea(formTitle, formDesc)
    if (result?.error) { setFormError(result.error); setSubmitting(false); return }
    if (result?.data) {
      setItems(prev => [result.data as RoadmapItemData, ...prev])
      setFormTitle(''); setFormDesc(''); setShowForm(false)
    }
    setSubmitting(false)
  }

  async function handleSubmitComment(itemId: string) {
    const content = (commentDrafts[itemId] ?? '').trim()
    if (!content) return
    setSubmittingComment(itemId)
    const result = await addRoadmapComment(itemId, content)
    if (result?.data) {
      setAllComments(prev => [...prev, result.data as RoadmapCommentData])
      setCommentDrafts(prev => ({ ...prev, [itemId]: '' }))
    }
    setSubmittingComment(null)
  }

  function handleStatusChange(itemId: string, newStatus: StatusKey) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i))
    startTransition(() => { updateRoadmapStatus(itemId, newStatus) })
  }

  function handleDelete(itemId: string) {
    setItems(prev => prev.filter(i => i.id !== itemId))
    startTransition(() => { deleteRoadmapItem(itemId) })
  }

  return (
    <div style={s.wrap}>

      {/* Header */}
      <div style={s.head}>
        <div>
          <div style={s.headTitle}>
            <Rocket size={15} color="#a78bfa" weight="fill" />
            Roadmap
          </div>
          <p style={s.headSub}>Vos idées, nos priorités — construisons ensemble.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ ...s.addBtn, ...(showForm ? s.addBtnCancel : {}) }}
        >
          {showForm ? <X size={13} weight="bold" /> : <Plus size={13} weight="bold" />}
          {showForm ? 'Annuler' : 'Proposer'}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <form onSubmit={handleSubmitIdea} style={s.form}>
          <input
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Une fonctionnalité, une amélioration, une idée…"
            style={s.formInput}
            className="input-field"
            maxLength={200}
            required
            autoFocus
          />
          <textarea
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="Quelques détails si besoin (optionnel)"
            style={{ ...s.formInput, height: '68px', resize: 'vertical' as const }}
            className="input-field"
            maxLength={600}
          />
          {formError && <p style={s.errMsg}>{formError}</p>}
          <button type="submit" disabled={submitting || !formTitle.trim()} style={s.submitBtn}>
            {submitting
              ? <SpinnerGap size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Plus size={13} weight="bold" />}
            Soumettre l&apos;idée
          </button>
        </form>
      )}

      {/* Filter chips */}
      <div style={s.filters}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ ...s.chip, ...(filter === f.key ? s.chipActive : {}) }}
          >
            {f.label}
            {(counts[f.key] ?? 0) > 0 && (
              <span style={{ ...s.chipBadge, ...(filter === f.key ? s.chipBadgeActive : {}) }}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={s.empty}>
          <Lightbulb size={28} color="var(--text-muted)" weight="duotone" />
          <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: 0 }}>
            {filter === 'all'
              ? "Aucune idée pour l'instant — sois le premier !"
              : "Rien dans cette catégorie pour l'instant."}
          </p>
          {filter === 'all' && (
            <button onClick={() => setShowForm(true)} style={s.emptyBtn}>
              <Plus size={12} weight="bold" />
              Proposer la première idée
            </button>
          )}
        </div>
      )}

      {/* Items feed */}
      <div style={s.feed}>
        {filtered.map(item => {
          const cfg        = STATUS_CONFIG[item.status]
          const Icon       = cfg.icon
          const votes      = voteCounts[item.id] ?? 0
          const voted      = userVotes.has(item.id)
          const comments   = getItemComments(item.id)
          const open       = expandedItems.has(item.id)

          return (
            <div key={item.id} style={s.card}>
              <div style={s.cardRow}>

                {/* Vote button — left column */}
                <button
                  onClick={() => handleVote(item.id)}
                  disabled={!userId}
                  style={{
                    ...s.voteBtn,
                    background: voted ? `${cfg.color}18` : 'rgba(255,255,255,0.04)',
                    border:     voted ? `1px solid ${cfg.color}40` : '1px solid var(--border)',
                    color:      voted ? cfg.color : 'var(--text-3)',
                  }}
                  title={voted ? 'Retirer mon vote' : 'Voter'}
                >
                  <ArrowFatUp size={16} weight={voted ? 'fill' : 'regular'} />
                  <span style={{ ...s.voteCount, color: voted ? cfg.color : 'var(--text-2)' }}>
                    {votes}
                  </span>
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.cardTop}>
                    <span style={{ ...s.statusPill, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      <Icon size={10} weight="fill" />
                      {cfg.label}
                    </span>

                    {/* Admin status selector */}
                    {isAdmin && (
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value as StatusKey)}
                        style={s.statusSelect}
                      >
                        {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(k => (
                          <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <h4 style={s.cardTitle}>{item.title}</h4>
                  {item.description && (
                    <p style={s.cardDesc}>{item.description}</p>
                  )}

                  <div style={s.cardFoot}>
                    {item.author_name && (
                      <span style={s.author}>{item.author_name}</span>
                    )}
                    <span style={s.date}>{timeAgo(item.created_at)}</span>
                    <div style={{ flex: 1 }} />

                    {/* Comment toggle */}
                    <button
                      onClick={() => toggleExpand(item.id)}
                      style={{ ...s.commentBtn, ...(open ? s.commentBtnOpen : {}) }}
                    >
                      <ChatCircle size={13} weight={open ? 'fill' : 'regular'} />
                      {comments.length > 0 && <span>{comments.length}</span>}
                      {open ? 'Masquer' : 'Commenter'}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={s.deleteBtn}
                        title="Supprimer"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments panel */}
              {open && (
                <div style={s.commentsPanel}>
                  {comments.length > 0 && (
                    <div style={s.commentList}>
                      {comments.map(c => {
                        const initials = (c.author_name ?? 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                        const color    = avatarColor(c.author_name ?? 'A')
                        return (
                          <div key={c.id} style={s.comment}>
                            <div style={{ ...s.commentAvatar, background: `${color}18`, color, border: `1px solid ${color}30` }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={s.commentMeta}>
                                <span style={s.commentAuthor}>{c.author_name ?? 'Anonyme'}</span>
                                <span style={s.commentDate}>{timeAgo(c.created_at)}</span>
                              </div>
                              <p style={s.commentText}>{c.content}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {userId ? (
                    <div style={s.commentFormRow}>
                      <input
                        value={commentDrafts[item.id] ?? ''}
                        onChange={e => setCommentDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(item.id) } }}
                        placeholder="Ajouter un commentaire…"
                        style={s.commentInput}
                        className="input-field"
                        maxLength={400}
                      />
                      <button
                        onClick={() => handleSubmitComment(item.id)}
                        disabled={!(commentDrafts[item.id] ?? '').trim() || submittingComment === item.id}
                        style={s.commentSubmit}
                      >
                        {submittingComment === item.id
                          ? <SpinnerGap size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          : 'Envoyer'
                        }
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      Connecte-toi pour commenter.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────── Styles ─────────────────────── */
const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '16px' },

  head: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '12px', flexWrap: 'wrap',
  },
  headTitle: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px',
  },
  headSub:   { fontSize: '13px', color: 'var(--text-2)', margin: 0 },

  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 600,
    background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
    border: '1px solid rgba(167,139,250,0.25)',
    borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', flexShrink: 0,
  },
  addBtnCancel: {
    background: 'rgba(255,255,255,0.04)', color: 'var(--text-3)',
    border: '1px solid var(--border)',
  },

  form: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    background: 'rgba(167,139,250,0.04)',
    border: '1px solid rgba(167,139,250,0.18)',
    borderRadius: '14px', padding: '16px',
  },
  formInput: { width: '100%', fontSize: '13px', boxSizing: 'border-box' as const },
  errMsg:    { fontSize: '12px', color: '#f87171', margin: 0 },
  submitBtn: {
    alignSelf: 'flex-start',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 700,
    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    color: '#fff', border: 'none', borderRadius: '9px',
    padding: '9px 20px', cursor: 'pointer',
  },

  filters: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 500,
    padding: '6px 14px', borderRadius: '999px', cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    color: 'var(--text-3)',
  },
  chipActive: {
    background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
    color: '#a78bfa',
  },
  chipBadge: {
    fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)',
  },
  chipBadgeActive: {
    background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
  },

  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
    padding: '40px 20px', textAlign: 'center',
    border: '1px dashed var(--border)', borderRadius: '14px',
  },
  emptyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 600, color: '#a78bfa',
    background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
    borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
  },

  feed: { display: 'flex', flexDirection: 'column', gap: '10px' },

  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },

  cardRow: { display: 'flex', gap: '14px', padding: '16px' },

  voteBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    width: '48px', minHeight: '52px', borderRadius: '12px',
    cursor: 'pointer', flexShrink: 0, padding: '8px 0',
    transition: 'all 0.15s',
  },
  voteCount: { fontSize: '13px', fontWeight: 700 },

  cardTop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px', flexWrap: 'wrap' as const },

  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
    padding: '3px 9px', borderRadius: '999px',
  },

  statusSelect: {
    fontSize: '11px', background: 'var(--surface-2)',
    border: '1px solid var(--border)', borderRadius: '6px',
    color: 'var(--text-2)', padding: '2px 6px', cursor: 'pointer',
  } as React.CSSProperties,

  cardTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    margin: '0 0 5px', lineHeight: 1.4,
  },
  cardDesc: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6,
    margin: '0 0 10px', fontWeight: 300,
  },

  cardFoot: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const,
  },
  author:  { fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' },
  date:    { fontSize: '11px', color: 'var(--text-muted)' },

  commentBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-3)',
    background: 'none', border: '1px solid var(--border)',
    borderRadius: '7px', padding: '4px 10px', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  commentBtnOpen: {
    color: '#a78bfa', background: 'rgba(167,139,250,0.08)',
    border: '1px solid rgba(167,139,250,0.25)',
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer',
    color: 'var(--text-muted)', background: 'none',
    border: '1px solid var(--border)', flexShrink: 0,
  },

  commentsPanel: {
    borderTop: '1px solid var(--border)',
    padding: '14px 16px',
    background: 'rgba(167,139,250,0.03)',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },

  commentList: { display: 'flex', flexDirection: 'column', gap: '12px' },

  comment: { display: 'flex', gap: '10px', alignItems: 'flex-start' },

  commentAvatar: {
    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: 700,
  },

  commentMeta: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  commentAuthor: { fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' },
  commentDate:   { fontSize: '11px', color: 'var(--text-muted)' },
  commentText:   { fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 },

  commentFormRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  commentInput:   { flex: 1, fontSize: '13px', height: '36px' },
  commentSubmit: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    padding: '7px 16px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 600,
    background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
    color: '#a78bfa', flexShrink: 0,
    whiteSpace: 'nowrap' as const,
  },
}
