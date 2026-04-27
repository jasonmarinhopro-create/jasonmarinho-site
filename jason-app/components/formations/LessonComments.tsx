'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChatCircle, PaperPlaneRight, Trash, Star } from '@phosphor-icons/react'
import { listLessonComments, postLessonComment, deleteLessonComment } from '@/app/dashboard/formations/actions'

interface Comment {
  id: string
  user_id: string
  parent_id: string | null
  content: string
  display_name: string | null
  author_role: string
  created_at: string
}

interface Props {
  formationId: string
  lessonId: number
  currentUserId?: string | null
  defaultDisplayName?: string
}

export default function LessonComments({ formationId, lessonId, currentUserId, defaultDisplayName }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [content, setContent] = useState('')
  const [displayName, setDisplayName] = useState(defaultDisplayName ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  useEffect(() => {
    setLoaded(false); setComments([])
    listLessonComments(formationId, lessonId).then(res => {
      setComments(res.comments)
      setLoaded(true)
    })
  }, [formationId, lessonId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setError('')
    startTransition(async () => {
      const res = await postLessonComment({
        formationId, lessonId,
        content: content.trim(),
        displayName: displayName.trim() || undefined,
      })
      if (res.error) { setError(res.error); return }
      if (res.comment) {
        setComments(prev => [...prev, res.comment as Comment])
        setContent('')
      }
    })
  }

  function handleDelete(commentId: string) {
    if (!confirm('Supprimer ce commentaire ?')) return
    startTransition(async () => {
      const res = await deleteLessonComment(commentId)
      if (!res.error) setComments(prev => prev.filter(c => c.id !== commentId))
    })
  }

  function fmtRelative(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const min = Math.round(diff / 60000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `il y a ${min} min`
    const h = Math.round(min / 60)
    if (h < 24) return `il y a ${h} h`
    const days = Math.round(h / 24)
    if (days < 30) return `il y a ${days} j`
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <ChatCircle size={16} weight="fill" color="var(--accent-text)" />
        <h3 style={s.title}>
          Questions & commentaires
          {loaded && comments.length > 0 && <span style={s.count}>· {comments.length}</span>}
        </h3>
      </div>

      {!loaded ? (
        <div style={s.empty}>Chargement…</div>
      ) : comments.length === 0 ? (
        <div style={s.empty}>
          Sois le premier à poser une question ou partager un retour sur cette leçon.
        </div>
      ) : (
        <div style={s.list}>
          {comments.map(c => {
            const isMine = currentUserId && c.user_id === currentUserId
            const isAuthor = c.author_role === 'author' || c.author_role === 'admin'
            const initial = (c.display_name?.[0] ?? '?').toUpperCase()
            return (
              <div key={c.id} style={{ ...s.item, ...(isAuthor ? s.itemAuthor : {}) }}>
                <div style={{ ...s.avatar, background: isAuthor ? 'var(--accent-text)' : 'var(--surface-2)', color: isAuthor ? 'var(--bg)' : 'var(--text-2)' }}>
                  {initial}
                </div>
                <div style={s.body}>
                  <div style={s.metaRow}>
                    <span style={s.author}>
                      {c.display_name ?? 'Apprenant'}
                      {isAuthor && (
                        <span style={s.authorBadge}>
                          <Star size={9} weight="fill" />
                          Auteur
                        </span>
                      )}
                    </span>
                    <span style={s.date}>{fmtRelative(c.created_at)}</span>
                    {isMine && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={s.delBtn}
                        title="Supprimer"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                  <p style={s.content}>{c.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Ton prénom (optionnel)"
            style={s.nameInput}
          />
          <div style={s.textareaWrap}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Une question ? Un retour ? Partage avec la communauté…"
              rows={3}
              style={s.textarea}
              maxLength={4000}
            />
            <button
              type="submit"
              disabled={!content.trim() || isPending}
              style={{ ...s.submitBtn, opacity: content.trim() && !isPending ? 1 : 0.5, cursor: content.trim() && !isPending ? 'pointer' : 'not-allowed' }}
            >
              <PaperPlaneRight size={13} weight="fill" />
              {isPending ? 'Envoi…' : 'Publier'}
            </button>
          </div>
          {error && <p style={s.error}>{error}</p>}
        </form>
      ) : (
        <div style={s.empty}>Connecte-toi pour participer à la discussion.</div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: '32px', padding: '20px 24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
  },
  header: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 500, color: 'var(--text)', margin: 0 },
  count: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' },
  empty: { fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '14px' },
  item: { display: 'flex', gap: '12px', padding: '12px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '10px' },
  itemAuthor: { background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-fraunces), serif', flexShrink: 0 },
  body: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  author: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' },
  authorBadge: { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase', padding: '2px 6px', background: 'var(--bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', borderRadius: '100px' },
  date: { fontSize: '11px', color: 'var(--text-muted)' },
  delBtn: { marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' },
  content: { fontSize: '13.5px', color: 'var(--text-2)', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' as const },

  form: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  nameInput: { padding: '8px 12px', fontSize: '12.5px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', maxWidth: '240px' },
  textareaWrap: { position: 'relative' as const },
  textarea: { width: '100%', boxSizing: 'border-box' as const, padding: '10px 12px 40px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', outline: 'none', resize: 'vertical' as const, minHeight: '70px' },
  submitBtn: { position: 'absolute' as const, right: '8px', bottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--bg)', background: 'var(--accent-text)', border: 'none', borderRadius: '7px', fontFamily: 'inherit' },
  error: { fontSize: '12px', color: '#ef4444', margin: 0 },
}
