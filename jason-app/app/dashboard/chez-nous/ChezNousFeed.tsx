'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { House, Plus, ChatCircle, PushPin, Lock, ArrowFatUp, Clock, Fire, Question, Pencil, Sparkle, Trophy, Users, MagnifyingGlass, X, CheckCircle, ImageSquare } from '@phosphor-icons/react'
import { CATEGORIES, CATEGORY_ORDER, type CategoryId } from '@/lib/chez-nous/categories'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { BADGES, type BadgeId } from '@/lib/badges'
import { stripMarkdown } from '@/lib/chez-nous/markdown'
import { formatProStats, type ProStats } from '@/lib/chez-nous/pro-stats'
import MarkdownToolbar from '@/components/chez-nous/MarkdownToolbar'
import ImageUploader from '@/components/chez-nous/ImageUploader'
import { createPost, togglePostVote } from './actions'

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
  last_reply_at: string | null
  created_at: string
  edited_at: string | null
  has_voted: boolean
  is_resolved: boolean
  image_count: number
}

type Author = {
  full_name: string | null
  pseudo: string | null
  role: string | null
  is_contributor: boolean
  created_at: string | null
  badges: BadgeId[]
  proStats: ProStats | null
}

type Sort = 'recent' | 'popular' | 'unanswered' | 'unresolved'

type TopMember = {
  id: string
  full_name: string | null
  pseudo: string | null
  is_contributor: boolean
  score: number
}

type Props = {
  posts: Post[]
  authorsMap: Record<string, Author>
  currentUserId: string
  isAdmin: boolean
  currentCategory: CategoryId | 'all'
  currentSort: Sort
  currentSearch: string
  stats: { totalPosts: number; totalReplies: number; totalMembers: number }
  topMembers: TopMember[]
  catCounts: Record<string, number>
}

export default function ChezNousFeed({ posts, authorsMap, currentCategory, currentSort, currentSearch, stats, topMembers, catCounts }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroBadge}>
          <House size={13} color="var(--accent-text)" weight="fill" />
          Chez Nous · Communauté ouverte
        </div>
        <h1 style={s.heroTitle}>
          Bienvenue <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Chez Nous</em>
        </h1>
        <p style={s.heroDesc}>
          L'espace pour échanger, demander un coup de main, partager ce qui marche.
          Entre hôtes LCD, sans détour.
        </p>

        <div style={s.statRow}>
          <span><strong style={{ color: 'var(--text)' }}>{stats.totalPosts}</strong> discussion{stats.totalPosts > 1 ? 's' : ''}</span>
          <span style={s.statSep}>·</span>
          <span><strong style={{ color: 'var(--text)' }}>{stats.totalReplies}</strong> réponse{stats.totalReplies > 1 ? 's' : ''}</span>
          <span style={s.statSep}>·</span>
          <span><strong style={{ color: 'var(--text)' }}>{stats.totalMembers}</strong> membre{stats.totalMembers > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Catégories */}
      <div style={s.catRow}>
        <CategoryChip id="all" label="Tout" color="var(--accent-text)" bg="rgba(255,213,107,0.14)" active={currentCategory === 'all'} sort={currentSort} search={currentSearch} />
        {CATEGORY_ORDER.map(cid => (
          <CategoryChip
            key={cid} id={cid}
            label={CATEGORIES[cid].short}
            color={CATEGORIES[cid].color} bg={CATEGORIES[cid].bg}
            active={currentCategory === cid}
            sort={currentSort}
            search={currentSearch}
          />
        ))}
      </div>

      {/* Layout 2-col desktop */}
      <div style={s.layout}>
        {/* Colonne principale */}
        <div style={s.mainCol}>
          {/* Recherche */}
          <SearchBar initial={currentSearch} cat={currentCategory} sort={currentSort} />

          {/* Tri + Bouton */}
          <div style={s.toolbar}>
            <div style={s.sortRow}>
              <SortChip cat={currentCategory} sort="recent"     active={currentSort === 'recent'}     search={currentSearch} icon={Clock} label="Récent" />
              <SortChip cat={currentCategory} sort="popular"    active={currentSort === 'popular'}    search={currentSearch} icon={Fire}  label="Populaire" />
              <SortChip cat={currentCategory} sort="unanswered" active={currentSort === 'unanswered'} search={currentSearch} icon={Question} label="Sans réponse" />
              <SortChip cat={currentCategory} sort="unresolved" active={currentSort === 'unresolved'} search={currentSearch} icon={CheckCircle} label="Non résolu" />
            </div>
            <button onClick={() => setShowForm(v => !v)} style={s.newBtn}>
              <Plus size={15} weight="bold" />
              {showForm ? 'Annuler' : 'Nouvelle discussion'}
            </button>
          </div>

          {showForm && (
            <NewPostForm onSuccess={() => setShowForm(false)} defaultCategory={currentCategory === 'all' ? 'autres' : currentCategory} />
          )}

          {/* Feed */}
          <div style={s.feed}>
            {posts.length === 0 ? (
              <EmptyState category={currentCategory} sort={currentSort} search={currentSearch} onNew={() => setShowForm(true)} />
            ) : (
              posts.map(post => (
                <PostRow key={post.id} post={post} author={authorsMap[post.author_id]} />
              ))
            )}
          </div>
        </div>

        {/* Aside */}
        <aside style={s.aside}>
          <StatsCard stats={stats} />
          <TopMembersCard members={topMembers} />
          <CategoriesCard counts={catCounts} currentCategory={currentCategory} currentSort={currentSort} />
          <TipCard />
        </aside>
      </div>
    </div>
  )
}

// ─── Aside cards ─────────────────────────────────────────────────────

function StatsCard({ stats }: { stats: { totalPosts: number; totalReplies: number; totalMembers: number } }) {
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <Sparkle size={14} color="var(--accent-text)" weight="fill" />
        <span style={s.asideTitle}>La communauté</span>
      </div>
      <div style={s.statsList}>
        <div style={s.statRow2}>
          <span style={s.statValue}>{stats.totalMembers}</span>
          <span style={s.statLabel}>membre{stats.totalMembers > 1 ? 's' : ''}</span>
        </div>
        <div style={s.statRow2}>
          <span style={s.statValue}>{stats.totalPosts}</span>
          <span style={s.statLabel}>discussion{stats.totalPosts > 1 ? 's' : ''}</span>
        </div>
        <div style={s.statRow2}>
          <span style={s.statValue}>{stats.totalReplies}</span>
          <span style={s.statLabel}>réponse{stats.totalReplies > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}

function TopMembersCard({ members }: { members: TopMember[] }) {
  if (members.length === 0) return null
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <Trophy size={14} color="#fb923c" weight="fill" />
        <span style={s.asideTitle}>Membres actifs · 30 j</span>
      </div>
      <div style={s.membersList}>
        {members.map((m, i) => {
          const av = colorFromId(m.id)
          const initials = displayInitials({ pseudo: m.pseudo, full_name: m.full_name })
          const name = displayName({ pseudo: m.pseudo, full_name: m.full_name })
          return (
            <Link key={m.id} href={`/dashboard/chez-nous/membre/${m.id}`} style={s.memberRow}>
              <span style={s.memberRank}>{i + 1}</span>
              <span style={{ ...s.memberAvatar, background: av.bg, color: av.text }}>{initials}</span>
              <span style={s.memberName}>
                {name}
                {m.is_contributor && <span style={s.contribDotMini} />}
              </span>
              <span style={s.memberScore}>{m.score} pts</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function CategoriesCard({ counts, currentCategory, currentSort }: {
  counts: Record<string, number>
  currentCategory: CategoryId | 'all'
  currentSort: Sort
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <Users size={14} color="#a78bfa" weight="fill" />
        <span style={s.asideTitle}>Catégories</span>
      </div>
      <div style={s.catList}>
        {CATEGORY_ORDER.map(cid => {
          const count = counts[cid] ?? 0
          const cat = CATEGORIES[cid]
          const params = new URLSearchParams()
          params.set('cat', cid)
          if (currentSort !== 'recent') params.set('sort', currentSort)
          const active = currentCategory === cid
          return (
            <Link
              key={cid}
              href={`/dashboard/chez-nous?${params}`}
              style={{
                ...s.catItem,
                background: active ? cat.bg : 'transparent',
                borderColor: active ? `${cat.color}55` : 'transparent',
              }}
            >
              <span style={{ ...s.catDot, background: cat.color }} />
              <span style={s.catItemLabel}>{cat.short}</span>
              <span style={s.catItemCount}>{count}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function TipCard() {
  return (
    <div style={{ ...s.asideCard, background: 'rgba(255,213,107,0.04)', borderColor: 'rgba(255,213,107,0.18)' }}>
      <div style={s.asideHead}>
        <Sparkle size={14} color="var(--accent-text)" weight="fill" />
        <span style={s.asideTitle}>Pour bien démarrer</span>
      </div>
      <ul style={s.tipList}>
        <li style={s.tipItem}>Un titre précis vaut mieux qu'un long message</li>
        <li style={s.tipItem}>Donne du contexte : ville, plateforme, situation</li>
        <li style={s.tipItem}>Réponds aux autres — c'est ce qui fait vivre Chez Nous</li>
      </ul>
    </div>
  )
}

// ─── Post row ─────────────────────────────────────────────────────────

function PostRow({ post, author }: { post: Post; author?: Author }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [voted, setVoted] = useState(post.has_voted)
  const [count, setCount] = useState(post.vote_count)

  const av       = colorFromId(post.author_id)
  const initials = author ? displayInitials({ pseudo: author.pseudo, full_name: author.full_name }) : '?'
  const name     = author ? displayName({ pseudo: author.pseudo, full_name: author.full_name }) : 'Anonyme'
  const cat      = CATEGORIES[post.category]

  const onVote = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const wasVoted = voted
    setVoted(!wasVoted)
    setCount(c => c + (wasVoted ? -1 : 1))
    startTransition(async () => {
      await togglePostVote(post.id, wasVoted)
      router.refresh()
    })
  }

  return (
    <div style={s.postCard}>
      {/* Vote */}
      <button
        type="button"
        onClick={onVote}
        disabled={pending}
        style={{
          ...s.voteCol,
          color: voted ? 'var(--accent-text)' : 'var(--text-muted)',
          background: voted ? 'rgba(255,213,107,0.10)' : 'transparent',
          borderColor: voted ? 'rgba(255,213,107,0.3)' : 'var(--border)',
        }}
        title={voted ? 'Retirer mon vote' : 'Marquer utile'}
      >
        <ArrowFatUp size={14} weight={voted ? 'fill' : 'regular'} />
        <span style={s.voteCount}>{count}</span>
      </button>

      {/* Avatar (cliquable → profil) */}
      <Link href={`/dashboard/chez-nous/membre/${post.author_id}`} style={{ ...s.avatar, background: av.bg, color: av.text }} title={name}>
        {initials}
      </Link>

      {/* Contenu */}
      <Link href={`/dashboard/chez-nous/${post.id}`} style={s.postBody}>
        <div style={s.postMeta}>
          <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>{cat.short}</span>
          {post.is_resolved && (
            <span style={s.resolvedChip}>
              <CheckCircle size={11} weight="fill" /> Résolu
            </span>
          )}
          {post.pinned && <PushPin size={12} color="var(--accent-text)" weight="fill" />}
          {post.locked && <Lock size={12} color="#94a3b8" weight="fill" />}
          {post.edited_at && <span style={s.editedTag}><Pencil size={9} /> modifié</span>}
        </div>
        <h3 style={s.postTitle}>{post.title}</h3>
        <p style={s.postExcerpt}>{(() => { const stripped = stripMarkdown(post.body); return stripped.slice(0, 180) + (stripped.length > 180 ? '…' : '') })()}</p>
        <div style={s.postFoot}>
          <span style={s.postFootName}>
            {name}
            {author?.is_contributor && <span style={s.contribDot} title="Contributeur" />}
            {author?.role === 'admin' && <span style={s.adminTag}>admin</span>}
          </span>
          {author?.proStats && formatProStats(author.proStats) && (
            <span style={s.proStatsTxt}>{formatProStats(author.proStats)}</span>
          )}
          {(author?.badges ?? []).slice(0, 3).map(bid => (
            <span key={bid} title={BADGES[bid].title} style={{ ...s.miniBadge, background: BADGES[bid].bg }}>
              {BADGES[bid].label}
            </span>
          ))}
          <span style={s.postFootDot}>·</span>
          <span>{formatRelative(post.last_reply_at ?? post.created_at)}</span>
          <span style={s.postFootDot}>·</span>
          <span style={s.postReplies}>
            <ChatCircle size={11} weight="fill" />
            {post.reply_count}
          </span>
          {post.image_count > 0 && (
            <>
              <span style={s.postFootDot}>·</span>
              <span style={s.postReplies} title={`${post.image_count} image${post.image_count > 1 ? 's' : ''}`}>
                <ImageSquare size={11} weight="fill" />
                {post.image_count}
              </span>
            </>
          )}
        </div>
      </Link>
    </div>
  )
}

// ─── Sub components ───────────────────────────────────────────────────

function CategoryChip({ id, label, color, bg, active, sort, search }: {
  id: string; label: string; color: string; bg: string; active: boolean; sort: Sort; search: string
}) {
  const params = new URLSearchParams()
  if (id !== 'all')        params.set('cat', id)
  if (sort !== 'recent')   params.set('sort', sort)
  if (search)              params.set('q', search)
  const href = '/dashboard/chez-nous' + (params.toString() ? `?${params}` : '')
  return (
    <Link href={href} style={{ ...s.catLink, color, background: active ? bg : 'transparent', borderColor: active ? `${color}55` : 'var(--border)' }}>
      {label}
    </Link>
  )
}

function SortChip({ cat, sort, active, search, icon: Icon, label }: {
  cat: CategoryId | 'all'; sort: Sort; active: boolean; search: string; icon: React.ElementType; label: string
}) {
  const params = new URLSearchParams()
  if (cat !== 'all')      params.set('cat', cat)
  if (sort !== 'recent')  params.set('sort', sort)
  if (search)             params.set('q', search)
  const href = '/dashboard/chez-nous' + (params.toString() ? `?${params}` : '')
  return (
    <Link href={href} style={{
      ...s.sortChip,
      color: active ? 'var(--text)' : 'var(--text-muted)',
      background: active ? 'var(--surface)' : 'transparent',
      borderColor: active ? 'var(--border)' : 'transparent',
    }}>
      <Icon size={12} weight={active ? 'fill' : 'regular'} />
      {label}
    </Link>
  )
}

function EmptyState({ category, sort, search, onNew }: { category: CategoryId | 'all'; sort: Sort; search: string; onNew: () => void }) {
  if (search) {
    return (
      <div style={s.empty}>
        <MagnifyingGlass size={28} color="var(--accent-text)" weight="duotone" />
        <p style={s.emptyTitle}>Aucun résultat pour « {search} »</p>
        <p style={s.emptyDesc}>Essaie d'autres mots-clés, ou retire les filtres pour voir toutes les discussions.</p>
      </div>
    )
  }
  if (sort === 'unanswered') {
    return (
      <div style={s.empty}>
        <Question size={28} color="var(--accent-text)" weight="duotone" />
        <p style={s.emptyTitle}>Aucune discussion sans réponse</p>
        <p style={s.emptyDesc}>Tout a été pris en charge — bravo la communauté !</p>
      </div>
    )
  }
  return (
    <div style={s.empty}>
      <ChatCircle size={28} color="var(--accent-text)" weight="duotone" />
      <p style={s.emptyTitle}>
        {category !== 'all'
          ? `Aucune discussion dans ${CATEGORIES[category].short}`
          : 'La conversation va commencer ici'}
      </p>
      <p style={s.emptyDesc}>
        Lance le premier sujet — un problème, une astuce, un retour sur une situation.
        C'est ce qui donne vie à Chez Nous.
      </p>
      <button onClick={onNew} style={s.emptyBtn}>
        <Plus size={13} weight="bold" /> Lancer une discussion
      </button>
    </div>
  )
}

// ─── Search bar ───────────────────────────────────────────────────────

function SearchBar({ initial, cat, sort }: { initial: string; cat: CategoryId | 'all'; sort: Sort }) {
  const router = useRouter()
  const [value, setValue] = useState(initial)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (cat !== 'all')      params.set('cat', cat)
    if (sort !== 'recent')  params.set('sort', sort)
    if (value.trim())       params.set('q', value.trim())
    const url = '/dashboard/chez-nous' + (params.toString() ? `?${params}` : '')
    router.push(url)
  }

  const clear = () => {
    setValue('')
    const params = new URLSearchParams()
    if (cat !== 'all')      params.set('cat', cat)
    if (sort !== 'recent')  params.set('sort', sort)
    const url = '/dashboard/chez-nous' + (params.toString() ? `?${params}` : '')
    router.push(url)
  }

  return (
    <form onSubmit={submit} style={s.searchBar}>
      <MagnifyingGlass size={14} color="var(--text-muted)" />
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Rechercher dans Chez Nous…"
        style={s.searchInput}
      />
      {(value || initial) && (
        <button type="button" onClick={clear} style={s.searchClearBtn} title="Effacer">
          <X size={12} weight="bold" />
        </button>
      )}
    </form>
  )
}

function NewPostForm({ onSuccess, defaultCategory }: { onSuccess: () => void; defaultCategory: CategoryId }) {
  const [category, setCategory] = useState<CategoryId>(defaultCategory)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const taRef = useRef<HTMLTextAreaElement>(null!)

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createPost({ category, title, body, images })
      if (res.ok) {
        setTitle(''); setBody(''); setImages([])
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
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Un sujet précis et clair…"
          style={s.input} maxLength={200}
        />
        <p style={s.helper}>{title.length}/200 — pose ta question ou ton sujet en une phrase</p>
      </div>

      <div style={s.formField}>
        <label style={s.label}>Message</label>
        <MarkdownToolbar textareaRef={taRef} value={body} onChange={setBody} />
        <textarea
          ref={taRef}
          value={body} onChange={e => setBody(e.target.value)}
          placeholder="Détaille ton contexte, ce que tu as déjà essayé, ce que tu cherches…"
          style={s.textarea} rows={6} maxLength={8000}
        />
        <p style={s.helper}>{body.length}/8000</p>
      </div>

      <div style={s.formField}>
        <label style={s.label}>Images (optionnel)</label>
        <ImageUploader value={images} onChange={setImages} max={3} />
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

// ─── Styles ───────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%' },

  layout: {
    display: 'flex', gap: 'clamp(14px, 2vw, 24px)',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  mainCol: {
    flex: '1 1 600px', minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
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
  asideHead: {
    display: 'flex', alignItems: 'center', gap: '7px',
  },
  asideTitle: {
    fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.6px', color: 'var(--text-2)',
  },

  statsList: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  statRow2: { display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' },
  statValue: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(17px, 4vw, 22px)', fontWeight: 400, color: 'var(--text)', lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px', color: 'var(--text-2)',
  },

  membersList: {
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  memberRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 8px', borderRadius: '8px',
    textDecoration: 'none', color: 'inherit',
  },
  memberRank: {
    fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700,
    minWidth: '16px', textAlign: 'center',
  },
  memberAvatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  memberName: {
    flex: 1, minWidth: 0,
    fontSize: '12.5px', color: 'var(--text-2)', fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  contribDotMini: {
    width: '5px', height: '5px', borderRadius: '50%',
    background: 'var(--accent-text)', display: 'inline-block', flexShrink: 0,
  },
  memberScore: {
    fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600,
    background: 'var(--bg)', padding: '2px 6px', borderRadius: '999px',
    flexShrink: 0,
  },

  catList: {
    display: 'flex', flexDirection: 'column', gap: '2px',
  },
  catItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '7px 10px', borderRadius: '8px',
    textDecoration: 'none', color: 'inherit',
    border: '1px solid',
  },
  catDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  catItemLabel: { flex: 1, fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 },
  catItemCount: {
    fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
    background: 'var(--bg)', padding: '2px 7px', borderRadius: '999px',
  },

  tipList: { margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  tipItem: {
    fontSize: '12px', lineHeight: 1.5, color: 'var(--text-2)',
  },


  hero: { marginBottom: 'clamp(16px, 3vw, 24px)' },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase',
    color: 'var(--accent-text)', background: 'rgba(255,213,107,0.08)',
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
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px',
  },
  statSep:  { opacity: 0.5 },

  catRow: {
    display: 'flex', flexWrap: 'wrap', gap: '8px',
    marginBottom: '14px',
  },
  catLink: {
    fontSize: '12px', fontWeight: 600,
    padding: '7px 14px', borderRadius: '999px',
    border: '1px solid', textDecoration: 'none',
    transition: 'background 0.15s',
  },

  searchBar: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '8px 12px',
    marginBottom: '12px',
  },
  searchInput: {
    flex: 1, minWidth: 0,
    background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '13px', fontFamily: 'inherit',
  },
  searchClearBtn: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', cursor: 'pointer',
    width: '22px', height: '22px', borderRadius: '6px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '10px', marginBottom: '14px', flexWrap: 'wrap',
  },
  sortRow: {
    display: 'flex', gap: '4px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '3px',
  },
  sortChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 600,
    padding: '5px 10px', borderRadius: '7px',
    border: '1px solid', textDecoration: 'none',
  },
  newBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: '#ffd56b', color: '#1a1a0e',
    fontWeight: 700, fontSize: '13px',
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
    background: '#ffd56b', color: '#1a1a0e',
    border: 'none', borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },

  feed: { display: 'flex', flexDirection: 'column', gap: '10px' },

  empty: {
    background: 'var(--surface)', border: '1px dashed var(--border)',
    borderRadius: '14px', padding: '40px 24px',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
  },
  emptyTitle: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '8px 0 0' },
  emptyDesc:  { fontSize: '13px', color: 'var(--text-muted)', margin: '0 auto', maxWidth: '380px', lineHeight: 1.6 },
  emptyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: '#ffd56b', color: '#1a1a0e',
    fontWeight: 700, fontSize: '13px',
    padding: '8px 16px', borderRadius: '10px',
    border: 'none', cursor: 'pointer', marginTop: '10px',
  },

  postCard: {
    display: 'flex', gap: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '14px 16px',
    transition: 'border-color 0.15s',
    alignItems: 'flex-start',
  },
  voteCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '2px',
    minWidth: '44px', minHeight: '54px',
    background: 'transparent', border: '1px solid',
    borderRadius: '10px', cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    flexShrink: 0,
  },
  voteCount: { fontSize: '12px', fontWeight: 700, lineHeight: 1 },

  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0, textDecoration: 'none',
  },
  postBody: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: '5px',
    textDecoration: 'none', color: 'inherit',
  },
  postMeta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  resolvedChip: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    color: '#10b981',
    background: 'rgba(16,185,129,0.10)',
    border: '1px solid rgba(16,185,129,0.25)',
    padding: '2px 7px', borderRadius: '999px',
  },
  catChip: {
    fontSize: '10px', fontWeight: 700,
    letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    padding: '2px 8px', borderRadius: '999px',
  },
  editedTag: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  postTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    margin: '2px 0', lineHeight: 1.35,
  },
  postExcerpt: {
    fontSize: '13px', color: 'var(--text-2)',
    margin: 0, lineHeight: 1.6,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
  },
  postFoot: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px',
    flexWrap: 'wrap' as const,
  },
  proStatsTxt: {
    fontSize: '11px', color: 'var(--text-muted)',
    background: 'var(--bg)', border: '1px solid var(--border)',
    padding: '1px 7px', borderRadius: '999px',
  },
  postFootName: {
    color: 'var(--text-2)', fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: '5px',
  },
  contribDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--accent-text)', display: 'inline-block',
  },
  adminTag: {
    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: '#fb7185',
    background: 'rgba(251,113,133,0.12)', padding: '1px 5px', borderRadius: '4px',
  },
  miniBadge: {
    fontSize: '11px', lineHeight: 1, padding: '2px 4px',
    borderRadius: '5px',
  },
  postFootDot: { opacity: 0.5 },
  postReplies: { display: 'inline-flex', alignItems: 'center', gap: '3px' },
}
