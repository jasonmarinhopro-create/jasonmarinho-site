'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { House, Plus, ChatCircle, PushPin, Lock, ArrowFatUp, Clock, Fire, Question, Pencil, Sparkle, Trophy, Users, MagnifyingGlass, X, CheckCircle, ImageSquare, ShareNetwork, UserPlus } from '@phosphor-icons/react'
import { CATEGORIES, CATEGORY_ORDER, type CategoryId } from '@/lib/chez-nous/categories'
import { REGION_POSITIONS } from '@/lib/chez-nous/regions'
import { MapPin } from '@phosphor-icons/react'
import { displayName, displayInitials, colorFromId, formatRelative } from '@/lib/chez-nous/display'
import { BADGES, type BadgeId } from '@/lib/badges'
import { stripMarkdown } from '@/lib/chez-nous/markdown'
import { formatProStats, type ProStats } from '@/lib/chez-nous/pro-stats'
import MarkdownToolbar from '@/components/chez-nous/MarkdownToolbar'
import ImageUploader from '@/components/chez-nous/ImageUploader'
import InviteModal from '@/components/chez-nous/InviteModal'
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

type NewMember = {
  id: string
  full_name: string | null
  pseudo: string | null
  is_contributor: boolean
  created_at: string | null
  city: string | null
}

type ActivityEvent =
  | { kind: 'reply'; id: string; created_at: string; replierId: string; postTitle: string; postAuthorId: string; postId: string }
  | { kind: 'post'; id: string; created_at: string; authorId: string; title: string }

type Props = {
  posts: Post[]
  authorsMap: Record<string, Author>
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
  currentCategory: CategoryId | 'all'
  currentSort: Sort
  currentSearch: string
  stats: { totalPosts: number; totalReplies: number; totalMembers: number }
  topMembers: TopMember[]
  newMembers: NewMember[]
  catCounts: Record<string, number>
  activity: ActivityEvent[]
  activityProfiles: Record<string, { full_name: string | null; pseudo: string | null }>
  regionCounts: Record<string, number>
}

export default function ChezNousFeed({ posts, authorsMap, currentUserId, currentUserName, currentCategory, currentSort, currentSearch, stats, topMembers, newMembers, catCounts, activity, activityProfiles, regionCounts }: Props) {
  const [showForm,   setShowForm]   = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div style={s.page}>
      <style>{`
        /* Map silhouette: white in dark mode, dark green in light mode */
        .cn-map-shape { fill: rgba(255,255,255,0.025); stroke: rgba(255,255,255,0.14); }
        [data-theme="light"] .cn-map-shape { fill: rgba(0,76,63,0.07); stroke: rgba(0,76,63,0.28); }
        /* Default category chip rendering (desktop) */
        .cn-cat-emoji { font-size: 13px; line-height: 1; }
        .cn-cat-label { font-weight: 600; }
        /* Bouton invitation mobile (caché sur desktop car la sidebar fait le job) */
        .cn-mobile-invite { display: none; }
        @media (max-width: 1023px) {
          .cn-aside { display: none !important; }
          .cn-main-col { flex: 1 1 100% !important; }
          .cn-mobile-invite {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
            padding: 11px 18px;
            border-radius: 999px;
            background: var(--accent-text);
            color: var(--bg);
            font-weight: 600;
            font-size: 14px;
            border: none;
            cursor: pointer;
            font-family: inherit;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            width: 100%;
            box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          }
          .cn-mobile-invite:active { transform: scale(0.98); }
        }
        @media (max-width: 767px) {
          /* Category chips: stories-style bubbles */
          .cn-cat-row {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 4px 4px 8px;
            gap: 4px !important;
            margin: 0 -4px 14px !important;
          }
          .cn-cat-row::-webkit-scrollbar { display: none; }
          .cn-cat-link {
            flex-direction: column !important;
            align-items: center !important;
            gap: 6px !important;
            background: transparent !important;
            border: none !important;
            padding: 4px !important;
            min-width: 76px !important;
            flex-shrink: 0 !important;
            text-align: center;
          }
          .cn-cat-link .cn-cat-emoji {
            display: flex; align-items: center; justify-content: center;
            width: 56px; height: 56px;
            border-radius: 50%;
            background: var(--cat-bg);
            border: 1.5px solid color-mix(in srgb, var(--cat-color) 28%, transparent);
            font-size: 26px; line-height: 1;
            transition: transform 0.15s, box-shadow 0.15s;
          }
          .cn-cat-link.cn-active .cn-cat-emoji {
            box-shadow: 0 0 0 2.5px var(--cat-color);
            transform: scale(1.04);
          }
          .cn-cat-link .cn-cat-label {
            font-size: 11px !important;
            font-weight: 600;
            color: var(--text-2);
            line-height: 1.2;
            max-width: 70px;
          }
          .cn-cat-link.cn-active .cn-cat-label { color: var(--cat-color); }
          /* Hero invite button on mobile: full width */
          .cn-hero-actions { flex-direction: column !important; align-items: stretch !important; }
          .cn-hero-actions > * { width: 100% !important; justify-content: center !important; }
          /* Sort chips: horizontal scroll */
          .cn-sort-row {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .cn-sort-row::-webkit-scrollbar { display: none; }
          /* Members band: vertical stack, list scrolls sideways as "stories" */
          .cn-members-band {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 14px 16px !important;
          }
          .cn-members-text-col { min-width: 0 !important; }
          .cn-members-list {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 8px !important;
            padding-bottom: 4px;
            align-items: flex-start !important;
          }
          .cn-members-list::-webkit-scrollbar { display: none; }
          /* Member card → stories bubble */
          .cn-member-card {
            flex-direction: column !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 10px 8px !important;
            border-radius: 14px !important;
            min-width: 68px !important;
            max-width: 76px !important;
            flex-shrink: 0 !important;
          }
          .cn-member-avatar {
            width: 44px !important;
            height: 44px !important;
            font-size: 15px !important;
          }
          .cn-member-info { align-items: center !important; text-align: center; }
          .cn-member-name {
            font-size: 11px !important;
            white-space: normal !important;
            text-align: center;
            line-height: 1.3 !important;
            max-width: 60px;
            justify-content: center;
          }
          .cn-member-city  { display: none !important; }
          .cn-member-since { font-size: 9px !important; }
          /* Toolbar: wrap column on mobile */
          .cn-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .cn-new-btn { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroBadge}>
          <House size={13} color="var(--accent-text)" weight="fill" />
          Chez Nous · entre hôtes LCD
        </div>
        <h1 style={s.heroTitle}>
          Bienvenue <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Chez Nous</em>
        </h1>
        <p style={s.heroDesc}>
          L'endroit où on s'entraide pour de vrai. Tu poses tes questions, tu partages tes réussites,
          tu réponds quand tu peux. Sans détour, sans jugement.
        </p>

        <div style={s.statRow}>
          <span><strong style={{ color: 'var(--text)' }}>Vous êtes {stats.totalMembers}</strong> hôte{stats.totalMembers > 1 ? 's' : ''}</span>
          <span style={s.statSep}>·</span>
          <span><strong style={{ color: 'var(--text)' }}>{stats.totalPosts}</strong> conversation{stats.totalPosts > 1 ? 's' : ''}</span>
          <span style={s.statSep}>·</span>
          <span><strong style={{ color: 'var(--text)' }}>{stats.totalReplies}</strong> coup{stats.totalReplies > 1 ? 's' : ''} de main</span>
        </div>

        {/* Bouton Partager, visible mobile uniquement (la sidebar fait déjà le job desktop) */}
        <button
          type="button"
          className="cn-mobile-invite"
          onClick={() => setShowInvite(true)}
        >
          <UserPlus size={16} weight="fill" />
          <span>Inviter des amis hôtes</span>
        </button>
      </div>

      {/* Nouveaux membres */}
      {newMembers.length > 0 && <NewMembersBand members={newMembers} />}

      {/* Catégories */}
      <div style={s.catRow} className="cn-cat-row">
        <CategoryChip id="all" label="Tout" emoji="✨" color="var(--accent-text)" bg="rgba(255,213,107,0.14)" active={currentCategory === 'all'} sort={currentSort} search={currentSearch} />
        {CATEGORY_ORDER.map(cid => (
          <CategoryChip
            key={cid} id={cid}
            label={CATEGORIES[cid].short}
            emoji={CATEGORIES[cid].emoji}
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
        <div style={s.mainCol} className="cn-main-col">
          {/* Recherche */}
          <SearchBar initial={currentSearch} cat={currentCategory} sort={currentSort} />

          {/* Composer (style Facebook) */}
          <ComposerCard
            firstName={currentUserName.split(/\s+/)[0] || ''}
            initials={(currentUserName || 'JM').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            onOpen={() => setShowForm(true)}
            userId={currentUserId}
          />

          {/* Tri */}
          <div style={s.sortBar} className="cn-sort-bar">
            <div style={s.sortRow} className="cn-sort-row">
              <SortChip cat={currentCategory} sort="recent"     active={currentSort === 'recent'}     search={currentSearch} icon={Clock} label="Récent" />
              <SortChip cat={currentCategory} sort="popular"    active={currentSort === 'popular'}    search={currentSearch} icon={Fire}  label="Populaire" />
              <SortChip cat={currentCategory} sort="unanswered" active={currentSort === 'unanswered'} search={currentSearch} icon={Question} label="À aider" />
              <SortChip cat={currentCategory} sort="unresolved" active={currentSort === 'unresolved'} search={currentSearch} icon={CheckCircle} label="En suspens" />
            </div>
          </div>

          {/* Modal de création de post */}
          {showForm && (
            <PostFormModal
              onClose={() => setShowForm(false)}
              defaultCategory={currentCategory === 'all' ? 'autres' : currentCategory}
              firstName={currentUserName.split(/\s+/)[0] || ''}
              initials={(currentUserName || 'JM').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            />
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
        <aside style={s.aside} className="cn-aside">
          <JasonNoteCard />
          <InviteFriendsCard onClick={() => setShowInvite(true)} />
          <FranceMapCard regionCounts={regionCounts} />
          <ActivityCard events={activity} profiles={activityProfiles} />
          <StatsCard stats={stats} />
          <TopMembersCard members={topMembers} />
          <CategoriesCard counts={catCounts} currentCategory={currentCategory} currentSort={currentSort} />
          <TipCard />
        </aside>
      </div>

      {/* Modal de partage / invitation */}
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        inviterName={currentUserName.split(/\s+/)[0] || 'Un hôte'}
        inviterUserId={currentUserId}
      />
    </div>
  )
}

// ─── InviteFriendsCard (sidebar) ───────────────────────────────────────
function InviteFriendsCard({ onClick }: { onClick: () => void }) {
  return (
    <div style={s.inviteCard}>
      <div style={s.inviteIconWrap}>
        <UserPlus size={20} weight="fill" color="var(--accent-text)" />
      </div>
      <h3 style={s.inviteTitle}>Invite des amis hôtes</h3>
      <p style={s.inviteDesc}>
        Tu connais d&apos;autres hôtes en LCD&nbsp;? Invite-les. Plus on est nombreux,
        plus l&apos;entraide est riche.
      </p>
      <button onClick={onClick} style={s.inviteBtn}>
        <ShareNetwork size={14} weight="fill" />
        Partager Chez Nous
      </button>
    </div>
  )
}

// ─── ComposerCard (Facebook-style "Exprimez-vous") ────────────────────
function ComposerCard({ firstName, initials, onOpen, userId }: {
  firstName: string; initials: string; onOpen: () => void; userId: string
}) {
  return (
    <div style={s.composerCard}>
      <div style={s.composerRow}>
        <Link
          href={`/dashboard/chez-nous/membre/${userId}`}
          style={{ ...s.composerAvatar, textDecoration: 'none', cursor: 'pointer' }}
          title="Voir mon profil Chez Nous"
        >
          {initials}
        </Link>
        <button onClick={onOpen} style={s.composerInput}>
          {firstName ? `Exprime-toi, ${firstName}…` : 'Pose ta question, partage une expérience…'}
        </button>
      </div>
      <div style={s.composerActions}>
        <button onClick={onOpen} style={s.composerAction}>
          <ImageSquare size={16} color="#34d399" weight="fill" />
          <span>Photo</span>
        </button>
        <button onClick={onOpen} style={s.composerAction}>
          <Question size={16} color="#fb923c" weight="fill" />
          <span>Demander de l&apos;aide</span>
        </button>
        <button onClick={onOpen} style={s.composerAction}>
          <Sparkle size={16} color="#a78bfa" weight="fill" />
          <span>Partager une réussite</span>
        </button>
      </div>
    </div>
  )
}

// ─── PostFormModal (overlay Facebook-style) ─────────────────────────
function PostFormModal({ onClose, defaultCategory, firstName, initials }: {
  onClose: () => void; defaultCategory: CategoryId; firstName: string; initials: string
}) {
  // Lock scroll & escape key
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      style={s.modalBackdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-modal-title"
    >
      <div style={s.modalDialog} className="cn-modal-dialog">
        <div style={s.modalHeader}>
          <h2 id="post-modal-title" style={s.modalTitle}>Créer une publication</h2>
          <button onClick={onClose} style={s.modalClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div style={s.modalUser}>
          <div style={s.composerAvatar}>{initials}</div>
          <div>
            <p style={s.modalUserName}>{firstName || 'Toi'}</p>
            <p style={s.modalUserSub}>Visible par tous les membres Chez Nous</p>
          </div>
        </div>

        <div style={s.modalBody}>
          <NewPostForm onSuccess={onClose} defaultCategory={defaultCategory} />
        </div>
      </div>
    </div>
  )
}

// ─── Aside cards ─────────────────────────────────────────────────────

function JasonNoteCard() {
  return (
    <div style={s.jasonCard}>
      <div style={s.jasonHeader}>
        <span style={s.jasonAvatar}>JM</span>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1px' }}>
          <span style={s.jasonName}>Jason</span>
          <span style={s.jasonRole}>Fondateur</span>
        </div>
      </div>
      <p style={s.jasonMessage}>
        Bienvenue Chez Nous. Cet espace n'a qu'une règle :
        <strong style={{ color: 'var(--accent-text)' }}> on s'entraide</strong>.
        Pose tes questions sans hésiter, partage ce que tu apprends, et surtout
        réponds quand tu peux à ceux qui débutent. C'est comme ça qu'on grandit ensemble.
      </p>
      <span style={s.jasonSign}>Jason</span>
    </div>
  )
}

function FranceMapCard({ regionCounts }: { regionCounts: Record<string, number> }) {
  const total = Object.values(regionCounts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  // Min/max pour normaliser la taille des bulles
  const max = Math.max(...Object.values(regionCounts))

  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <MapPin size={14} color="#fb7185" weight="fill" />
        <span style={s.asideTitle}>On est partout en France</span>
      </div>
      <div style={s.mapWrap}>
        <svg viewBox="0 0 100 110" style={s.mapSvg} aria-label="Répartition des hôtes en France">
          {/* Silhouette simplifiée de la France métropolitaine */}
          <path
            className="cn-map-shape"
            d="M 28 10 Q 42 5, 55 8 Q 68 6, 78 14 Q 84 22, 80 32 Q 88 38, 86 48 Q 90 56, 84 64 Q 88 72, 80 82 Q 70 90, 56 92 Q 42 94, 30 88 Q 20 82, 18 70 Q 10 60, 14 48 Q 10 36, 18 26 Q 22 16, 28 10 Z"
            strokeWidth="0.5"
          />
          {/* Corse */}
          <path
            className="cn-map-shape"
            d="M 88 92 Q 92 90, 93 95 Q 92 100, 89 100 Q 87 96, 88 92 Z"
            strokeWidth="0.5"
          />
          {/* Bulles par région */}
          {Object.entries(regionCounts).map(([region, count]) => {
            const pos = REGION_POSITIONS[region]
            if (!pos) return null
            const size = 1.5 + (count / max) * 3.5
            return (
              <g key={region}>
                <circle
                  cx={pos.x} cy={pos.y} r={size + 1.5}
                  fill="rgba(251,113,133,0.15)"
                />
                <circle
                  cx={pos.x} cy={pos.y} r={size}
                  fill="#fb7185"
                />
                <title>{`${region} : ${count} hôte${count > 1 ? 's' : ''}`}</title>
              </g>
            )
          })}
        </svg>
      </div>
      <div style={s.regionLegend}>
        {Object.entries(regionCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([region, count]) => (
            <span key={region} style={s.regionLegendItem}>
              <span style={s.regionLegendName}>{region}</span>
              <span style={s.regionLegendCount}>{count}</span>
            </span>
          ))}
      </div>
    </div>
  )
}

function ActivityCard({
  events, profiles,
}: {
  events: ActivityEvent[]
  profiles: Record<string, { full_name: string | null; pseudo: string | null }>
}) {
  if (events.length === 0) return null
  const nameOf = (id: string) => {
    const p = profiles[id]
    if (!p) return 'Quelqu\'un'
    return displayName({ pseudo: p.pseudo, full_name: p.full_name })
  }
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <ChatCircle size={14} color="#34d399" weight="fill" />
        <span style={s.asideTitle}>Ça vit en ce moment</span>
      </div>
      <div style={s.activityList}>
        {events.map(ev => {
          const when = formatRelative(ev.created_at)
          if (ev.kind === 'reply') {
            const replier = nameOf(ev.replierId)
            const author = nameOf(ev.postAuthorId)
            return (
              <Link key={`r-${ev.id}`} href={`/dashboard/chez-nous/${ev.postId}`} style={s.activityRow}>
                <span style={s.activityDotReply} />
                <div style={s.activityText}>
                  <span><strong>{replier}</strong> a répondu à <strong>{author}</strong></span>
                  <span style={s.activityTitle}>« {ev.postTitle.slice(0, 60)}{ev.postTitle.length > 60 ? '…' : ''} »</span>
                  <span style={s.activityWhen}>{when}</span>
                </div>
              </Link>
            )
          }
          const poster = nameOf(ev.authorId)
          return (
            <Link key={`p-${ev.id}`} href={`/dashboard/chez-nous/${ev.id}`} style={s.activityRow}>
              <span style={s.activityDotPost} />
              <div style={s.activityText}>
                <span><strong>{poster}</strong> a lancé une conversation</span>
                <span style={s.activityTitle}>« {ev.title.slice(0, 60)}{ev.title.length > 60 ? '…' : ''} »</span>
                <span style={s.activityWhen}>{when}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function StatsCard({ stats }: { stats: { totalPosts: number; totalReplies: number; totalMembers: number } }) {
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <Sparkle size={14} color="var(--accent-text)" weight="fill" />
        <span style={s.asideTitle}>Notre famille LCD</span>
      </div>
      <div style={s.statsList}>
        <div style={s.statRow2}>
          <span style={s.statValue}>{stats.totalMembers}</span>
          <span style={s.statLabel}>hôte{stats.totalMembers > 1 ? 's' : ''}</span>
        </div>
        <div style={s.statRow2}>
          <span style={s.statValue}>{stats.totalPosts}</span>
          <span style={s.statLabel}>conversation{stats.totalPosts > 1 ? 's' : ''}</span>
        </div>
        <div style={s.statRow2}>
          <span style={s.statValue}>{stats.totalReplies}</span>
          <span style={s.statLabel}>coup{stats.totalReplies > 1 ? 's' : ''} de main</span>
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
        <span style={s.asideTitle}>Ils ont aidé ce mois-ci</span>
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
        <span style={s.asideTitle}>Sujets</span>
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
        <span style={s.asideTitle}>L'esprit Chez Nous</span>
      </div>
      <ul style={s.tipList}>
        <li style={s.tipItem}>Un titre clair, du contexte (ville, plateforme), ça aide tout le monde</li>
        <li style={s.tipItem}>Pas de jugement : on a tous débuté un jour</li>
        <li style={s.tipItem}>Réponds quand tu peux, c&apos;est ce qui fait vivre la famille</li>
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

function CategoryChip({ id, label, emoji, color, bg, active, sort, search }: {
  id: string; label: string; emoji: string; color: string; bg: string; active: boolean; sort: Sort; search: string
}) {
  const params = new URLSearchParams()
  if (id !== 'all')        params.set('cat', id)
  if (sort !== 'recent')   params.set('sort', sort)
  if (search)              params.set('q', search)
  const href = '/dashboard/chez-nous' + (params.toString() ? `?${params}` : '')
  return (
    <Link
      href={href}
      className={`cn-cat-link${active ? ' cn-active' : ''}`}
      style={{
        ...s.catLink,
        color,
        background: active ? bg : 'transparent',
        borderColor: active ? `${color}55` : 'var(--border)',
        ['--cat-color' as string]: color,
        ['--cat-bg' as string]:    bg,
      }}
    >
      <span className="cn-cat-emoji" aria-hidden="true">{emoji}</span>
      <span className="cn-cat-label">{label}</span>
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
        <p style={s.emptyTitle}>Rien trouvé pour « {search} »</p>
        <p style={s.emptyDesc}>Essaie d'autres mots, ou retire les filtres pour voir toutes les conversations.</p>
      </div>
    )
  }
  if (sort === 'unanswered') {
    return (
      <div style={s.empty}>
        <Question size={28} color="var(--accent-text)" weight="duotone" />
        <p style={s.emptyTitle}>Tout le monde a été aidé</p>
        <p style={s.emptyDesc}>Aucune question en attente. Bravo la famille !</p>
      </div>
    )
  }
  return (
    <div style={s.empty}>
      <ChatCircle size={28} color="var(--accent-text)" weight="duotone" />
      <p style={s.emptyTitle}>
        {category !== 'all'
          ? `Personne n'a encore parlé de ${CATEGORIES[category].short}`
          : "C'est calme aujourd'hui. Brise la glace !"}
      </p>
      <p style={s.emptyDesc}>
        {category !== 'all'
          ? 'Sois le premier à lancer le sujet. Quelqu\'un attend probablement la même réponse que toi.'
          : 'Raconte d\'où tu viens, ce qui t\'a amené à la LCD, ou ce qui te bloque en ce moment. On est curieux de te lire.'}
      </p>
      <button onClick={onNew} style={s.emptyBtn}>
        <Plus size={13} weight="bold" /> Démarrer une conversation
      </button>
    </div>
  )
}

// ─── New members band ─────────────────────────────────────────────────

function NewMembersBand({ members }: { members: NewMember[] }) {
  const visible = members.slice(0, 5)
  return (
    <div style={s.newMembersBand} className="cn-members-band">
      <div style={s.newMembersTextCol} className="cn-members-text-col">
        <span style={s.newMembersLabel}>Nouveaux Chez Nous</span>
        <span style={s.newMembersTitle}>Bienvenue à eux</span>
      </div>
      <div style={s.newMembersList} className="cn-members-list">
        {visible.map(m => {
          const av = colorFromId(m.id)
          const initials = displayInitials({ pseudo: m.pseudo, full_name: m.full_name })
          const name = displayName({ pseudo: m.pseudo, full_name: m.full_name })
          return (
            <Link
              key={m.id}
              href={`/dashboard/chez-nous/membre/${m.id}`}
              style={s.newMemberCard}
              className="cn-member-card"
              title={`${name}${m.city ? ` · ${m.city}` : ''}`}
            >
              <span style={{ ...s.newMemberAvatar, background: av.bg, color: av.text }} className="cn-member-avatar">
                {initials}
              </span>
              <div style={s.newMemberInfo} className="cn-member-info">
                <span style={s.newMemberName} className="cn-member-name">
                  {name}
                  {m.is_contributor && <span style={s.contribDotMini} />}
                </span>
                {m.city && <span style={s.newMemberCity} className="cn-member-city">{m.city}</span>}
                {m.created_at && (
                  <span style={s.newMemberSince} className="cn-member-since">{formatRelative(m.created_at)}</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
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
        <p style={s.helper}>{title.length}/200 caractères. Pose ta question ou ton sujet en une phrase.</p>
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

  mapWrap: {
    width: '100%', display: 'flex', justifyContent: 'center',
    padding: '4px 0',
  },
  mapSvg: {
    width: '100%', maxWidth: '240px', height: 'auto',
  },
  regionLegend: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    paddingTop: '8px', borderTop: '1px solid var(--border)',
  },
  regionLegendItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '12px',
  },
  regionLegendName: { color: 'var(--text-2)' },
  regionLegendCount: {
    color: '#fb7185', fontWeight: 700,
    background: 'rgba(251,113,133,0.12)',
    padding: '1px 8px', borderRadius: '100px',
    fontSize: '11px',
  },

  activityList: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  activityRow: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '8px 0', borderBottom: '1px solid var(--border)',
    textDecoration: 'none' as const, color: 'var(--text-2)',
    fontSize: '12.5px', lineHeight: 1.4,
  },
  activityDotReply: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: '#34d399', flexShrink: 0, marginTop: '6px',
    boxShadow: '0 0 0 3px rgba(52,211,153,0.18)',
  },
  activityDotPost: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--accent-text)', flexShrink: 0, marginTop: '6px',
    boxShadow: '0 0 0 3px rgba(255,213,107,0.18)',
  },
  activityText: { display: 'flex', flexDirection: 'column' as const, gap: '2px', minWidth: 0, flex: 1 },
  activityTitle: {
    fontSize: '11.5px', color: 'var(--text-2)', fontStyle: 'italic' as const,
    overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const,
  },
  activityWhen: { fontSize: '10px', color: 'var(--text-muted)' },

  jasonCard: {
    background: 'linear-gradient(160deg, rgba(255,213,107,0.08), rgba(255,213,107,0.02))',
    border: '1px solid rgba(255,213,107,0.22)',
    borderRadius: '14px',
    padding: 'clamp(14px, 2.5vw, 18px)',
    display: 'flex', flexDirection: 'column' as const, gap: '12px',
  },
  jasonHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  jasonAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(255,213,107,0.18)', color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 700, flexShrink: 0,
    border: '1.5px solid rgba(255,213,107,0.35)',
  },
  jasonName: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '15px', fontWeight: 500, color: 'var(--text)',
  },
  jasonRole: { fontSize: '11px', color: 'var(--text-muted)' },
  jasonMessage: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65, margin: 0,
  },
  jasonSign: {
    fontSize: '12px', fontStyle: 'italic' as const,
    color: 'var(--accent-text)', alignSelf: 'flex-end',
    fontFamily: 'var(--font-fraunces), serif',
  },

  newMembersBand: {
    display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)',
    padding: 'clamp(12px, 2vw, 18px) clamp(14px, 2.5vw, 22px)',
    margin: '0 0 18px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.06), rgba(167,139,250,0.04))',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '14px',
    flexWrap: 'wrap' as const,
  },
  newMembersTextCol: {
    display: 'flex', flexDirection: 'column' as const, gap: '2px',
    minWidth: '140px', flexShrink: 0,
  },
  newMembersLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, color: 'var(--accent-text)',
  },
  newMembersTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '17px', fontWeight: 400, color: 'var(--text)',
  },
  newMembersList: {
    display: 'flex', gap: '10px', alignItems: 'center',
    flexWrap: 'wrap' as const, flex: '1 1 auto',
  },
  newMemberCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 12px 8px 8px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '100px',
    textDecoration: 'none' as const,
    color: 'var(--text)',
    transition: 'transform 0.15s, border-color 0.15s',
  },
  newMemberAvatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700, flexShrink: 0,
  },
  newMemberInfo: { display: 'flex', flexDirection: 'column' as const, gap: '0', minWidth: 0 },
  newMemberName: {
    fontSize: '13px', fontWeight: 600, color: 'var(--text)',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    whiteSpace: 'nowrap' as const,
  },
  newMemberCity: { fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' as const },
  newMemberSince: { fontSize: '10px', color: 'var(--text-3)', whiteSpace: 'nowrap' as const },

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

  heroActions: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
    marginTop: '16px',
  },
  heroInviteBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    background: 'rgba(255,213,107,0.10)',
    border: '1px solid rgba(255,213,107,0.30)',
    color: '#FFD56B',
    fontSize: '13px', fontWeight: 600,
    padding: '8px 14px', borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },

  inviteCard: {
    background: 'var(--surface)',
    border: '1px solid var(--accent-border)',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start',
    gap: '8px',
  },
  inviteIconWrap: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '4px',
  },
  inviteTitle: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    margin: 0,
  },
  inviteDesc: {
    fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5,
    margin: '0 0 4px',
  },
  inviteBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--accent-text)', color: 'var(--bg)',
    border: 'none', borderRadius: '9px',
    padding: '8px 14px', fontSize: '12px', fontWeight: 700,
    cursor: 'pointer', width: '100%', justifyContent: 'center',
  },

  // ─── Composer Facebook-style ───────────────────────────────────────
  composerCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '12px',
    marginBottom: '14px',
  },
  composerRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)',
  },
  composerAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700, color: 'var(--accent-text)',
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
  },
  composerInput: {
    flex: 1, textAlign: 'left' as const,
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '999px', padding: '11px 18px',
    fontSize: '14px', color: 'var(--text-3)',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s',
  },
  composerActions: {
    display: 'flex', gap: '4px',
    paddingTop: '10px',
  },
  composerAction: {
    flex: 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
    background: 'transparent', border: 'none', borderRadius: '8px',
    padding: '8px 6px', fontSize: '12.5px', fontWeight: 600,
    color: 'var(--text-2)',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.15s',
  },

  // ─── PostFormModal ─────────────────────────────────────────────────
  modalBackdrop: {
    position: 'fixed' as const, inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modalDialog: {
    position: 'relative' as const,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    width: '100%', maxWidth: '560px',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column' as const,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 400,
    color: 'var(--text)', margin: 0,
  },
  modalClose: {
    width: '32px', height: '32px', borderRadius: '50%',
    border: 'none', background: 'var(--bg)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalUser: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border)',
  },
  modalUserName: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0,
  },
  modalUserSub: {
    fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0',
  },
  modalBody: {
    padding: '16px 20px',
    overflowY: 'auto' as const,
    flex: 1,
  },

  sortBar: {
    marginBottom: '14px',
  },

  catRow: {
    display: 'flex', flexWrap: 'wrap', gap: '8px',
    marginBottom: '14px',
  },
  catLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 600,
    padding: '7px 13px', borderRadius: '999px',
    border: '1px solid', textDecoration: 'none',
    transition: 'background 0.15s, border-color 0.15s',
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
