'use client'

// Questions & réponses (ex-forum « Entre Hôtes », refonte sept. 2026).
// Recentré sur une promesse : « Pose ta question, réponse sous 48 h par Jason
// ou un hôte ». Retirés : compteurs de membres, top contributeurs, carte de
// France, nouveaux membres, invitations, présentation en 3 écrans. Avec peu de
// membres, ils mettaient surtout le vide en avant.

import RelativeTime from '@/components/ui/RelativeTime'
import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, ChatCircle, ChatCircleText, PushPin, Lock, ArrowFatUp, ArrowRight, Clock, Question, Pencil, Sparkle, MagnifyingGlass, X, CheckCircle, HandHeart } from '@phosphor-icons/react/dist/ssr'
import HubHero, { HeroEm, heroCard, heroCta, heroLink } from '@/components/dashboard/HubHero'
import { CATEGORIES, CATEGORY_ORDER, type CategoryId } from '@/lib/chez-nous/categories'
import { displayName, displayInitials, colorFromId } from '@/lib/chez-nous/display'
import { stripMarkdown } from '@/lib/chez-nous/markdown'
import { FREE_MONTHLY_QUESTIONS } from '@/lib/chez-nous/quota'
import type { BadgeId } from '@/lib/badges'
import { formatProStats, type ProStats } from '@/lib/chez-nous/pro-stats'
import MentionAutocomplete from '@/components/chez-nous/MentionAutocomplete'
import MarkdownToolbar from '@/components/chez-nous/MarkdownToolbar'
import ImageUploader from '@/components/chez-nous/ImageUploader'
import { useDraftAutosave } from '@/lib/chez-nous/use-draft'
import { createPost, createReply, togglePostVote } from './actions'

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
  images: string[]
  recent_replies: Array<{ id: string; author_id: string; body: string; created_at: string }>
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


export type Sort = 'recent' | 'answered' | 'unanswered' | 'popular' | 'unresolved'

type Props = {
  posts: Post[]
  authorsMap: Record<string, Author>
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
  currentCategory: CategoryId | 'all'
  currentSort: Sort
  currentSearch: string
  /** Nombre de questions qui ont déjà au moins une réponse */
  answeredCount: number
  /** ?ask=1 : ouvre directement le formulaire (liens « Pose ta question » du guide, des formations…) */
  openComposer: boolean
  /** Formule gratuite : questions restantes ce mois-ci (null = illimité), cf. lib/chez-nous/quota.ts */
  questionsLeft: number | null
}

// « Bienvenue » (présentations) n'est plus proposé à la création : la page
// sert à poser des questions. Les anciens posts restent visibles dans « Tout ».
const QUESTION_CATEGORIES = CATEGORY_ORDER.filter(c => c !== 'bienvenue')

const BASE = '/dashboard/chez-nous'

function feedHref(cat: CategoryId | 'all', sort: Sort, search: string) {
  const params = new URLSearchParams()
  if (cat !== 'all')     params.set('cat', cat)
  if (sort !== 'recent') params.set('sort', sort)
  if (search)            params.set('q', search)
  return BASE + (params.toString() ? `?${params}` : '')
}

export default function ChezNousFeed({ posts, authorsMap, currentUserId, currentUserName, currentCategory, currentSort, currentSearch, answeredCount, openComposer, questionsLeft }: Props) {
  const limitReached = questionsLeft === 0
  const [composer, setComposer] = useState<{ title: string } | null>(openComposer && !limitReached ? { title: '' } : null)
  // Plafond atteint (formule gratuite) : pas de formulaire, on affiche l'explication
  const [limitNotice, setLimitNotice] = useState(openComposer && limitReached)
  const ask = (title = '') => {
    if (limitReached) { setLimitNotice(true); return }
    setComposer({ title })
  }

  return (
    <div style={s.page}>
      <style>{`
        /* Réponse tronquée : texte complet au survol */
        .cn-recent-reply { position: relative; }
        .cn-recent-reply-full {
          position: absolute; left: 28px; top: calc(100% + 6px);
          z-index: 20; max-width: 480px; min-width: 240px;
          padding: 12px 14px; border-radius: 10px;
          background: var(--surface); border: 1px solid var(--border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          font-size: 13px; color: var(--text); line-height: 1.5;
          opacity: 0; visibility: hidden; pointer-events: none;
          transition: opacity 0.15s ease, transform 0.15s ease;
          transform: translateY(-4px);
        }
        .cn-recent-reply:hover .cn-recent-reply-full,
        .cn-recent-reply:focus-within .cn-recent-reply-full {
          opacity: 1; visibility: visible; transform: translateY(0);
        }
        @media (hover: none) { .cn-recent-reply-full { display: none; } }
        /* Pas de will-change: transform ici : chaque carte devenait un calque
           à part, et l aperçu au survol passait sous la carte suivante.
           (Pas d apostrophe dans ce bloc : React l échappe côté serveur,
           ce qui casse l hydratation.) */
        .cn-post-card { position: relative; }
        .cn-post-card:hover, .cn-post-card:focus-within { z-index: 5; }
        .cn-post-card:hover { border-color: var(--border-2); box-shadow: var(--shadow-sm); }
        .cn-cat-emoji { font-size: 13px; line-height: 1; }
        .cn-cat-label { font-weight: 600; }
        .qa-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: start; }
        .qa-aside { display: none; }
        @media (min-width: 1200px) {
          .qa-layout { grid-template-columns: minmax(0, 1fr) 320px; }
          .qa-aside { display: flex; position: sticky; top: calc(var(--header-h, 64px) + 16px); }
        }
        @media (max-width: 767px) {
          .cn-cat-row, .cn-sort-row {
            flex-wrap: nowrap !important; overflow-x: auto !important;
            -webkit-overflow-scrolling: touch; scrollbar-width: none;
          }
          .cn-cat-row::-webkit-scrollbar, .cn-sort-row::-webkit-scrollbar { display: none; }
          .cn-cat-link, .cn-sort-chip { flex-shrink: 0; }
        }
      `}</style>

      <HubHero
        eyebrowIcon={<ChatCircleText size={13} weight="fill" />}
        eyebrow="Questions & réponses"
        title={<>Pose ta question, <HeroEm>réponse sous 48 h</HeroEm></>}
        desc="Fiscalité, mairie, voyageurs, annonce, ménage : Jason ou un hôte expérimenté te répond sous 48 h, et tu es prévenu par email. Chaque réponse reste ici, pour tous les hôtes."
        steps={[
          ['Pose', 'ta question en une phrase, avec ton contexte'],
          ['Reçois', 'une réponse sous 48 h, par email'],
          ['Retrouve', 'toutes les réponses déjà données, juste en dessous'],
        ]}
        aside={<JasonPromise answeredCount={answeredCount} />}
      >
        <div style={s.heroCtas}>
          <button type="button" onClick={() => ask()} style={{ ...heroCta, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={15} weight="bold" /> Poser ma question
          </button>
          {answeredCount > 0 && currentSort !== 'answered' && (
            <Link href={feedHref('all', 'answered', '')} style={heroLink}>Voir les questions déjà répondues</Link>
          )}
        </div>
        {questionsLeft !== null && !limitNotice && (
          <p style={s.quotaLine}>
            Formule gratuite : {questionsLeft > 0
              ? <><strong style={{ color: 'var(--text)' }}>{questionsLeft} question{questionsLeft > 1 ? 's' : ''}</strong> restante{questionsLeft > 1 ? 's' : ''} ce mois-ci.</>
              : <>tes {FREE_MONTHLY_QUESTIONS} questions du mois sont posées.</>}
            {' '}<Link href="/dashboard/abonnement" style={s.quotaLink}>Illimité en Standard</Link>
          </p>
        )}
      </HubHero>

      {limitNotice && (
        <div style={s.limitCard} role="status">
          <span style={s.limitIco}><Lock size={18} weight="fill" /></span>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <strong style={{ display: 'block', color: 'var(--text)', fontSize: '14.5px' }}>Tes {FREE_MONTHLY_QUESTIONS} questions du mois sont posées</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55 }}>
              Avec la formule gratuite, tu poses {FREE_MONTHLY_QUESTIONS} questions par mois ; le compteur repart le 1er. En attendant, cherche dans les questions déjà répondues, ou passe en Standard pour poser tes questions sans limite.
            </span>
          </div>
          <Link href="/dashboard/abonnement" style={{ ...heroCta, padding: '10px 16px', fontSize: '13.5px' }}>Passer en Standard</Link>
        </div>
      )}

      <div className="qa-layout">
        <div style={s.mainCol}>
          <SearchBar key={currentSearch} cat={currentCategory} sort={currentSort} initial={currentSearch} />

          <div style={s.sortRow} className="cn-sort-row" role="tablist" aria-label="Filtrer les questions">
            <SortChip cat={currentCategory} sort="recent"     active={currentSort === 'recent'}     search={currentSearch} icon={Clock}       label="Récentes" />
            <SortChip cat={currentCategory} sort="answered"   active={currentSort === 'answered'}   search={currentSearch} icon={CheckCircle} label="Déjà répondues" />
            <SortChip cat={currentCategory} sort="unanswered" active={currentSort === 'unanswered'} search={currentSearch} icon={Question}    label="Sans réponse" />
          </div>

          <div style={s.catRow} className="cn-cat-row">
            <CategoryChip id="all" label="Tous les sujets" emoji="✨" color="var(--accent-text)" bg="var(--accent-bg)" active={currentCategory === 'all'} sort={currentSort} search={currentSearch} />
            {[...QUESTION_CATEGORIES, ...(currentCategory === 'bienvenue' ? ['bienvenue' as const] : [])].map(cid => (
              <CategoryChip
                key={cid} id={cid}
                label={CATEGORIES[cid].short}
                emoji={CATEGORIES[cid].emoji}
                color="var(--accent-text)" bg="var(--accent-bg)"
                active={currentCategory === cid}
                sort={currentSort}
                search={currentSearch}
              />
            ))}
          </div>

          <div style={s.feed}>
            {posts.length === 0 ? (
              <EmptyState category={currentCategory} sort={currentSort} search={currentSearch} onAsk={ask} />
            ) : (
              posts.map(post => (
                <PostRow key={post.id} post={post} author={authorsMap[post.author_id]} currentUserId={currentUserId} authorsMap={authorsMap} />
              ))
            )}
          </div>
        </div>

        <aside className="qa-aside" style={s.qaAside}>
          <GoodQuestionCard />
          <HelpCard />
        </aside>
      </div>

      {composer && (
        <PostFormModal
          onClose={() => setComposer(null)}
          defaultCategory={currentCategory === 'all' || currentCategory === 'bienvenue' ? 'autres' : currentCategory}
          defaultTitle={composer.title}
          firstName={currentUserName.split(/\s+/)[0] || ''}
          initials={(currentUserName || 'JM').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        />
      )}
    </div>
  )
}

// ─── Carte « promesse » de Jason (colonne droite du hero) ────────────────
function JasonPromise({ answeredCount }: { answeredCount: number }) {
  return (
    <div style={{ ...heroCard, gap: '12px' }}>
      <div style={s.jasonHeader}>
        <span style={s.jasonAvatar}>JM</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={s.jasonName}>Jason</span>
          <span style={s.jasonRole}>Fondateur</span>
        </div>
      </div>
      <p style={s.jasonMessage}>
        Je lis chaque question. Si je ne suis pas le mieux placé, je la confie à un hôte qui connaît le sujet.
        Dans tous les cas, <strong style={{ color: 'var(--text)' }}>tu as une réponse sous 48 h</strong>.
      </p>
      {answeredCount > 0 && (
        <span style={s.jasonStat}>
          <CheckCircle size={14} weight="fill" color="var(--accent-text)" />
          {answeredCount} question{answeredCount > 1 ? 's' : ''} déjà répondue{answeredCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

// ─── Recherche ────────────────────────────────────────────────────────────
function SearchBar({ cat, sort, initial }: { cat: CategoryId | 'all'; sort: Sort; initial: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initial)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(feedHref(cat, sort, value.trim()))
  }
  return (
    <form onSubmit={submit} style={s.searchForm} role="search">
      <MagnifyingGlass size={16} color="var(--text-muted)" />
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Cherche dans les questions déjà posées…"
        aria-label="Rechercher dans les questions"
        style={s.searchInput}
      />
      {initial && (
        <Link href={feedHref(cat, sort, '')} style={s.searchClear} aria-label="Effacer la recherche">
          <X size={14} weight="bold" />
        </Link>
      )}
    </form>
  )
}

// ─── Colonne droite (≥ 1200 px) ──────────────────────────────────────────
function GoodQuestionCard() {
  return (
    <div style={s.asideCard}>
      <div style={s.asideHead}>
        <Sparkle size={14} color="var(--accent-text)" weight="fill" />
        <span style={s.asideTitle}>Pour une réponse rapide</span>
      </div>
      <ul style={s.tipList}>
        <li style={s.tipItem}>Une question par sujet, formulée en une phrase</li>
        <li style={s.tipItem}>Ta ville et ta plateforme (Airbnb, Booking, en direct)</li>
        <li style={s.tipItem}>Ton statut si c&apos;est fiscal : LMNP, micro-BIC, résidence principale ou non</li>
        <li style={s.tipItem}>Ce que tu as déjà essayé ou lu</li>
      </ul>
    </div>
  )
}

function HelpCard() {
  return (
    <div style={{ ...s.asideCard, background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
      <div style={s.asideHead}>
        <HandHeart size={14} color="var(--accent-text)" weight="fill" />
        <span style={s.asideTitle}>Tu connais la réponse ?</span>
      </div>
      <p style={s.helpText}>
        Un hôte attend peut-être ton retour d&apos;expérience. Une réponse de deux lignes suffit souvent.
      </p>
      <Link href={feedHref('all', 'unanswered', '')} style={s.helpLink}>
        Voir les questions sans réponse <ArrowRight size={13} weight="bold" />
      </Link>
    </div>
  )
}

// ─── Formulaire de question (fenêtre) ────────────────────────────────────
function PostFormModal({ onClose, defaultCategory, defaultTitle, firstName, initials }: {
  onClose: () => void; defaultCategory: CategoryId; defaultTitle: string; firstName: string; initials: string
}) {
  // Bloque le défilement de la page + Échap pour fermer
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
          <h2 id="post-modal-title" style={s.modalTitle}>Pose ta question</h2>
          <button onClick={onClose} style={s.modalClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div style={s.modalUser}>
          <div style={s.composerAvatar}>{initials}</div>
          <div>
            <p style={s.modalUserName}>{firstName || 'Toi'}</p>
            <p style={s.modalUserSub}>Jason ou un hôte te répond sous 48 h. Tu reçois la réponse par email.</p>
          </div>
        </div>

        <div style={s.modalBody}>
          <NewPostForm onSuccess={onClose} defaultCategory={defaultCategory} defaultTitle={defaultTitle} />
        </div>
      </div>
    </div>
  )
}


// ─── Post row ─────────────────────────────────────────────────────────

function PostRow({ post, author, currentUserId, authorsMap }: { post: Post; author?: Author; currentUserId: string; authorsMap: Record<string, Author> }) {
  const router = useRouter()
  const [voted, setVoted] = useState(post.has_voted)
  const [count, setCount] = useState(post.vote_count)
  const [expanded, setExpanded] = useState(false)
  const [showInlineReply, setShowInlineReply] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyPending, setReplyPending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replyCountLocal, setReplyCountLocal] = useState(post.reply_count)
  const inlineTaRef = useRef<HTMLTextAreaElement>(null)

  const av       = colorFromId(post.author_id)
  const initials = author ? displayInitials({ pseudo: author.pseudo, full_name: author.full_name }) : '?'
  const name     = author ? displayName({ pseudo: author.pseudo, full_name: author.full_name }) : 'Anonyme'
  const cat      = CATEGORIES[post.category]
  const isAuthor = post.author_id === currentUserId

  // Vote 100% optimiste : pas de startTransition, pas de router.refresh().
  // L'UI bascule instantanément ; le serveur reçoit l'update en fond.
  const onVote = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wasVoted = voted
    setVoted(!wasVoted)
    setCount(c => c + (wasVoted ? -1 : 1))
    togglePostVote(post.id, wasVoted).then(res => {
      if (!res?.ok) {
        setVoted(wasVoted)
        setCount(c => c + (wasVoted ? 1 : -1))
      }
    })
  }

  // Toggle du form de réponse inline. Ne navigue PAS (à l'inverse du
  // ancien bouton 'Commenter' qui amenait sur /chez-nous/[id]#reply).
  const toggleInlineReply = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowInlineReply(v => !v)
    setReplyError(null)
    setTimeout(() => inlineTaRef.current?.focus(), 50)
  }

  const submitInlineReply = async () => {
    const trimmed = replyBody.trim()
    if (!trimmed || replyPending) return
    setReplyPending(true)
    setReplyError(null)
    const res = await createReply({ postId: post.id, body: trimmed })
    setReplyPending(false)
    if (!res.ok) { setReplyError(res.error); return }
    setReplyBody('')
    setShowInlineReply(false)
    setReplyCountLocal(c => c + 1)
    router.refresh()
  }

  // Rendu light du markdown pour le feed : bold + italique uniquement,
  // pas d'autolinks ni de <a> imbriqués (la carte entière est déjà un lien).
  // On préserve les \n via white-space: pre-line dans le CSS.
  const renderedBody = (() => {
    const escapeHtml = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    // Plafonnement : pas plus de 2 sauts de ligne consécutifs (évite les trous géants).
    let txt = post.body
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    return escapeHtml(txt)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  })()

  // Décide si on doit proposer 'Voir plus' : heuristique simple sur la longueur
  // et le nombre de sauts de ligne (suffisant pour ce contexte forum).
  const newlineCount = (post.body.match(/\n/g) || []).length
  const isLong = post.body.length > 500 || newlineCount > 5

  const hasImages = post.images && post.images.length > 0

  return (
    <div style={s.postCard} className="cn-post-card">
      {/* Avatar (cliquable → profil) */}
      <Link href={`/dashboard/chez-nous/membre/${post.author_id}`} style={{ ...s.avatar, background: av.bg, color: av.text }} title={name}>
        {initials}
      </Link>

      {/* Contenu */}
      <div style={s.postBody}>
        <Link href={`/dashboard/chez-nous/${post.id}`} style={s.postBodyLink}>
          <div style={s.postMeta}>
            <span style={{ ...s.catChip, color: cat.color, background: cat.bg }}>{cat.short}</span>
            {post.is_resolved && (
              <span style={s.resolvedChip}>
                <CheckCircle size={11} weight="fill" /> Résolu
              </span>
            )}
            {post.pinned && <PushPin size={12} color="var(--accent-text)" weight="fill" />}
            {post.locked && <Lock size={12} color="#94a3b8" weight="fill" />}
            {post.edited_at && <span style={s.editedTag}>modifié</span>}
          </div>
          <h3 style={s.postTitle}>{post.title}</h3>
        </Link>

        {/* Corps : excerpt cliquable (ouvre le détail) + bouton Voir plus inline.
            Le bouton expand est en dehors du Link pour ne pas déclencher la navigation. */}
        <Link
          href={`/dashboard/chez-nous/${post.id}`}
          style={{
            ...s.postExcerpt,
            ...(expanded ? { WebkitLineClamp: 'unset' as unknown as number, display: 'block' } : {}),
          }}
          dangerouslySetInnerHTML={{ __html: renderedBody }}
        />
        {isLong && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(v => !v) }}
            style={s.expandBtn}
          >
            {expanded ? 'Voir moins' : 'Voir plus'}
          </button>
        )}

        {hasImages && (
          <Link
            href={`/dashboard/chez-nous/${post.id}`}
            style={{
              ...s.imageGrid,
              gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr',
            }}
          >
            {post.images.slice(0, 4).map((url, i) => (
              <div
                key={i}
                style={{
                  ...s.imageThumb,
                  aspectRatio: post.images.length === 1 ? '16 / 10' : '1 / 1',
                }}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 360px"
                  style={{ objectFit: 'cover', display: 'block' }}
                  unoptimized={false}
                />
                {i === 3 && post.images.length > 4 && (
                  <span style={s.imageOverlayMore}>+{post.images.length - 4}</span>
                )}
              </div>
            ))}
          </Link>
        )}

        {/* Aperçu des 2 dernières réponses — évite à l'utilisateur de cliquer
            quand la discussion est déjà claire dans le feed. */}
        {post.recent_replies.length > 0 && (
          <Link href={`/dashboard/chez-nous/${post.id}`} style={s.recentReplies}>
            {post.recent_replies.slice().reverse().map(r => {
              const rAuthor = authorsMap[r.author_id]
              const rName = rAuthor ? displayName({ pseudo: rAuthor.pseudo, full_name: rAuthor.full_name }) : 'Anonyme'
              const rAv = colorFromId(r.author_id)
              const rInitials = rAuthor ? displayInitials({ pseudo: rAuthor.pseudo, full_name: rAuthor.full_name }) : '?'
              // Texte brut (liens [texte](url) compris), sinon l'aperçu affichait le Markdown
              const rExcerpt = stripMarkdown(r.body).replace(/\s+/g, ' ').trim()
              const isTruncated = rExcerpt.length > 120
              return (
                <div key={r.id} style={s.recentReplyItem} className="cn-recent-reply">
                  <span style={{ ...s.recentReplyAvatar, background: rAv.bg, color: rAv.text }}>{rInitials}</span>
                  <span style={s.recentReplyText}>
                    <strong style={s.recentReplyAuthor}>{rName}</strong>
                    <span style={s.recentReplyDot}> · </span>
                    {isTruncated ? rExcerpt.slice(0, 120) + '…' : rExcerpt}
                  </span>
                  {isTruncated && (
                    <span className="cn-recent-reply-full" role="tooltip">
                      <strong>{rName}</strong>
                      <span style={{ display: 'block', marginTop: '6px' }}>
                        {rExcerpt.length > 600 ? `${rExcerpt.slice(0, 600)}… (clique pour lire la suite)` : rExcerpt}
                      </span>
                    </span>
                  )}
                </div>
              )
            })}
            {post.reply_count > post.recent_replies.length && (
              <span style={s.recentRepliesMore}>
                + {post.reply_count - post.recent_replies.length} autre{post.reply_count - post.recent_replies.length > 1 ? 's' : ''}
              </span>
            )}
          </Link>
        )}

        <div style={s.postFoot}>
          <span style={s.postFootName}>
            {name}
            {author?.is_contributor && <span style={s.contribDot} title="Contributeur" />}
            {author?.role === 'admin' && <span style={s.adminTag}>admin</span>}
          </span>
          {author?.proStats && formatProStats(author.proStats) && (
            <span style={s.proStatsTxt}>{formatProStats(author.proStats)}</span>
          )}
          <span style={s.postFootDot}>·</span>
          <Link href={`/dashboard/chez-nous/${post.id}`} style={s.postFootLink}>
            <RelativeTime iso={post.last_reply_at ?? post.created_at} />
          </Link>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {isAuthor && (
              <Link
                href={`/dashboard/chez-nous/${post.id}?edit=1`}
                style={s.replyBtn}
                title="Modifier ce post"
                onClick={e => e.stopPropagation()}
              >
                <Pencil size={12} weight="bold" />
                <span>Modifier</span>
              </Link>
            )}
            <button
              type="button"
              onClick={toggleInlineReply}
              style={s.replyBtn}
              title={replyCountLocal > 0
                ? `${replyCountLocal} commentaire${replyCountLocal > 1 ? 's' : ''} — clique pour ajouter le tien`
                : 'Ajouter un commentaire rapide'}
            >
              <ChatCircle size={13} weight="fill" />
              {replyCountLocal > 0 ? (
                <span><strong style={{ fontWeight: 700 }}>{replyCountLocal}</strong> · Commenter</span>
              ) : (
                <span>Commenter</span>
              )}
            </button>
            <button
              type="button"
              onClick={onVote}
              style={{
                ...s.voteInline,
                color: voted ? 'var(--accent-text)' : 'var(--text-muted)',
                background: voted ? 'var(--accent-bg-2)' : 'transparent',
                borderColor: voted ? 'var(--accent-border-2)' : 'var(--border)',
              }}
              title={voted ? 'Retirer mon vote utile' : 'Marquer comme utile'}
              aria-label={voted ? 'Retirer mon vote utile' : 'Marquer comme utile'}
            >
              <ArrowFatUp size={12} weight={voted ? 'fill' : 'regular'} />
              {count > 0 && <span>{count}</span>}
              <span style={s.voteInlineLabel}>{voted ? 'Utile' : 'Marquer utile'}</span>
            </button>
          </span>
        </div>

        {/* Form de réponse inline (click 'Commenter' → toggle).
            Pour LIRE les commentaires existants, il y a déjà les 2 dernières
            réponses affichées au-dessus + le compteur 'N · Commenter' qui les
            indique. Pour creuser : clic sur l'aperçu / le titre du post →
            page détail. */}
        {showInlineReply && (
          <div style={s.inlineReplyWrap} onClick={e => e.stopPropagation()}>
            {replyCountLocal > 0 && (
              <Link href={`/dashboard/chez-nous/${post.id}`} style={s.inlineReplySeeAll}>
                Voir tous les {replyCountLocal} commentaire{replyCountLocal > 1 ? 's' : ''} →
              </Link>
            )}
            <MentionAutocomplete
              textareaRef={inlineTaRef}
              value={replyBody}
              onChange={setReplyBody}
              onKeyDownExtra={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  submitInlineReply()
                }
              }}
              placeholder={`Réponds à ${name}…`}
              maxLength={4000}
              rows={3}
              style={s.inlineReplyTextarea}
            />
            {replyError && <p style={s.inlineReplyError}>{replyError}</p>}
            <div style={s.inlineReplyActions}>
              <span style={s.inlineReplyHint}>⌘+Entrée pour envoyer</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => { setShowInlineReply(false); setReplyBody(''); setReplyError(null) }}
                  style={s.inlineReplyCancel}
                  disabled={replyPending}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitInlineReply}
                  disabled={replyPending || !replyBody.trim()}
                  style={{
                    ...s.inlineReplySubmit,
                    ...(replyPending || !replyBody.trim() ? s.inlineReplySubmitDisabled : {}),
                  }}
                >
                  {replyPending ? 'Envoi…' : 'Répondre'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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

function EmptyState({ category, sort, search, onAsk }: { category: CategoryId | 'all'; sort: Sort; search: string; onAsk: (title?: string) => void }) {
  if (search) {
    return (
      <div style={s.empty}>
        <MagnifyingGlass size={28} color="var(--accent-text)" weight="duotone" />
        <p style={s.emptyTitle}>Personne n&apos;a encore posé cette question</p>
        <p style={s.emptyDesc}>Rien trouvé pour « {search} ». Pose-la : Jason ou un hôte te répond sous 48 h.</p>
        <button onClick={() => onAsk(search)} style={s.emptyBtn}>
          <Plus size={13} weight="bold" /> Poser cette question
        </button>
      </div>
    )
  }
  if (sort === 'unanswered') {
    return (
      <div style={s.empty}>
        <CheckCircle size={28} color="var(--accent-text)" weight="duotone" />
        <p style={s.emptyTitle}>Toutes les questions ont une réponse</p>
        <p style={s.emptyDesc}>Rien en attente pour le moment.</p>
      </div>
    )
  }
  return (
    <div style={s.empty}>
      <ChatCircleText size={28} color="var(--accent-text)" weight="duotone" />
      <p style={s.emptyTitle}>
        {category !== 'all'
          ? `Aucune question sur « ${CATEGORIES[category].short} » pour l'instant`
          : 'Aucune question pour l’instant'}
      </p>
      <p style={s.emptyDesc}>Pose la première : Jason ou un hôte te répond sous 48 h, et la réponse servira aux suivants.</p>
      <button onClick={() => onAsk()} style={s.emptyBtn}>
        <Plus size={13} weight="bold" /> Poser ma question
      </button>
    </div>
  )
}


function NewPostForm({ onSuccess, defaultCategory, defaultTitle = '' }: { onSuccess: () => void; defaultCategory: CategoryId; defaultTitle?: string }) {
  const [category, setCategory] = useState<CategoryId>(defaultCategory)
  const [title, setTitle] = useState(defaultTitle)
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const taRef = useRef<HTMLTextAreaElement>(null!)
  const [restoredNotice, setRestoredNotice] = useState(false)

  const draftValue = { category, title, body, images }
  const { restored, clearDraft } = useDraftAutosave('new-post', draftValue, {
    skipIfEmpty: v => !v.title.trim() && !v.body.trim() && v.images.length === 0,
  })

  // Hydrate depuis le brouillon une fois au montage
  useEffect(() => {
    // Question pré-remplie depuis la recherche : elle prime sur un ancien brouillon
    if (restored && !restoredNotice && !defaultTitle) {
      if (restored.category) setCategory(restored.category)
      if (restored.title) setTitle(restored.title)
      if (restored.body) setBody(restored.body)
      if (restored.images?.length) setImages(restored.images)
      setRestoredNotice(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored])

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const res = await createPost({ category, title, body, images })
      if (res.ok) {
        setTitle(''); setBody(''); setImages([])
        clearDraft()
        onSuccess()
        router.push(`/dashboard/chez-nous/${res.postId}`)
      } else {
        setError(res.error)
      }
    })
  }

  const discardDraft = () => {
    setCategory(defaultCategory); setTitle(''); setBody(''); setImages([])
    clearDraft()
    setRestoredNotice(false)
  }

  return (
    <div style={s.form}>
      {restoredNotice && (title.trim() || body.trim()) && (
        <div style={s.draftNotice}>
          <span>Brouillon récupéré (sauvegarde auto)</span>
          <button onClick={discardDraft} style={s.draftNoticeBtn} type="button">
            Effacer
          </button>
        </div>
      )}
      <div style={s.formField}>
        <label style={s.label}>Sujet</label>
        <select value={category} onChange={e => setCategory(e.target.value as CategoryId)} style={s.select}>
          {QUESTION_CATEGORIES.map(cid => (
            <option key={cid} value={cid}>{CATEGORIES[cid].label}</option>
          ))}
        </select>
        <p style={s.helper}>{CATEGORIES[category].description}</p>
      </div>

      <div style={s.formField}>
        <label style={s.label}>
          Ta question <span style={s.required}>*</span>
        </label>
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Ex. : Dois-je déclarer mon meublé en mairie à Lyon ?"
          style={s.input} maxLength={200}
          required
        />
        <p style={s.helper}>{title.length}/200 caractères. En une phrase : c&apos;est ce que les autres hôtes verront.</p>
      </div>

      <div style={s.formField}>
        <label style={s.label}>
          Ton contexte <span style={s.required}>*</span>
        </label>
        <MarkdownToolbar textareaRef={taRef} value={body} onChange={setBody} />
        <MentionAutocomplete
          textareaRef={taRef}
          value={body}
          onChange={setBody}
          placeholder="Ville, plateforme, nombre de logements, statut (LMNP, résidence principale…), ce que tu as déjà essayé…"
          style={s.textarea}
          rows={6}
          maxLength={8000}
          required
        />
        <p style={s.helper}>{body.length}/8000</p>
      </div>

      <div style={s.formField}>
        <label style={s.label}>Images (optionnel)</label>
        <ImageUploader value={images} onChange={setImages} max={3} />
      </div>

      {error && <p style={s.error}>{error}</p>}

      {(!title.trim() || !body.trim()) && !error && (
        <p style={s.helperRequired}>
          {!title.trim() && !body.trim()
            ? 'Écris ta question et ton contexte pour publier.'
            : !title.trim()
              ? 'Il manque ta question.'
              : 'Ajoute un peu de contexte pour avoir une réponse précise.'}
        </p>
      )}

      <div style={s.formActions}>
        <button onClick={onSuccess} style={s.btnGhost} disabled={pending}>Annuler</button>
        <button onClick={submit} style={s.btnPrimary} disabled={pending || !title.trim() || !body.trim()}>
          {pending ? 'Envoi…' : 'Publier ma question'}
        </button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  heroCtas: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' },
  quotaLine: { fontSize: '13px', color: 'var(--text-2)', margin: '12px 0 0' },
  quotaLink: { color: 'var(--accent-text)', fontWeight: 600 },
  limitCard: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px', padding: '16px 18px', marginBottom: '20px',
    borderRadius: '16px', background: 'rgba(255,213,107,0.14)', border: '1px solid rgba(255,213,107,0.45)',
  },
  limitIco: {
    width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--surface)', color: 'var(--accent-text)',
  },
  qaAside: { flexDirection: 'column', gap: '14px' },
  searchForm: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
    padding: '4px 8px 4px 16px',
  },
  searchInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
    color: 'var(--text)', fontSize: '14.5px', fontFamily: 'inherit', padding: '11px 0',
  },
  searchClear: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px',
    borderRadius: '8px', color: 'var(--text-2)', textDecoration: 'none',
  },
  jasonStat: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' },
  helpText: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
  helpLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'none' },
  page: { padding: 'clamp(14px, 3vw, 44px)', width: '100%' },



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


  mainCol: {
    flex: '1 1 600px', minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: '14px',
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




  tipList: { margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  tipItem: {
    fontSize: '12px', lineHeight: 1.5, color: 'var(--text-2)',
  },





  // ─── Composer Facebook-style ───────────────────────────────────────
  composerAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'var(--t-sm)', fontWeight: 700, color: 'var(--accent-text)',
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0,
    transition: 'transform var(--d-base) var(--ease-spring)',
  },
  // ─── PostFormModal ─────────────────────────────────────────────────
  modalBackdrop: {
    position: 'fixed' as const, inset: 0, zIndex: 1000,
    // Backdrop avec blur moderne 2026 (verre dépoli)
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'var(--s-4)',
    animation: 'fadeIn var(--d-base) var(--ease-smooth)',
  },
  modalDialog: {
    position: 'relative' as const,
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)',
    width: '100%', maxWidth: '560px',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column' as const,
    boxShadow: 'var(--shadow-xl)',
    overflow: 'hidden',
    animation: 'scaleIn var(--d-base) var(--ease-out)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 'var(--s-4) var(--s-5)',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'var(--t-lg)', fontWeight: 400,
    color: 'var(--text)', margin: 0,
    letterSpacing: 'var(--ls-snug)',
  },
  modalClose: {
    width: '34px', height: '34px', borderRadius: 'var(--r-pill)',
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-spring)',
  },
  modalUser: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
    padding: 'var(--s-4) var(--s-5)',
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

  form: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '14px',
    marginBottom: '20px',
  },
  draftNotice: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '10px', padding: '8px 12px',
    background: 'rgba(255,213,107,0.10)', border: '1px solid rgba(255,213,107,0.35)',
    borderRadius: '8px', fontSize: '12px', color: 'var(--text-2)',
  },
  draftNoticeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-2)', fontSize: '12px', fontWeight: 600,
    textDecoration: 'underline', padding: 0,
  },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' },
  required: { color: 'var(--danger)', fontWeight: 700, marginLeft: '2px' },
  helper: { fontSize: '11px', color: 'var(--text-muted)', margin: 0 },
  helperRequired: {
    fontSize: '12px', color: '#b45309',
    background: 'rgba(217,119,6,0.08)',
    border: '1px solid rgba(217,119,6,0.20)',
    borderRadius: '8px',
    padding: '8px 12px',
    margin: 0,
  },
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
    background: 'var(--accent-text)', color: 'var(--bg)',
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
    background: 'var(--accent-text)', color: 'var(--bg)',
    fontWeight: 700, fontSize: '13px',
    padding: '8px 16px', borderRadius: '10px',
    border: 'none', cursor: 'pointer', marginTop: '10px',
  },

  postCard: {
    display: 'flex', gap: 'var(--s-4)',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', padding: 'var(--s-4) var(--s-5)',
    transition: 'border-color var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-smooth)',
    alignItems: 'flex-start',
  },
  replyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)',
    padding: '5px 12px', borderRadius: 'var(--r-pill)',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)',
    fontFamily: 'inherit',
    fontSize: 'var(--t-xs)', fontWeight: 500,
    textDecoration: 'none',
    transition: 'background var(--d-base) var(--ease-smooth), color var(--d-base) var(--ease-smooth), border-color var(--d-base) var(--ease-smooth)',
    lineHeight: 1,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  inlineReplyWrap: {
    marginTop: '10px',
    padding: '10px 12px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
  },
  inlineReplySeeAll: {
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)',
    textDecoration: 'none',
    alignSelf: 'flex-start',
  },
  inlineReplyTextarea: {
    width: '100%', padding: '8px 10px',
    fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.55,
    color: 'var(--text)', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: '8px',
    resize: 'vertical' as const, minHeight: '60px',
  },
  inlineReplyError: {
    margin: 0, fontSize: '12px', color: 'var(--danger)',
  },
  inlineReplyActions: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
  },
  inlineReplyHint: {
    fontSize: '11px', color: 'var(--text-muted)',
  },
  inlineReplyCancel: {
    padding: '6px 12px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-2)', fontSize: '12px', fontFamily: 'inherit',
    cursor: 'pointer',
  },
  inlineReplySubmit: {
    padding: '6px 14px', borderRadius: '8px',
    background: 'var(--accent-bg-2)', border: '1px solid var(--accent-border-2)',
    color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
    cursor: 'pointer',
  },
  inlineReplySubmitDisabled: {
    opacity: 0.5, cursor: 'not-allowed',
  },
  voteInline: {
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 9px', borderRadius: '999px',
    background: 'transparent', border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11.5px', fontWeight: 600,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    lineHeight: 1,
  },
  voteInlineLabel: { fontSize: '11px' },

  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
    flexShrink: 0, textDecoration: 'none',
  },
  postBody: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  postBodyLink: {
    display: 'flex', flexDirection: 'column', gap: '5px',
    textDecoration: 'none', color: 'inherit',
  },
  postFootLink: {
    color: 'inherit', textDecoration: 'none',
  },
  postMeta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  resolvedChip: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' as const,
    color: 'var(--success-1)',
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
    fontSize: '13.5px', color: 'var(--text-2)',
    margin: 0, lineHeight: 1.65,
    textDecoration: 'none',
    // pre-line : on garde les \n des paragraphes de l'auteur (façon Insta/Facebook).
    // Combiné au -webkit-line-clamp, le navigateur tronque proprement après 6 lignes
    // visibles. Si l'utilisateur clique 'Voir plus', on bascule sur display: block et
    // -webkit-line-clamp: unset pour libérer la hauteur.
    whiteSpace: 'pre-line' as const,
    display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
  },
  expandBtn: {
    background: 'transparent', border: 'none', padding: '2px 0',
    color: 'var(--accent-text)', fontSize: '12.5px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    alignSelf: 'flex-start',
    marginTop: '-2px',
  },
  imageGrid: {
    display: 'grid',
    gap: '4px',
    marginTop: '8px',
    borderRadius: '12px',
    overflow: 'hidden',
    textDecoration: 'none',
  },
  imageThumb: {
    width: '100%',
    background: 'var(--surface)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  imageOverlayMore: {
    position: 'absolute' as const, inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '18px', fontWeight: 700,
    fontFamily: 'var(--font-fraunces), serif',
  },
  recentReplies: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    padding: '10px 12px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    marginTop: '4px',
    textDecoration: 'none', color: 'inherit',
  },
  recentReplyItem: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
  },
  recentReplyAvatar: {
    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: 700, lineHeight: 1,
    fontFamily: 'var(--font-fraunces), serif',
  },
  recentReplyText: {
    fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5,
    flex: 1, minWidth: 0,
    overflow: 'hidden' as const,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
  },
  recentReplyAuthor: { color: 'var(--text)', fontWeight: 600 },
  recentReplyDot: { color: 'var(--text-muted)' },
  recentRepliesMore: {
    fontSize: '11.5px', fontWeight: 600,
    color: 'var(--accent-text)',
    paddingLeft: '32px',
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
  postFootDot: { opacity: 0.5 },
}
