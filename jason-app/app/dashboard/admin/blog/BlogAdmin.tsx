'use client'

import { useState, useTransition } from 'react'
import {
  Plus, Trash, PencilSimple, X, Check, ArrowClockwise,
  Eye, EyeSlash, CheckCircle, XCircle,
} from '@phosphor-icons/react'
import { addBlogPost, updateBlogPost, deleteBlogPost, toggleBlogPublish } from './actions'

interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string | null
  category: string
  reading_time: number | null
  is_published: boolean
  published_at: string | null
  created_at: string
}

const CATEGORIES = [
  { value: 'conseil',    label: 'Conseils',             color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { value: 'strategie',  label: 'Stratégie',            color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { value: 'experience', label: "Retour d'expérience",  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'outil',      label: 'Outils',               color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { value: 'marche',     label: 'Marché',               color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { value: 'general',    label: 'Général',              color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
]

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FeedbackPill({ type, msg }: { type: 'ok' | 'err'; msg: string }) {
  const color = type === 'ok' ? '#34D399' : '#f87171'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, color, background: `${color}14`, border: `1px solid ${color}30`, padding: '4px 10px', borderRadius: '8px' }}>
      {type === 'ok' ? <CheckCircle size={13} weight="fill" /> : <XCircle size={13} weight="fill" />}
      {msg}
    </span>
  )
}

function BlogForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
  isEdit = false,
}: {
  defaultValues?: Partial<BlogPost>
  onSubmit: (fd: FormData) => void
  onCancel?: () => void
  isPending: boolean
  isEdit?: boolean
}) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)) }}
      style={s.form}
    >
      {!isEdit && <p style={s.formTitle}>Nouvel article</p>}

      <div style={s.group}>
        <label style={s.label}>Titre *</label>
        <input name="title" required defaultValue={defaultValues?.title ?? ''} style={s.input} placeholder="Titre de l'article" />
      </div>

      <div style={s.row2}>
        <div style={s.group}>
          <label style={s.label}>Slug (URL)</label>
          <input name="slug" defaultValue={defaultValues?.slug ?? ''} style={s.input} placeholder="auto-généré depuis le titre" />
        </div>
        <div style={s.group}>
          <label style={s.label}>Temps de lecture (min)</label>
          <input name="reading_time" type="number" min="1" max="60" defaultValue={defaultValues?.reading_time ?? 5} style={s.input} />
        </div>
      </div>

      <div style={s.group}>
        <label style={s.label}>Résumé</label>
        <textarea name="summary" rows={2} defaultValue={defaultValues?.summary ?? ''} style={{ ...s.input, resize: 'vertical' }} placeholder="Résumé affiché dans la liste des articles" />
      </div>

      <div style={s.group}>
        <label style={s.label}>Contenu</label>
        <textarea name="content" rows={8} defaultValue={defaultValues?.content ?? ''} style={{ ...s.input, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} placeholder="Contenu de l'article (texte brut, retours à la ligne supportés)" />
      </div>

      <div style={s.row2}>
        <div style={s.group}>
          <label style={s.label}>Catégorie *</label>
          <select name="category" required defaultValue={defaultValues?.category ?? 'general'} style={s.input}>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div style={s.group}>
          <label style={s.label}>Statut</label>
          <select name="is_published" defaultValue={defaultValues?.is_published ? 'true' : 'false'} style={s.input}>
            <option value="false">Brouillon</option>
            <option value="true">Publié</option>
          </select>
        </div>
      </div>

      <div style={s.formActions}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={s.cancelBtn} disabled={isPending}>
            <X size={14} /> Annuler
          </button>
        )}
        <button type="submit" style={s.submitBtn} disabled={isPending}>
          {isPending ? <ArrowClockwise size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
          {isEdit ? 'Enregistrer' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

export default function BlogAdmin({ posts: initialPosts }: { posts: BlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function showFeedback(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  function handleAdd(fd: FormData) {
    startTransition(async () => {
      const res = await addBlogPost(fd)
      if (res.success) {
        showFeedback('ok', 'Article créé')
        setShowForm(false)
        window.location.reload()
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await updateBlogPost(id, fd)
      if (res.success) {
        showFeedback('ok', 'Article mis à jour')
        setEditingId(null)
        window.location.reload()
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer cet article définitivement ?')) return
    startTransition(async () => {
      const res = await deleteBlogPost(id)
      if (res.success) {
        showFeedback('ok', 'Article supprimé')
        setPosts(p => p.filter(x => x.id !== id))
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleBlogPublish(id, current)
      if (res.success) {
        setPosts(p => p.map(x => x.id === id ? { ...x, is_published: !current } : x))
        showFeedback('ok', current ? 'Dépublié' : 'Publié')
      } else {
        showFeedback('err', res.error ?? 'Erreur')
      }
    })
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.head}>
        <div>
          <h2 style={s.title}>Articles de blog</h2>
          <p style={s.sub}>{posts.length} article{posts.length !== 1 ? 's' : ''} — {posts.filter(p => p.is_published).length} publié{posts.filter(p => p.is_published).length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {feedback && <FeedbackPill {...feedback} />}
          <button onClick={() => { setShowForm(v => !v); setEditingId(null) }} style={s.addBtn}>
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Annuler' : 'Nouvel article'}
          </button>
        </div>
      </div>

      {/* New post form */}
      {showForm && !editingId && (
        <div style={s.formWrap}>
          <BlogForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} isPending={isPending} />
        </div>
      )}

      {/* Posts list */}
      <div style={s.list}>
        {posts.length === 0 && !showForm && (
          <div style={s.empty}>Aucun article pour l&apos;instant. Créez le premier !</div>
        )}
        {posts.map(post => {
          const cat = getCat(post.category)
          const isEditing = editingId === post.id
          return (
            <div key={post.id} style={s.item}>
              {isEditing ? (
                <div style={{ padding: '20px' }}>
                  <BlogForm
                    defaultValues={post}
                    isEdit
                    onSubmit={fd => handleUpdate(post.id, fd)}
                    onCancel={() => setEditingId(null)}
                    isPending={isPending}
                  />
                </div>
              ) : (
                <div style={s.itemContent}>
                  <div style={s.itemLeft}>
                    <div style={s.itemMeta}>
                      <span style={{ ...s.catBadge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>{cat.label}</span>
                      <span style={{ ...s.statusBadge, ...(post.is_published ? s.publishedBadge : s.draftBadge) }}>
                        {post.is_published ? <Eye size={10} /> : <EyeSlash size={10} />}
                        {post.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <p style={s.itemTitle}>{post.title}</p>
                    {post.summary && <p style={s.itemSummary}>{post.summary}</p>}
                    <span style={s.itemDate}>{formatDate(post.created_at)} · /{post.slug}</span>
                  </div>

                  <div style={s.itemActions}>
                    <button onClick={() => handleToggle(post.id, post.is_published)} style={s.iconBtn} title={post.is_published ? 'Dépublier' : 'Publier'} disabled={isPending}>
                      {post.is_published ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => { setEditingId(post.id); setShowForm(false) }} style={s.iconBtn} title="Modifier" disabled={isPending}>
                      <PencilSimple size={15} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} style={{ ...s.iconBtn, color: '#f87171' }} title="Supprimer" disabled={isPending}>
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: '24px' },

  head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' as const },
  title: { fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 400, color: 'var(--text)', margin: '0 0 4px' },
  sub: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: 300, margin: 0 },

  addBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    padding: '9px 16px', borderRadius: '10px',
    background: 'var(--accent)', color: '#002820',
    fontSize: '13px', fontWeight: 700,
    border: 'none', cursor: 'pointer',
    transition: 'opacity 0.15s',
  },

  formWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  group: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  label: { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  input: {
    padding: '9px 12px', borderRadius: '8px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  },
  formActions: { display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '13px', cursor: 'pointer' },
  submitBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: '#002820', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' },

  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  empty: { padding: '32px', textAlign: 'center' as const, fontSize: '14px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' },

  item: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' },
  itemContent: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '18px 20px' },
  itemLeft: { flex: 1, minWidth: 0 },
  itemMeta: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  catBadge: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '100px', border: '1px solid' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.3px' },
  publishedBadge: { color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' },
  draftBadge: { color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' },
  itemTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  itemSummary: { fontSize: '12px', color: 'var(--text-2)', margin: '0 0 6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  itemDate: { fontSize: '11px', color: 'var(--text-muted)' },
  itemActions: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 },
  iconBtn: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.15s' },
}
