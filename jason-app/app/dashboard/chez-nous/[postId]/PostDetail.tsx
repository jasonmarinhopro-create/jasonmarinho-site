'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChatCircle, PushPin, Lock, Trash, LockOpen } from '@phosphor-icons/react'
import { CATEGORIES, type CategoryId } from '@/lib/chez-nous/categories'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { createReply, deletePost, deleteReply, togglePinPost, toggleLockPost } from '../actions'

type Author = {
  full_name: string | null
  pseudo: string | null
  role: string | null
  is_contributor: boolean
  created_at: string | null
}

type Post = {
  id: string
  author_id: string
  category: CategoryId
  title: string
  body: string
  pinned: boolean
  locked: boolean
  reply_count: number
  created_at: string
}

type Reply = {
  id: string
  author_id: string
  body: string
  created_at: string
}

type Props = {
  post: Post
  replies: Reply[]
  usersMap: Record<string, Author>
  currentUserId: string
  isAdmin: boolean
}

export default function PostDetail({ post, replies, usersMap, currentUserId, isAdmin }: Props) {
  const router = useRouter()
  const cat    = CATEGORIES[post.category]
  const author = usersMap[post.author_id]
  const av     = colorFromId(post.author_id)
  const initials = author ? displayInitials({ pseudo: author.pseudo, full_name: author.full_name }) : '?'
  const name     = author ? displayName({ pseudo: author.pseudo, full_name: author.full_name }) : 'Anonyme'

  const canModerate = isAdmin
  const canDelete   = isAdmin || post.author_id === currentUserId

  const [pending, startTransition] = useTransition()

  const onDelete = () => {
    if (!confirm('Supprimer cette discussion ?')) return
    startTransition(async () => {
      const res = await deletePost(post.id)
      if (res.ok) router.push('/dashboard/chez-nous')
      else alert(res.error)
    })
  }

  const onTogglePin = () => {
    startTransition(async () => {
      await togglePinPost(post.id, !post.pinned)
      router.refresh()
    })
  }

  const onToggleLock = () => {
    startTransition(async () => {
      await toggleLockPost(post.id, !post.locked)
      router.refresh()
    })
  }

  return (
    <div style={s.page}>
      <Link href="/dashboard/chez-nous" style={s.back}>
        <ArrowLeft size={14} weight="bold" /> Retour à Chez Nous
      </Link>

      {/* Post principal */}
      <article style={s.postBlock}>
        <div style={s.postHead}>
          <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>
            {cat.short}
          </span>
          {post.pinned && (
            <span style={{ ...s.flag, color: '#FFD56B', background: 'rgba(255,213,107,0.12)' }}>
              <PushPin size={11} weight="fill" /> Épinglé
            </span>
          )}
          {post.locked && (
            <span style={{ ...s.flag, color: '#94a3b8', background: 'rgba(148,163,184,0.12)' }}>
              <Lock size={11} weight="fill" /> Verrouillé
            </span>
          )}
        </div>

        <h1 style={s.postTitle}>{post.title}</h1>

        <div style={s.authorRow}>
          <div style={{ ...s.avatar, background: av.bg, color: av.text }}>{initials}</div>
          <div style={s.authorInfo}>
            <span style={s.authorName}>
              {name}
              {author?.is_contributor && <span style={s.contribDot} title="Contributeur" />}
              {author?.role === 'admin' && <span style={s.adminTag}>admin</span>}
            </span>
            <span style={s.authorDate}>{formatRelative(post.created_at)}</span>
          </div>

          {/* Actions */}
          <div style={s.actions}>
            {canModerate && (
              <>
                <button onClick={onTogglePin} style={s.actionBtn} disabled={pending} title={post.pinned ? 'Désépingler' : 'Épingler'}>
                  <PushPin size={13} weight={post.pinned ? 'fill' : 'regular'} />
                </button>
                <button onClick={onToggleLock} style={s.actionBtn} disabled={pending} title={post.locked ? 'Déverrouiller' : 'Verrouiller'}>
                  {post.locked ? <LockOpen size={13} /> : <Lock size={13} />}
                </button>
              </>
            )}
            {canDelete && (
              <button onClick={onDelete} style={{ ...s.actionBtn, color: '#fb7185' }} disabled={pending} title="Supprimer">
                <Trash size={13} />
              </button>
            )}
          </div>
        </div>

        <div style={s.postBody}>
          {post.body.split('\n').map((line, i) => (
            <p key={i} style={{ margin: '0 0 8px' }}>{line || ' '}</p>
          ))}
        </div>
      </article>

      {/* Réponses */}
      <div style={s.repliesHead}>
        <ChatCircle size={14} color="#FFD56B" weight="fill" />
        <span>{replies.length} réponse{replies.length > 1 ? 's' : ''}</span>
      </div>

      <div style={s.repliesList}>
        {replies.length === 0 ? (
          <div style={s.empty}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Pas encore de réponse — {post.locked ? 'le sujet est verrouillé.' : 'sois le premier à répondre.'}
            </p>
          </div>
        ) : (
          replies.map(reply => {
            const ra  = usersMap[reply.author_id]
            const rav = colorFromId(reply.author_id)
            const rinitials = ra ? displayInitials({ pseudo: ra.pseudo, full_name: ra.full_name }) : '?'
            const rname     = ra ? displayName({ pseudo: ra.pseudo, full_name: ra.full_name }) : 'Anonyme'
            const canDelReply = isAdmin || reply.author_id === currentUserId

            return (
              <ReplyBlock
                key={reply.id}
                reply={reply}
                postId={post.id}
                authorName={rname}
                authorInitials={rinitials}
                avatarColor={rav}
                isContributor={ra?.is_contributor ?? false}
                isAdminAuthor={ra?.role === 'admin'}
                canDelete={canDelReply}
              />
            )
          })
        )}
      </div>

      {/* Form réponse */}
      {!post.locked && <ReplyForm postId={post.id} />}
    </div>
  )
}

// ─── Reply block ────────────────────────────────────────────────────────

function ReplyBlock({ reply, postId, authorName, authorInitials, avatarColor, isContributor, isAdminAuthor, canDelete }: {
  reply: Reply
  postId: string
  authorName: string
  authorInitials: string
  avatarColor: { bg: string; text: string }
  isContributor: boolean
  isAdminAuthor: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const onDelete = () => {
    if (!confirm('Supprimer cette réponse ?')) return
    startTransition(async () => {
      const res = await deleteReply(reply.id, postId)
      if (res.ok) router.refresh()
      else alert(res.error)
    })
  }

  return (
    <div style={s.replyCard}>
      <div style={{ ...s.avatar, background: avatarColor.bg, color: avatarColor.text }}>
        {authorInitials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.replyMeta}>
          <span style={s.authorName}>
            {authorName}
            {isContributor && <span style={s.contribDot} />}
            {isAdminAuthor && <span style={s.adminTag}>admin</span>}
          </span>
          <span style={s.authorDate}>{formatRelative(reply.created_at)}</span>
          {canDelete && (
            <button onClick={onDelete} style={{ ...s.actionBtnSmall, color: '#fb7185' }} disabled={pending}>
              <Trash size={12} />
            </button>
          )}
        </div>
        <div style={s.replyBody}>
          {reply.body.split('\n').map((line, i) => (
            <p key={i} style={{ margin: '0 0 6px' }}>{line || ' '}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Reply form ─────────────────────────────────────────────────────────

function ReplyForm({ postId }: { postId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createReply({ postId, body })
      if (res.ok) {
        setBody('')
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div style={s.replyForm}>
      <label style={s.label}>Ta réponse</label>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Réponds, partage ton expérience, propose une piste…"
        style={s.textarea}
        rows={5}
        maxLength={4000}
      />
      <p style={s.helper}>{body.length}/4000</p>
      {error && <p style={s.error}>{error}</p>}
      <div style={s.formActions}>
        <button onClick={submit} style={s.btnPrimary} disabled={pending || !body.trim()}>
          {pending ? 'Publication…' : 'Répondre'}
        </button>
      </div>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '820px' },

  back: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--text-muted)',
    textDecoration: 'none', marginBottom: '16px',
  },

  postBlock: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
  },
  postHead: {
    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
    flexWrap: 'wrap',
  },
  catChip: {
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    padding: '3px 9px', borderRadius: '999px',
  },
  flag: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: 600,
    padding: '3px 8px', borderRadius: '999px',
  },
  postTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 400,
    color: 'var(--text)', margin: '4px 0 16px', lineHeight: 1.3,
  },
  authorRow: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
    paddingBottom: '14px', borderBottom: '1px solid var(--border)',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  authorInfo: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  authorName: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
  },
  authorDate: { fontSize: '11px', color: 'var(--text-muted)' },
  contribDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: '#FFD56B', display: 'inline-block',
  },
  adminTag: {
    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: '#fb7185',
    background: 'rgba(251,113,133,0.12)', padding: '1px 6px', borderRadius: '4px',
  },
  actions: { display: 'flex', gap: '4px' },
  actionBtn: {
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', borderRadius: '6px',
    width: '28px', height: '28px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  actionBtnSmall: {
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    padding: '2px 5px', marginLeft: 'auto',
  },
  postBody: {
    fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)',
    whiteSpace: 'pre-wrap',
  },

  repliesHead: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
    margin: '24px 0 12px',
  },
  repliesList: { display: 'flex', flexDirection: 'column', gap: '10px' },

  replyCard: {
    display: 'flex', gap: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '14px',
  },
  replyMeta: {
    display: 'flex', alignItems: 'center', gap: '6px',
    marginBottom: '6px', flexWrap: 'wrap',
  },
  replyBody: {
    fontSize: '13.5px', lineHeight: 1.65, color: 'var(--text-2)',
    whiteSpace: 'pre-wrap',
  },

  empty: {
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '12px', padding: '20px', textAlign: 'center',
  },

  replyForm: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '18px', marginTop: '20px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' },
  helper: { fontSize: '11px', color: 'var(--text-muted)', margin: 0 },
  textarea: {
    background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '12px', fontSize: '14px', resize: 'vertical',
    fontFamily: 'inherit', lineHeight: 1.6,
  },
  error: {
    color: '#fb7185', fontSize: '12px', margin: 0,
    background: 'rgba(251,113,133,0.08)',
    padding: '6px 10px', borderRadius: '6px',
    border: '1px solid rgba(251,113,133,0.2)',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', marginTop: '4px' },
  btnPrimary: {
    background: '#FFD56B', color: '#1a1a0e',
    border: 'none', borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
}
