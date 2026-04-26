'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChatCircle, PushPin, Lock, Trash, LockOpen,
  ArrowFatUp, Pencil, X, Check,
} from '@phosphor-icons/react'
import { CATEGORIES, CATEGORY_ORDER, type CategoryId } from '@/lib/chez-nous/categories'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { BADGES, type BadgeId } from '@/lib/badges'
import RichText from '@/components/chez-nous/RichText'
import MarkdownToolbar from '@/components/chez-nous/MarkdownToolbar'
import {
  createReply, deletePost, deleteReply, togglePinPost, toggleLockPost,
  updatePost, updateReply, togglePostVote,
} from '../actions'

type Author = {
  full_name: string | null
  pseudo: string | null
  role: string | null
  is_contributor: boolean
  created_at: string | null
  badges: BadgeId[]
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
  vote_count: number
  created_at: string
  edited_at: string | null
  has_voted: boolean
}

type Reply = {
  id: string
  author_id: string
  body: string
  created_at: string
  edited_at: string | null
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
  const canEdit     = post.author_id === currentUserId
  const canDelete   = isAdmin || post.author_id === currentUserId

  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [voted, setVoted] = useState(post.has_voted)
  const [voteCount, setVoteCount] = useState(post.vote_count)

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

  const onVote = () => {
    const wasVoted = voted
    setVoted(!wasVoted)
    setVoteCount(c => c + (wasVoted ? -1 : 1))
    startTransition(async () => {
      await togglePostVote(post.id, wasVoted)
      router.refresh()
    })
  }

  return (
    <div style={s.page}>
      <Link href="/dashboard/chez-nous" style={s.back}>
        <ArrowLeft size={14} weight="bold" /> Retour à Chez Nous
      </Link>

      <div style={s.layout}>
        <div style={s.mainCol}>

      {/* Post principal */}
      <article style={s.postBlock}>
        <div style={s.postHead}>
          <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>
            {cat.short}
          </span>
          {post.pinned && (
            <span style={{ ...s.flag, color: 'var(--accent-text)', background: 'rgba(255,213,107,0.12)' }}>
              <PushPin size={11} weight="fill" /> Épinglé
            </span>
          )}
          {post.locked && (
            <span style={{ ...s.flag, color: '#94a3b8', background: 'rgba(148,163,184,0.12)' }}>
              <Lock size={11} weight="fill" /> Verrouillé
            </span>
          )}
        </div>

        {editing ? (
          <EditPostForm post={post} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); router.refresh() }} />
        ) : (
          <>
            <h1 style={s.postTitle}>{post.title}</h1>

            <div style={s.authorRow}>
              <Link href={`/dashboard/chez-nous/membre/${post.author_id}`} style={{ ...s.avatar, background: av.bg, color: av.text }}>
                {initials}
              </Link>
              <div style={s.authorInfo}>
                <Link href={`/dashboard/chez-nous/membre/${post.author_id}`} style={s.authorNameLink}>
                  {name}
                  {author?.is_contributor && <span style={s.contribDot} title="Contributeur" />}
                  {author?.role === 'admin' && <span style={s.adminTag}>admin</span>}
                </Link>
                <div style={s.dateRow}>
                  <span style={s.authorDate}>{formatRelative(post.created_at)}</span>
                  {post.edited_at && <span style={s.editedTag}>· modifié</span>}
                </div>
                {(author?.badges ?? []).length > 0 && (
                  <div style={s.badgeStrip}>
                    {(author?.badges ?? []).slice(0, 4).map(bid => (
                      <span key={bid} title={BADGES[bid].title} style={{ ...s.miniBadge, background: BADGES[bid].bg }}>
                        {BADGES[bid].label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.actions}>
                <button onClick={onVote} disabled={pending} style={{
                  ...s.voteBtn,
                  color: voted ? 'var(--accent-text)' : 'var(--text-2)',
                  background: voted ? 'rgba(255,213,107,0.10)' : 'transparent',
                  borderColor: voted ? 'rgba(255,213,107,0.3)' : 'var(--border)',
                }} title={voted ? 'Retirer mon vote' : 'Marquer utile'}>
                  <ArrowFatUp size={13} weight={voted ? 'fill' : 'regular'} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{voteCount}</span>
                </button>
                {canEdit && (
                  <button onClick={() => setEditing(true)} style={s.actionBtn} title="Modifier">
                    <Pencil size={13} />
                  </button>
                )}
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

            <RichText text={post.body} style={s.postBody} />
          </>
        )}
      </article>

      {/* Réponses */}
      <div style={s.repliesHead}>
        <ChatCircle size={14} color="var(--accent-text)" weight="fill" />
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
            const ra        = usersMap[reply.author_id]
            const rav       = colorFromId(reply.author_id)
            const rinitials = ra ? displayInitials({ pseudo: ra.pseudo, full_name: ra.full_name }) : '?'
            const rname     = ra ? displayName({ pseudo: ra.pseudo, full_name: ra.full_name }) : 'Anonyme'
            const canDelReply  = isAdmin || reply.author_id === currentUserId
            const canEditReply = reply.author_id === currentUserId

            return (
              <ReplyBlock
                key={reply.id}
                reply={reply}
                postId={post.id}
                authorId={reply.author_id}
                authorName={rname}
                authorInitials={rinitials}
                avatarColor={rav}
                badges={ra?.badges ?? []}
                isContributor={ra?.is_contributor ?? false}
                isAdminAuthor={ra?.role === 'admin'}
                canDelete={canDelReply}
                canEdit={canEditReply}
              />
            )
          })
        )}
      </div>

      {!post.locked && <ReplyForm postId={post.id} />}
        </div>

        {/* Aside auteur */}
        <aside style={s.aside}>
          <AuthorAside
            authorId={post.author_id}
            name={name}
            initials={initials}
            avatarColor={av}
            isContributor={author?.is_contributor ?? false}
            isAdmin={author?.role === 'admin'}
            createdAt={author?.created_at ?? null}
            badges={author?.badges ?? []}
          />
          <PostInfoAside post={post} replyCount={replies.length} />
        </aside>
      </div>
    </div>
  )
}

// ─── Author aside card ──────────────────────────────────────────────

function AuthorAside({ authorId, name, initials, avatarColor, isContributor, isAdmin, createdAt, badges }: {
  authorId: string
  name: string
  initials: string
  avatarColor: { bg: string; text: string }
  isContributor: boolean
  isAdmin: boolean
  createdAt: string | null
  badges: BadgeId[]
}) {
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <span style={s.asideTitle}>À propos de l'auteur</span>
      </div>
      <Link href={`/dashboard/chez-nous/membre/${authorId}`} style={s.authorAsideRow}>
        <div style={{ ...s.avatarLg, background: avatarColor.bg, color: avatarColor.text }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.authorNameLg}>
            {name}
            {isContributor && <span style={s.contribDot} />}
          </div>
          {isAdmin && <span style={s.adminTag}>admin</span>}
          {createdAt && (
            <div style={s.authorSince}>
              Membre depuis {new Date(createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      </Link>
      {badges.length > 0 && (
        <div style={s.asideBadges}>
          {badges.map(bid => (
            <span key={bid} title={BADGES[bid].title} style={{ ...s.miniBadge, background: BADGES[bid].bg }}>
              {BADGES[bid].label}
            </span>
          ))}
        </div>
      )}
      <Link href={`/dashboard/chez-nous/membre/${authorId}`} style={s.asideLink}>
        Voir le profil →
      </Link>
    </div>
  )
}

function PostInfoAside({ post, replyCount }: { post: Post; replyCount: number }) {
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <span style={s.asideTitle}>Cette discussion</span>
      </div>
      <div style={s.statsList}>
        <div style={s.statRow2}>
          <span style={s.statValue}>{post.vote_count}</span>
          <span style={s.statLabel}>vote{post.vote_count > 1 ? 's' : ''} utile{post.vote_count > 1 ? 's' : ''}</span>
        </div>
        <div style={s.statRow2}>
          <span style={s.statValue}>{replyCount}</span>
          <span style={s.statLabel}>réponse{replyCount > 1 ? 's' : ''}</span>
        </div>
        <div style={s.statRow2}>
          <span style={s.statValueSmall}>{formatRelative(post.created_at)}</span>
          <span style={s.statLabel}>créée</span>
        </div>
      </div>
    </div>
  )
}

// ─── Edit post form ─────────────────────────────────────────────────

function EditPostForm({ post, onCancel, onSaved }: { post: Post; onCancel: () => void; onSaved: () => void }) {
  const [category, setCategory] = useState<CategoryId>(post.category)
  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const taRef = useRef<HTMLTextAreaElement>(null!)

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await updatePost({ postId: post.id, title, body, category })
      if (res.ok) onSaved()
      else setError(res.error ?? 'Erreur')
    })
  }

  return (
    <div style={s.editForm}>
      <select value={category} onChange={e => setCategory(e.target.value as CategoryId)} style={s.select}>
        {CATEGORY_ORDER.map(cid => (
          <option key={cid} value={cid}>{CATEGORIES[cid].label}</option>
        ))}
      </select>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} style={s.input} />
      <MarkdownToolbar textareaRef={taRef} value={body} onChange={setBody} />
      <textarea ref={taRef} value={body} onChange={e => setBody(e.target.value)} rows={8} maxLength={8000} style={s.textarea} />
      {error && <p style={s.error}>{error}</p>}
      <div style={s.formActions}>
        <button onClick={onCancel} style={s.btnGhost} disabled={pending}>Annuler</button>
        <button onClick={submit} style={s.btnPrimary} disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ─── Reply block ────────────────────────────────────────────────────

function ReplyBlock({ reply, postId, authorId, authorName, authorInitials, avatarColor, badges, isContributor, isAdminAuthor, canDelete, canEdit }: {
  reply: Reply
  postId: string
  authorId: string
  authorName: string
  authorInitials: string
  avatarColor: { bg: string; text: string }
  badges: BadgeId[]
  isContributor: boolean
  isAdminAuthor: boolean
  canDelete: boolean
  canEdit: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(reply.body)
  const [pending, startTransition] = useTransition()
  const taRef = useRef<HTMLTextAreaElement>(null!)

  const onDelete = () => {
    if (!confirm('Supprimer cette réponse ?')) return
    startTransition(async () => {
      const res = await deleteReply(reply.id, postId)
      if (res.ok) router.refresh()
      else alert(res.error)
    })
  }

  const onSave = () => {
    startTransition(async () => {
      const res = await updateReply({ replyId: reply.id, postId, body })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div style={s.replyCard}>
      <Link href={`/dashboard/chez-nous/membre/${authorId}`} style={{ ...s.avatar, background: avatarColor.bg, color: avatarColor.text }}>
        {authorInitials}
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.replyMeta}>
          <Link href={`/dashboard/chez-nous/membre/${authorId}`} style={s.authorNameLink}>
            {authorName}
            {isContributor && <span style={s.contribDot} />}
            {isAdminAuthor && <span style={s.adminTag}>admin</span>}
          </Link>
          {badges.slice(0, 3).map(bid => (
            <span key={bid} title={BADGES[bid].title} style={{ ...s.miniBadge, background: BADGES[bid].bg }}>
              {BADGES[bid].label}
            </span>
          ))}
          <span style={s.authorDate}>{formatRelative(reply.created_at)}</span>
          {reply.edited_at && <span style={s.editedTag}>· modifié</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} style={s.actionBtnSmall} title="Modifier">
                <Pencil size={12} />
              </button>
            )}
            {canDelete && (
              <button onClick={onDelete} style={{ ...s.actionBtnSmall, color: '#fb7185' }} disabled={pending}>
                <Trash size={12} />
              </button>
            )}
          </div>
        </div>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <MarkdownToolbar textareaRef={taRef} value={body} onChange={setBody} />
            <textarea ref={taRef} value={body} onChange={e => setBody(e.target.value)} rows={4} maxLength={4000} style={s.textarea} />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setBody(reply.body); setEditing(false) }} style={s.btnGhostSmall} disabled={pending}>
                <X size={11} /> Annuler
              </button>
              <button onClick={onSave} style={s.btnPrimarySmall} disabled={pending || !body.trim()}>
                <Check size={11} /> {pending ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <RichText text={reply.body} style={s.replyBody} />
        )}
      </div>
    </div>
  )
}

// ─── Reply form ────────────────────────────────────────────────────

function ReplyForm({ postId }: { postId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const taRef = useRef<HTMLTextAreaElement>(null!)

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
      <MarkdownToolbar textareaRef={taRef} value={body} onChange={setBody} />
      <textarea
        ref={taRef}
        value={body} onChange={e => setBody(e.target.value)}
        placeholder="Réponds, partage ton expérience, propose une piste…"
        style={s.textarea} rows={5} maxLength={4000}
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

// ─── Styles ────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%' },

  layout: {
    display: 'flex', gap: 'clamp(14px, 2vw, 24px)',
    flexWrap: 'wrap', alignItems: 'flex-start',
  },
  mainCol: { flex: '1 1 600px', minWidth: 0 },
  aside: {
    flex: '0 1 300px',
    minWidth: '260px',
    display: 'flex', flexDirection: 'column', gap: '14px',
    position: 'sticky', top: '20px',
  },
  asideCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: 'clamp(14px, 2.5vw, 18px)',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  asideHead: { display: 'flex', alignItems: 'center', gap: '7px' },
  asideTitle: {
    fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.6px', color: 'var(--text-2)',
  },
  authorAsideRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    textDecoration: 'none', color: 'inherit',
  },
  avatarLg: {
    width: '48px', height: '48px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '17px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  authorNameLg: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
  },
  authorSince: {
    fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px',
  },
  asideBadges: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  asideLink: {
    fontSize: '12px', color: 'var(--accent-text)', fontWeight: 600,
    textDecoration: 'none',
  },
  statsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  statRow2: { display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' },
  statValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 400, color: 'var(--text)', lineHeight: 1,
  },
  statValueSmall: {
    fontSize: '13px', color: 'var(--text)', fontWeight: 600,
  },
  statLabel: { fontSize: '11px', color: 'var(--text-2)' },


  back: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--text-muted)',
    textDecoration: 'none', marginBottom: '16px',
  },

  postBlock: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: 'clamp(16px, 3vw, 24px)',
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
    display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px',
    paddingBottom: '14px', borderBottom: '1px solid var(--border)',
  },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0, textDecoration: 'none',
  },
  authorInfo: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  authorNameLink: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    textDecoration: 'none',
  },
  dateRow: { display: 'flex', alignItems: 'center', gap: '5px' },
  authorDate: { fontSize: '11px', color: 'var(--text-muted)' },
  editedTag: { fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' },
  contribDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--accent-text)', display: 'inline-block',
  },
  adminTag: {
    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: '#fb7185',
    background: 'rgba(251,113,133,0.12)', padding: '1px 6px', borderRadius: '4px',
  },
  badgeStrip: { display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' },
  miniBadge: {
    fontSize: '11px', lineHeight: 1, padding: '2px 4px', borderRadius: '5px',
  },
  actions: { display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  voteBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'transparent', border: '1px solid',
    borderRadius: '8px', padding: '5px 10px',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  },
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
    padding: '2px 5px',
  },
  postBody: {
    fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)',
    whiteSpace: 'pre-wrap',
  },

  editForm: {
    display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px',
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
  select: {
    background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '9px 12px', fontSize: '13px',
  },
  input: {
    background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', fontSize: '14px',
  },
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
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' },
  btnGhost: {
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
  },
  btnGhostSmall: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '6px',
    padding: '5px 10px', fontSize: '12px', cursor: 'pointer',
  },
  btnPrimary: {
    background: '#ffd56b', color: '#1a1a0e',
    border: 'none', borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
  btnPrimarySmall: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: '#ffd56b', color: '#1a1a0e',
    border: 'none', borderRadius: '6px',
    padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
  },
}
