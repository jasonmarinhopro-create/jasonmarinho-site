'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Newspaper, ArrowUpRight, Clock, Funnel, Star, Check,
  BookmarkSimple, Hourglass, Sparkle, ShareNetwork, CheckCircle,
  MagnifyingGlass, X,
} from '@phosphor-icons/react/dist/ssr'
import type { Actualite } from './page'
import { markActualiteRead, markAllActualitesRead, toggleActualiteFavorite } from './actions'

// Nombre d'articles affichés au premier rendu (puis +PAGE_SIZE par clic "Voir plus")
const PAGE_SIZE = 24

const CATEGORIES = [
  { value: 'all',                 label: 'Tout',                color: 'var(--text-2)', bg: 'var(--border)' },
  { value: 'reglementation',      label: 'Réglementation',      color: 'var(--info)',       bg: 'rgba(96,165,250,0.12)' },
  { value: 'fiscalite',           label: 'Fiscalité',           color: 'var(--success-1)',       bg: 'var(--success-bg)' },
  { value: 'juridique',           label: 'Juridique',           color: 'var(--danger)',       bg: 'rgba(248,113,113,0.12)' },
  { value: 'plateformes',         label: 'Plateformes OTA',     color: '#fb923c',       bg: 'rgba(251,146,60,0.12)' },
  { value: 'marche',              label: 'Marché',              color: '#f472b6',       bg: 'rgba(244,114,182,0.12)' },
  { value: 'outils',              label: 'Outils & Tech',       color: '#a78bfa',       bg: 'rgba(167,139,250,0.12)' },
  { value: 'gites',               label: 'Gîtes & Meublés',     color: 'var(--warning)',       bg: 'rgba(245,158,11,0.12)' },
  { value: 'chambres-hotes',      label: "Chambres d'hôtes",    color: '#ec4899',       bg: 'rgba(236,72,153,0.12)' },
  { value: 'conciergerie',        label: 'Conciergeries',       color: '#8b5cf6',       bg: 'rgba(139,92,246,0.12)' },
  { value: 'reservation-directe', label: 'Réserv. directe',    color: 'var(--success-1)',       bg: 'rgba(16,185,129,0.12)' },
  { value: 'communes',            label: 'Communes & Villes',   color: '#64748b',       bg: 'rgba(100,116,139,0.12)' },
  { value: 'driing',              label: 'Driing',              color: '#FFD56B',       bg: 'rgba(255,213,107,0.12)' },
  { value: 'general',             label: 'Général',             color: '#94a3b8',       bg: 'rgba(148,163,184,0.12)' },
]

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function getDomain(url: string | null) {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return null }
}

// Estimation du temps de lecture : basé sur read_time_minutes en DB, sinon ~200 mots/min minimum 2 min
function readTime(summary: string, minutes?: number | null) {
  if (minutes && minutes > 0) return minutes
  const words = summary.trim().split(/\s+/).length
  return Math.max(2, Math.round(words / 200))
}

// Décompte jusqu'à la deadline
function deadlineLabel(deadlineDate: string) {
  const dl = new Date(deadlineDate + 'T23:59:59')
  const now = new Date()
  const diffMs = dl.getTime() - now.getTime()
  const days = Math.ceil(diffMs / 86400000)
  if (days < 0) return null
  if (days === 0) return { label: "Aujourd'hui", color: 'var(--danger)', urgent: true }
  if (days === 1) return { label: 'Demain', color: 'var(--danger)', urgent: true }
  if (days <= 7) return { label: `Dans ${days} jours`, color: 'var(--danger)', urgent: true }
  if (days <= 30) return { label: `Dans ${days} jours`, color: '#d97706', urgent: false }
  if (days <= 90) return { label: `Dans ${days} jours`, color: '#0369a1', urgent: false }
  const dl2 = new Date(deadlineDate + 'T12:00:00')
  return { label: dl2.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), color: '#0369a1', urgent: false }
}

export default function ActualitesView({
  articles,
  isDecouverte = false,
  totalCount = 0,
  readIds = [],
  favoriteIds = [],
  detectedRegions = [],
  isAuthenticated = false,
}: {
  articles: Actualite[]
  isDecouverte?: boolean
  totalCount?: number
  readIds?: string[]
  favoriteIds?: string[]
  detectedRegions?: string[]
  isAuthenticated?: boolean
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // Pagination : on charge PAGE_SIZE articles, l'utilisateur clique "Voir plus"
  // pour révéler la prochaine batch. Évite de rendre 200+ cards d'un coup
  // quand la base grossit.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset pagination quand un filtre change (sinon "Voir plus" garde le
  // décompte d'un set précédent).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeFilter, showUnreadOnly, searchQuery])

  // Optimistic state
  const [reads, setReads] = useState<Set<string>>(new Set(readIds))
  const [favorites, setFavorites] = useState<Set<string>>(new Set(favoriteIds))
  const [, startTransition] = useTransition()
  const [shareToast, setShareToast] = useState<string | null>(null)

  const unreadCount = articles.filter(a => !reads.has(a.id)).length
  const usedCategories = new Set(articles.map(a => a.category))
  const visibleCats = CATEGORIES.filter(c => c.value === 'all' || usedCategories.has(c.value))

  // Pinned articles ("À la une")
  const pinned = articles.filter(a => a.is_pinned)
  const pinnedIds = new Set(pinned.map(a => a.id))

  // Articles avec deadline pertinente
  const upcomingDeadlines = useMemo(() => {
    return articles
      .filter(a => a.deadline_date && deadlineLabel(a.deadline_date))
      .sort((a, b) => (a.deadline_date ?? '').localeCompare(b.deadline_date ?? ''))
      .slice(0, 3)
  }, [articles])

  // "Pour toi" : articles correspondant aux régions détectées
  const recommendedForUser = useMemo(() => {
    if (detectedRegions.length === 0) return []
    return articles
      .filter(a => !pinnedIds.has(a.id))
      .filter(a => {
        const regionMatch = (a.regions ?? []).some(r => detectedRegions.includes(r))
        const titleMatch = detectedRegions.some(r => a.title.toLowerCase().includes(r.toLowerCase()))
        return regionMatch || titleMatch
      })
      .slice(0, 3)
  }, [articles, detectedRegions, pinnedIds])

  // Articles principaux (non-pinned + filtrés + recherche texte)
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return articles
      .filter(a => !pinnedIds.has(a.id))
      .filter(a => activeFilter === 'all' || a.category === activeFilter)
      .filter(a => !showUnreadOnly || !reads.has(a.id))
      .filter(a => !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q))
  }, [articles, pinnedIds, activeFilter, showUnreadOnly, reads, searchQuery])

  // Slice par pagination AVANT le groupage temporel : si on faisait l'inverse,
  // les groupes changeraient à chaque "Voir plus" (pas naturel UX).
  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  // Buckets temporels (cette semaine / ce mois / plus ancien) appliqués à
  // la tranche VISIBLE. Donne du rythme sans casser la pagination.
  const groupedVisible = useMemo(() => {
    const now = Date.now()
    const ONE_WEEK = 7 * 86400000
    const ONE_MONTH = 30 * 86400000
    const buckets: { key: string; label: string; items: Actualite[] }[] = [
      { key: 'week',   label: 'Cette semaine', items: [] },
      { key: 'month',  label: 'Ce mois-ci',    items: [] },
      { key: 'older',  label: 'Plus ancien',   items: [] },
    ]
    for (const a of visible) {
      const t = new Date(a.published_at ?? a.created_at).getTime()
      if (isNaN(t)) { buckets[2].items.push(a); continue }
      const age = now - t
      if (age <= ONE_WEEK) buckets[0].items.push(a)
      else if (age <= ONE_MONTH) buckets[1].items.push(a)
      else buckets[2].items.push(a)
    }
    return buckets.filter(b => b.items.length > 0)
  }, [visible])

  function handleMarkRead(id: string) {
    if (!isAuthenticated || reads.has(id)) return
    setReads(prev => new Set(prev).add(id))
    startTransition(async () => {
      const res = await markActualiteRead(id)
      if (res.error) {
        setReads(prev => { const n = new Set(prev); n.delete(id); return n })
      }
    })
  }

  function handleMarkAllRead() {
    if (!isAuthenticated) return
    const unreadList = articles.filter(a => !reads.has(a.id)).map(a => a.id)
    if (unreadList.length === 0) return
    setReads(new Set(articles.map(a => a.id)))
    startTransition(async () => {
      const res = await markAllActualitesRead(unreadList)
      if (res.error) {
        // rollback partiel impossible, on revalide en server
      }
    })
  }

  function handleToggleFavorite(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return
    const wasFav = favorites.has(id)
    setFavorites(prev => {
      const n = new Set(prev)
      if (wasFav) n.delete(id); else n.add(id)
      return n
    })
    startTransition(async () => {
      const res = await toggleActualiteFavorite(id)
      if (res.error) {
        setFavorites(prev => {
          const n = new Set(prev)
          if (wasFav) n.add(id); else n.delete(id)
          return n
        })
      }
    })
  }

  function handleShare(article: Actualite, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const text = `${article.title}\n${article.summary}\n${article.source_url ?? ''}`
    if (navigator.share) {
      navigator.share({ title: article.title, text: article.summary, url: article.source_url ?? undefined }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareToast(article.id)
        setTimeout(() => setShareToast(null), 2000)
      }).catch(() => {})
    }
  }

  function renderCard(article: Actualite, opts: { compact?: boolean } = {}) {
    const cat = getCat(article.category)
    const domain = getDomain(article.source_url)
    const isRead = reads.has(article.id)
    const isFav = favorites.has(article.id)
    const dl = article.deadline_date ? deadlineLabel(article.deadline_date) : null
    const rt = readTime(article.summary, article.read_time_minutes)

    return (
      <div
        key={article.id}
        style={{
          ...s.card,
          ...(isAuthenticated && !isRead ? s.cardUnread : {}),
        }}
        className="glass-card actu-card"
      >
        {/* Top: catégorie + date + non-lu */}
        <div style={s.cardMeta}>
          <span style={{ ...s.catBadge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>
            {cat.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthenticated && !isRead && <span style={s.unreadDot} title="Non lu" />}
            <span style={s.dateLabel}>{formatDate(article.published_at ?? article.created_at)}</span>
          </div>
        </div>

        {/* Deadline si applicable */}
        {dl && (
          <div style={{
            ...s.deadlineBadge,
            color: dl.color,
            background: `${dl.color}14`,
            borderColor: `${dl.color}32`,
          }}>
            <Hourglass size={12} weight="fill" />
            <span>Échéance · <strong>{dl.label}</strong></span>
          </div>
        )}

        {/* Pinned badge */}
        {article.is_pinned && (
          <div style={s.pinnedBadge}>
            <Sparkle size={11} weight="fill" /> À la une
          </div>
        )}

        {/* Titre */}
        <h3 style={s.cardTitle}>{article.title}</h3>

        {/* Résumé */}
        {!opts.compact && <p style={s.cardSummary}>{article.summary}</p>}

        {/* Footer : durée + actions */}
        <div style={s.cardFooter}>
          <span style={s.readTime}>
            <Clock size={11} /> {rt} min
          </span>

          <div style={s.cardActions}>
            {isAuthenticated && (
              <>
                <button
                  onClick={(e) => handleToggleFavorite(article.id, e)}
                  style={{ ...s.actionBtn, ...(isFav ? s.actionBtnFav : {}) }}
                  title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <BookmarkSimple size={13} weight={isFav ? 'fill' : 'regular'} />
                </button>

                {!isRead && (
                  <button
                    onClick={() => handleMarkRead(article.id)}
                    style={s.actionBtn}
                    title="Marquer comme lu"
                  >
                    <Check size={13} weight="bold" />
                  </button>
                )}
              </>
            )}

            <button
              onClick={(e) => handleShare(article, e)}
              style={s.actionBtn}
              title="Partager"
            >
              <ShareNetwork size={13} />
            </button>

            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleMarkRead(article.id)}
                style={s.sourceLink}
                className="actu-source-link"
              >
                {domain ?? 'Lire la source'}
                <ArrowUpRight size={12} style={{ flexShrink: 0 }} />
              </a>
            )}
          </div>
        </div>

        {shareToast === article.id && (
          <div style={s.shareToast}>
            <CheckCircle size={13} weight="fill" /> Lien copié !
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={s.page} className="actualites-no-fade">

      {/* Intro + compteur unread */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          Actualités <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
        </h2>
        <p style={s.pageDesc}>
          Réglementation, fiscalité, marché, gîtes, chambres d&apos;hôtes, conciergeries et réservation directe, triées et résumées pour toi.
        </p>
        {isAuthenticated && articles.length > 0 && (
          <div style={s.headerStats}>
            <span style={s.statChip}>
              <Newspaper size={12} /> <strong>{articles.length}</strong> articles
            </span>
            {unreadCount > 0 ? (
              <span style={{ ...s.statChip, color: 'var(--danger)', background: 'rgba(220,38,38,0.10)', borderColor: 'rgba(220,38,38,0.28)' }}>
                <span style={s.unreadDot} />
                <strong>{unreadCount}</strong> non lu{unreadCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span style={{ ...s.statChip, color: '#15803d', background: 'rgba(21,128,61,0.10)', borderColor: 'rgba(21,128,61,0.28)' }}>
                <CheckCircle size={12} weight="fill" /> À jour
              </span>
            )}
            <Link href="/dashboard/actualites/favoris" style={s.statChipLink}>
              <BookmarkSimple size={12} weight="fill" /> Favoris
              {favorites.size > 0 && <strong style={{ marginLeft: '4px' }}>{favorites.size}</strong>}
            </Link>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={s.markAllBtn}>
                <Check size={12} weight="bold" /> Tout marquer lu
              </button>
            )}
          </div>
        )}
      </div>

      {articles.length === 0 ? (
        /* Empty state */
        <div style={s.emptyWrap} className="fade-up glass-card">
          <div style={s.emptyIcon}>
            <Newspaper size={32} color="var(--text-3)" />
          </div>
          <div style={s.emptyLabel}>
            <Clock size={13} color="var(--text-muted)" />
            Bientôt disponible
          </div>
          <p style={s.emptyDesc}>
            Le fil d&apos;actualités arrive prochainement. Réglementation, fiscalité, marché,
            gîtes, chambres d&apos;hôtes, conciergeries, réservation directe, tout le secteur LCD
            centralisé et trié par profil.
          </p>
        </div>
      ) : (
        <>
          {/* À LA UNE, articles épinglés */}
          {pinned.length > 0 && (
            <section style={s.heroSection} className="fade-up">
              <div style={s.sectionHead}>
                <Sparkle size={14} weight="fill" color="var(--accent-text)" />
                <span style={s.sectionLabel}>À la une</span>
              </div>
              <div className="guide-priority-grid">
                {pinned.map(a => renderCard(a))}
              </div>
            </section>
          )}

          {/* ÉCHÉANCES À VENIR */}
          {upcomingDeadlines.length > 0 && (
            <section style={s.deadlineSection} className="fade-up">
              <div style={s.sectionHead}>
                <Hourglass size={14} weight="fill" color="#dc2626" />
                <span style={s.sectionLabel}>Échéances à venir</span>
              </div>
              <div style={s.deadlineGrid}>
                {upcomingDeadlines.map(a => {
                  const dl = deadlineLabel(a.deadline_date!)
                  if (!dl) return null
                  const cat = getCat(a.category)
                  return (
                    <div key={a.id} style={{ ...s.deadlineCard, borderColor: `${dl.color}40` }}>
                      <div style={{ ...s.deadlinePill, color: dl.color, background: `${dl.color}14`, borderColor: `${dl.color}32` }}>
                        <Hourglass size={11} weight="fill" /> {dl.label}
                      </div>
                      <div style={s.deadlineTitle}>{a.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                        <span style={{ ...s.catBadge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>
                          {cat.label}
                        </span>
                        {a.source_url && (
                          <a href={a.source_url} target="_blank" rel="noopener noreferrer" onClick={() => handleMarkRead(a.id)} style={{ ...s.sourceLink, marginLeft: 'auto' }} className="actu-source-link">
                            Lire <ArrowUpRight size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* POUR TOI, articles correspondant aux régions de l'utilisateur */}
          {recommendedForUser.length > 0 && (
            <section style={s.recoSection} className="fade-up">
              <div style={s.sectionHead}>
                <Star size={14} weight="fill" color="var(--accent-text)" />
                <span style={s.sectionLabel}>Pour toi</span>
                <span style={s.regionsTag}>{detectedRegions.slice(0, 3).join(' · ')}</span>
              </div>
              <p style={s.recoDesc}>Articles qui concernent les régions de tes logements.</p>
              <div className="guide-priority-grid">
                {recommendedForUser.map(a => renderCard(a))}
              </div>
            </section>
          )}

          {/* Search bar — utile à partir de ~50 articles */}
          {articles.length > 20 && (
            <div style={s.searchWrap} className="fade-up">
              <MagnifyingGlass size={14} color="var(--text-muted)" style={s.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un article (titre, résumé)…"
                style={s.searchInput}
                aria-label="Rechercher dans les actualités"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={s.searchClear}
                  aria-label="Effacer la recherche"
                >
                  <X size={11} weight="bold" />
                </button>
              )}
            </div>
          )}

          {/* Filters */}
          {visibleCats.length > 2 && (
            <div style={s.filters} className="fade-up d1">
              <div style={s.filterHeader}>
                <Funnel size={13} color="var(--text-muted)" />
                <span style={s.filterLabel}>Filtrer</span>
                {isAuthenticated && unreadCount > 0 && (
                  <button
                    onClick={() => setShowUnreadOnly(v => !v)}
                    style={{ ...s.unreadToggle, ...(showUnreadOnly ? s.unreadToggleOn : {}) }}
                  >
                    <span style={{ ...s.unreadDot, opacity: showUnreadOnly ? 1 : 0.5 }} />
                    Non lus seulement
                  </button>
                )}
              </div>
              <div style={s.filterScroll} className="actu-filter-scroll">
                {visibleCats.map(cat => {
                  const count = cat.value === 'all'
                    ? articles.filter(a => !pinnedIds.has(a.id)).length
                    : articles.filter(a => a.category === cat.value && !pinnedIds.has(a.id)).length
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setActiveFilter(cat.value)}
                      style={{
                        ...s.filterBtn,
                        ...(activeFilter === cat.value
                          ? { color: cat.color, background: cat.bg, borderColor: `${cat.color}30`, fontWeight: 600 }
                          : {}),
                      }}
                    >
                      {cat.label}
                      {cat.value !== 'all' && count > 0 && (
                        <span style={s.filterCount}>{count}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Grid groupée par période — donne du rythme visuel et évite
              que les articles s'empilent à l'identique. Le bouton "Voir
              plus" charge la batch suivante (toutes périodes confondues). */}
          {groupedVisible.map((bucket, bi) => (
            <section key={bucket.key} className={bi === 0 ? 'fade-up d2' : 'fade-up'}>
              {groupedVisible.length > 1 && (
                <h3 style={s.bucketTitle}>{bucket.label} <span style={s.bucketCount}>· {bucket.items.length}</span></h3>
              )}
              <div className="guide-priority-grid">
                {bucket.items.map(article => renderCard(article))}
              </div>
            </section>
          ))}

          {hasMore && (
            <div style={s.loadMoreWrap} className="fade-up">
              <button
                type="button"
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                style={s.loadMoreBtn}
              >
                Voir plus d'articles
                <span style={s.loadMoreCount}>
                  +{Math.min(PAGE_SIZE, filtered.length - visibleCount)}
                </span>
              </button>
              <p style={s.loadMoreInfo}>
                {visibleCount} sur {filtered.length} affichés
              </p>
            </div>
          )}

          {filtered.length === 0 && (
            <div style={s.noResults} className="glass-card fade-up">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}". Essaye d'autres mots-clés.`
                : showUnreadOnly
                  ? 'Tous les articles de cette catégorie sont déjà lus. ✓'
                  : 'Aucun article dans cette catégorie pour le moment.'}
            </div>
          )}

          {/* Découverte gate */}
          {isDecouverte && totalCount > articles.length && (
            <div style={s.gate} className="fade-up">
              <div style={s.gateInner}>
                <p style={s.gateCount}>
                  + {totalCount - articles.length} article{totalCount - articles.length > 1 ? 's' : ''} disponibles en Standard
                </p>
                <p style={s.gateDesc}>Accède à toutes les actualités LCD en passant en Standard Membre Fondateur.</p>
                <a href="/dashboard/abonnement" style={s.gateCta}>
                  Passer en Standard, 1,98 €/mois
                </a>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .actu-source-link {
          color: var(--text-3) !important;
          text-decoration: none;
          transition: color var(--d-base) var(--ease-smooth);
        }
        .actu-source-link:hover {
          color: var(--text-2) !important;
        }
        /* Card actualité : hover lift */
        .actu-card:hover {
          border-color: var(--border-2) !important;
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .actu-filter-scroll::-webkit-scrollbar { display: none; }
        .actu-filter-scroll {
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
          position: relative;
        }
        .actu-filter-scroll button {
          scroll-snap-align: start;
        }
        @media (max-width: 640px) {
          .actu-filter-scroll {
            flex-wrap: wrap !important;
            overflow-x: visible !important;
            gap: 6px !important;
          }
          .actu-filter-scroll button {
            flex-shrink: 1 !important;
            font-size: 12px !important;
            padding: 6px 11px !important;
          }
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  // ── Recherche
  searchWrap: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    maxWidth: '560px',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 12,
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    padding: '10px 36px 10px 34px',
    // ≥16px : évite zoom iOS Safari
    fontSize: '16px',
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    fontFamily: 'inherit',
    outline: 'none',
  },
  searchClear: {
    position: 'absolute' as const,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 6,
    background: 'var(--border)',
    border: 'none',
    color: 'var(--text-2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },

  // ── Bucket / grouping
  bucketTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '15px',
    fontWeight: 400,
    color: 'var(--text-2)',
    margin: '24px 0 12px',
    paddingBottom: '6px',
    borderBottom: '1px dashed var(--border)',
  },
  bucketCount: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontFamily: 'inherit',
  },

  // ── Voir plus
  loadMoreWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px dashed var(--border)',
  },
  loadMoreBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent-text)',
    fontSize: '13px',
    fontWeight: 600,
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  loadMoreCount: {
    fontSize: '11px',
    fontWeight: 700,
    background: 'var(--accent-text)',
    color: 'var(--bg)',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  loadMoreInfo: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
    margin: 0,
  },

  intro: { marginBottom: '28px', maxWidth: '720px' },
  pageTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7 },

  // Stats header
  headerStats: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const, marginTop: '14px' },
  statChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 11px', borderRadius: '100px',
    fontSize: '12px', fontWeight: 500,
    background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)',
  },
  statChipLink: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 11px', borderRadius: '100px',
    fontSize: '12px', fontWeight: 500,
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)', textDecoration: 'none' as const,
  },
  markAllBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 11px', borderRadius: '100px',
    fontSize: '12px', fontWeight: 600,
    background: 'transparent', color: 'var(--text-2)',
    border: '1px dashed var(--border-2)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  unreadDot: {
    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--danger)', flexShrink: 0,
  },

  // Sections
  heroSection: { marginBottom: '32px' },
  recoSection: {
    marginBottom: '32px',
    padding: '20px 22px',
    borderRadius: '16px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
  },
  recoDesc: { fontSize: '12.5px', color: 'var(--text-2)', margin: '4px 0 14px' },
  regionsTag: {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-2)',
    padding: '2px 8px', borderRadius: '100px',
    background: 'var(--accent-bg-2)', border: '1px solid var(--accent-border-2)',
    marginLeft: '4px',
  },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px', flexWrap: 'wrap' as const },
  sectionLabel: {
    fontSize: '12px', fontWeight: 700, color: 'var(--text)',
    letterSpacing: '0.6px', textTransform: 'uppercase' as const,
  },

  // Deadlines
  deadlineSection: {
    marginBottom: '32px',
    padding: '20px 22px',
    borderRadius: '16px',
    background: 'rgba(220,38,38,0.04)',
    border: '1px solid rgba(220,38,38,0.16)',
  },
  deadlineGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px',
  },
  deadlineCard: {
    display: 'flex', flexDirection: 'column' as const, gap: '8px',
    padding: '14px 16px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid',
    minHeight: '120px',
  },
  deadlinePill: {
    display: 'inline-flex', alignSelf: 'flex-start' as const, alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.4px',
    padding: '3px 9px', borderRadius: '100px',
    border: '1px solid', textTransform: 'uppercase' as const,
  },
  deadlineTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 },

  // Empty state
  emptyWrap: { padding: '48px 32px', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' as const, maxWidth: '520px' },
  emptyIcon: { width: '64px', height: '64px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.8px' },
  emptyDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: '400px' },

  // Filters
  filters: { marginBottom: '24px', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  filterHeader: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  filterLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' as const },
  unreadToggle: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 11px', borderRadius: '100px',
    fontSize: '11.5px', fontWeight: 500,
    background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border-2)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif', marginLeft: 'auto',
  },
  unreadToggleOn: {
    background: 'rgba(220,38,38,0.08)', color: 'var(--danger)',
    borderColor: 'rgba(220,38,38,0.28)',
  },
  filterScroll: {
    display: 'flex', gap: '6px',
    overflowX: 'auto' as const,
    paddingBottom: '4px',
    scrollbarWidth: 'none' as const,
  } as React.CSSProperties,
  filterBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid var(--border-2)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' as const, flexShrink: 0 },
  filterCount: { fontSize: '10px', fontWeight: 700, background: 'var(--border)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '100px', lineHeight: '1.4' },

  // Cards
  card: {
    padding: 'var(--s-6)',
    borderRadius: 'var(--r-xl)',
    display: 'flex', flexDirection: 'column' as const, gap: 'var(--s-3)',
    position: 'relative' as const,
    transition: 'border-color var(--d-base) var(--ease-smooth), box-shadow var(--d-base) var(--ease-smooth), transform var(--d-base) var(--ease-smooth)',
  },
  cardUnread: {
    background: 'var(--surface)',
    boxShadow: 'inset 3px 0 0 var(--danger)',
  },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s-2)', flexWrap: 'wrap' as const },
  catBadge: {
    fontSize: 'var(--t-xs)', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const,
    padding: '3px 9px', borderRadius: 'var(--r-pill)',
    border: '1px solid', whiteSpace: 'nowrap' as const,
  },
  dateLabel: { fontSize: 'var(--t-xs)', color: 'var(--text-muted)', fontWeight: 500 },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'var(--t-lg)',
    fontWeight: 400, color: 'var(--text)',
    lineHeight: 'var(--lh-snug)', margin: 0,
    letterSpacing: 'var(--ls-snug)',
  },
  cardSummary: {
    fontSize: 'var(--t-sm)', fontWeight: 400,
    color: 'var(--text-2)', lineHeight: 'var(--lh-relax)', margin: 0,
  },
  cardFooter: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' as const,
    paddingTop: 'var(--s-2)', borderTop: '1px solid var(--border)', marginTop: 'var(--s-1)',
  },
  cardActions: { display: 'flex', alignItems: 'center', gap: 'var(--s-1)', marginLeft: 'auto', flexWrap: 'wrap' as const },
  readTime: { display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)', fontSize: 'var(--t-xs)', color: 'var(--text-muted)' },

  // Pinned
  pinnedBadge: {
    display: 'inline-flex', alignSelf: 'flex-start' as const, alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const,
    padding: '3px 9px', borderRadius: '100px',
    color: 'var(--accent-text)', background: 'var(--accent-bg-2)',
    border: '1px solid var(--accent-border-2)',
  },

  // Deadline badge inline
  deadlineBadge: {
    display: 'inline-flex', alignSelf: 'flex-start' as const, alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600,
    padding: '3px 10px', borderRadius: '100px',
    border: '1px solid',
  },

  // Action buttons
  actionBtn: {
    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.15s',
    fontFamily: 'var(--font-outfit), sans-serif',
  },
  actionBtnFav: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
  },

  sourceLink: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 500,
    padding: '5px 10px', borderRadius: '8px',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
  },

  shareToast: {
    position: 'absolute' as const, top: '12px', right: '12px',
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 11px', borderRadius: '8px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    fontSize: '11.5px', fontWeight: 600,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },

  noResults: { padding: '32px', textAlign: 'center' as const, fontSize: '14px', color: 'var(--text-muted)', borderRadius: '16px' },
  gate: { marginTop: '24px' },
  gateInner: {
    padding: '28px 32px', borderRadius: '16px',
    background: 'var(--surface)', border: '1px solid rgba(255,213,107,0.15)',
    textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px',
  },
  gateCount: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: 0 },
  gateDesc: { fontSize: '13px', color: 'var(--text-2)', margin: 0 },
  gateCta: {
    display: 'inline-block', marginTop: '4px', padding: '10px 20px',
    background: 'var(--accent)', color: '#002820',
    borderRadius: '10px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' as const,
  },
}
