'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { House, Plus, ChatCircle, PushPin, Lock } from '@phosphor-icons/react'
import { CATEGORIES, CATEGORY_ORDER, type CategoryId } from '@/lib/chez-nous/categories'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { createPost } from './actions'

type Post = {
  id: string
  author_id: string
  category: CategoryId
  title: string
  body: string
  pinned: boolean
  locked: boolean
  reply_count: number
  last_reply_at: string | null
  created_at: string
}

type Author = {
  full_name: string | null
  pseudo: string | null
  role: string | null
  is_contributor: boolean
  created_at: string | null
}

type Props = {
  posts: Post[]
  authorsMap: Record<string, Author>
  currentUserId: string
  isAdmin: boolean
  currentCategory: CategoryId | 'all'
  stats: { totalPosts: number; totalReplies: number }
}

export default function ChezNousFeed({ posts, authorsMap, currentCategory, stats }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroBadge}>
          <House size={13} color="#FFD56B" weight="fill" />
          Chez Nous · Communauté ouverte
        </div>
        <h1 style={s.heroTitle}>
          Bienvenue <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>Chez Nous</em>
        </h1>
        <p style={s.heroDesc}>
          L'espace pour échanger, demander un coup de main, partager ce qui marche.
          Entre hôtes LCD, sans détour.
        </p>

        <div style={s.statRow}>
          <span style={s.statItem}><strong style={{ color: 'var(--text)' }}>{stats.totalPosts}</strong> discussion{stats.totalPosts > 1 ? 's' : ''}</span>
          <span style={s.statSep}>·</span>
          <span style={s.statItem}><strong style={{ color: 'var(--text)' }}>{stats.totalReplies}</strong> réponse{stats.totalReplies > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Catégories */}
      <div style={s.catRow}>
        <CategoryChip
          id="all"
          label="Tout"
          color="#FFD56B"
          bg="rgba(255,213,107,0.14)"
          active={currentCategory === 'all'}
        />
        {CATEGORY_ORDER.map(cid => (
          <CategoryChip
            key={cid}
            id={cid}
            label={CATEGORIES[cid].short}
            color={CATEGORIES[cid].color}
            bg={CATEGORIES[cid].bg}
            active={currentCategory === cid}
          />
        ))}
      </div>

      {/* Bouton nouveau post */}
      <div style={s.actionsRow}>
        <button onClick={() => setShowForm(s => !s)} style={s.newBtn}>
          <Plus size={15} weight="bold" />
          {showForm ? 'Annuler' : 'Nouvelle discussion'}
        </button>
      </div>

      {/* Form création */}
      {showForm && (
        <NewPostForm onSuccess={() => setShowForm(false)} defaultCategory={currentCategory === 'all' ? 'autres' : currentCategory} />
      )}

      {/* Feed */}
      <div style={s.feed}>
        {posts.length === 0 ? (
          <div style={s.empty}>
            <ChatCircle size={28} color="#FFD56B" weight="duotone" />
            <p style={s.emptyTitle}>Aucune discussion {currentCategory !== 'all' ? 'dans cette catégorie' : 'pour le moment'}</p>
            <p style={s.emptyDesc}>Sois le premier à lancer le sujet — un problème, une astuce, un retour.</p>
          </div>
        ) : (
          posts.map(post => {
            const author = authorsMap[post.author_id]
            const cat    = CATEGORIES[post.category]
            const av     = author ? colorFromId(post.author_id) : { bg: 'rgba(148,163,184,0.18)', text: '#94a3b8' }
            const initials = author ? displayInitials({ pseudo: author.pseudo, full_name: author.full_name }) : '?'
            const name     = author ? displayName({ pseudo: author.pseudo, full_name: author.full_name }) : 'Anonyme'

            return (
              <Link key={post.id} href={`/dashboard/chez-nous/${post.id}`} style={s.postCard}>
                {/* Avatar */}
                <div style={{ ...s.avatar, background: av.bg, color: av.text }}>
                  {initials}
                </div>

                {/* Contenu */}
                <div style={s.postBody}>
                  <div style={s.postMeta}>
                    <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>
                      {cat.short}
                    </span>
                    {post.pinned && <PushPin size={12} color="#FFD56B" weight="fill" />}
                    {post.locked && <Lock size={12} color="#94a3b8" weight="fill" />}
                  </div>
                  <h3 style={s.postTitle}>{post.title}</h3>
                  <p style={s.postExcerpt}>{post.body.slice(0, 180)}{post.body.length > 180 ? '…' : ''}</p>
                  <div style={s.postFoot}>
                    <span style={s.postFootName}>
                      {name}
                      {author?.is_contributor && <span style={s.contribDot} title="Contributeur" />}
                    </span>
                    <span style={s.postFootDot}>·</span>
                    <span>{formatRelative(post.last_reply_at ?? post.created_at)}</span>
                    <span style={s.postFootDot}>·</span>
                    <span style={s.postReplies}>
                      <ChatCircle size={11} weight="fill" />
                      {post.reply_count}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────

function CategoryChip({ id, label, color, bg, active }: {
  id: string; label: string; color: string; bg: string; active: boolean
}) {
  const href = id === 'all' ? '/dashboard/chez-nous' : `/dashboard/chez-nous?cat=${id}`
  return (
    <Link
      href={href}
      style={{
        ...s.catLink,
        color,
        background: active ? bg : 'transparent',
        borderColor: active ? `${color}55` : 'var(--border)',
      }}
    >
      {label}
    </Link>
  )
}

function NewPostForm({ onSuccess, defaultCategory }: { onSuccess: () => void; defaultCategory: CategoryId }) {
  const [category, setCategory] = useState<CategoryId>(defaultCategory)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createPost({ category, title, body })
      if (res.ok) {
        setTitle(''); setBody('')
        onSuccess()
        router.push(`/dashboard/chez-nous/${res.postId}`)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div style={s.form}>
      <div style={s.formField}>
        <label style={s.label}>Catégorie</label>
        <select value={category} onChange={e => setCategory(e.target.value as CategoryId)} style={s.select}>
          {CATEGORY_ORDER.map(cid => (
            <option key={cid} value={cid}>{CATEGORIES[cid].label}</option>
          ))}
        </select>
        <p style={s.helper}>{CATEGORIES[category].description}</p>
      </div>

      <div style={s.formField}>
        <label style={s.label}>Titre</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Un sujet précis et clair…"
          style={s.input}
          maxLength={200}
        />
        <p style={s.helper}>{title.length}/200 — pose ta question ou ton sujet en une phrase</p>
      </div>

      <div style={s.formField}>
        <label style={s.label}>Message</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Détaille ton contexte, ce que tu as déjà essayé, ce que tu cherches…"
          style={s.textarea}
          rows={6}
          maxLength={8000}
        />
        <p style={s.helper}>{body.length}/8000</p>
      </div>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.formActions}>
        <button onClick={onSuccess} style={s.btnGhost} disabled={pending}>Annuler</button>
        <button onClick={submit} style={s.btnPrimary} disabled={pending || !title.trim() || !body.trim()}>
          {pending ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '900px' },

  hero: { marginBottom: '24px' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: '#FFD56B', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '999px', padding: '4px 12px', marginBottom: '14px',
  },
  heroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400,
    color: 'var(--text)', margin: '0 0 10px',
  },
  heroDesc: {
    fontSize: '14px', lineHeight: 1.7, color: 'var(--text-2)',
    maxWidth: '560px', margin: 0,
  },
  statRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '12px', color: 'var(--text-muted)', marginTop: '14px',
  },
  statItem: {},
  statSep:  { opacity: 0.5 },

  catRow: {
    display: 'flex', flexWrap: 'wrap', gap: '8px',
    marginBottom: '16px',
  },
  catLink: {
    fontSize: '12px', fontWeight: 600,
    padding: '7px 14px', borderRadius: '999px',
    border: '1px solid', textDecoration: 'none',
    transition: 'background 0.15s',
  },

  actionsRow: {
    display: 'flex', justifyContent: 'flex-end', marginBottom: '12px',
  },
  newBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: 'linear-gradient(135deg, #FFD56B 0%, #f59e0b 100%)',
    color: '#1a1a0e', fontWeight: 700, fontSize: '13px',
    padding: '9px 18px', borderRadius: '10px',
    border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255,213,107,0.18)',
  },

  form: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '14px',
    marginBottom: '20px',
  },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
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
    padding: '8px 12px', borderRadius: '8px',
    border: '1px solid rgba(251,113,133,0.2)',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  btnGhost: {
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
  },
  btnPrimary: {
    background: '#FFD56B', color: '#1a1a0e',
    border: 'none', borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },

  feed: { display: 'flex', flexDirection: 'column', gap: '10px' },
  empty: {
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '14px', padding: '36px 20px',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
  },
  emptyTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '6px 0 0',
  },
  emptyDesc: {
    fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '380px',
  },

  postCard: {
    display: 'flex', gap: '14px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '16px',
    textDecoration: 'none', color: 'inherit',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  postBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' },
  postMeta: { display: 'flex', alignItems: 'center', gap: '6px' },
  catChip: {
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    padding: '2px 8px', borderRadius: '999px',
  },
  postTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    margin: '2px 0', lineHeight: 1.35,
  },
  postExcerpt: {
    fontSize: '13px', color: 'var(--text-2)',
    margin: 0, lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  postFoot: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px',
    flexWrap: 'wrap' as const,
  },
  postFootName: {
    color: 'var(--text-2)', fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: '5px',
  },
  contribDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: '#FFD56B', display: 'inline-block',
  },
  postFootDot: { opacity: 0.5 },
  postReplies: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
  },
}
