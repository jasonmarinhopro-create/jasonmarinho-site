'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { GraduationCap, Clock, BookOpen, ArrowRight, CheckCircle, Lock, Wrench, MagnifyingGlass, Funnel, BookmarkSimple, Trophy, Compass, Heart } from '@phosphor-icons/react'
import { toggleFormationFavorite } from './actions'

interface Formation {
  id: string
  slug: string
  title: string
  description: string
  duration: string
  modules_count: number
  lessons_count: number
  level: string
  is_published: boolean
}

interface ComingSoon {
  id: string
  title: string
  description: string
  duration: string
  modules: number
  lessons: number
  level: string
}

interface Props {
  formations: Formation[]
  progressMap: Record<string, number>
  comingSoon: ComingSoon[]
  unlockedSlugs: string[] | null // null = tout accessible (Standard+)
  plan: string
  initialFavoriteIds?: string[]
}

const levelLabel: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

// Mapping slug → category key
const SLUG_CATEGORY: Record<string, string> = {
  'google-my-business-lcd': 'visibilite',
  'reseaux-sociaux-lcd': 'visibilite',
  'optimiser-annonce-airbnb': 'visibilite',
  'ecrire-avis-repondre-voyageurs': 'visibilite',
  'tarification-dynamique': 'revenus',
  'mettre-le-bon-prix-lcd': 'revenus',
  'lcd-basse-saison': 'revenus',
  'annonce-directe': 'revenus',
  'gerer-lcd-automatisation': 'gestion',
  'livret-accueil-digital': 'gestion',
  'securiser-reservations-eviter-mauvais-voyageurs': 'gestion',
  'decorer-amenager-logement-lcd': 'gestion',
  'fiscalite-reglementation-lcd-france-2026': 'reglementation',
  'fiscalite-statut-conciergerie-tourisme': 'reglementation',
  'creer-conciergerie-lcd': 'conciergerie',
  'maitriser-booking-com-algorithme-genius': 'visibilite',
  'photographie-lcd-smartphone': 'visibilite',
  'gerer-incidents-litiges-lcd': 'gestion',
}

const categoryLabel: Record<string, string> = {
  visibilite: 'Visibilité & Marketing',
  revenus: 'Revenus & Tarification',
  gestion: 'Gestion & Automatisation',
  reglementation: 'Réglementation',
  conciergerie: 'Conciergerie',
}

type LevelFilter = 'all' | 'debutant' | 'intermediaire' | 'avance'
type StatusFilter = 'all' | 'enrolled' | 'not_enrolled' | 'done'
type CategoryFilter = 'all' | 'visibilite' | 'revenus' | 'gestion' | 'reglementation' | 'conciergerie'

export default function FormationsGrid({ formations, progressMap, comingSoon, unlockedSlugs, plan, initialFavoriteIds = [] }: Props) {
  const isDecouverte = plan === 'decouverte'
  const slotsUsed = unlockedSlugs?.length ?? 0
  const slotsMax = 2
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [favorites, setFavorites] = useState<Set<string>>(new Set(initialFavoriteIds))
  const [, startTransition] = useTransition()

  function handleToggleFavorite(f: Formation) {
    const isFav = favorites.has(f.id)
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(f.id)
      else next.add(f.id)
      return next
    })
    startTransition(async () => {
      await toggleFormationFavorite({
        formationId: f.id,
        formationSlug: f.slug,
        formationTitle: f.title,
        add: !isFav,
      })
    })
  }

  const filtered = useMemo(() => {
    return formations.filter(f => {
      if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false
      if (levelFilter !== 'all' && f.level !== levelFilter) return false
      if (categoryFilter !== 'all' && SLUG_CATEGORY[f.slug] !== categoryFilter) return false

      const progress = progressMap[f.id] ?? null
      const enrolled = progress !== null
      const done = progress === 100

      if (statusFilter === 'enrolled' && (!enrolled || done)) return false
      if (statusFilter === 'not_enrolled' && enrolled) return false
      if (statusFilter === 'done' && !done) return false

      return true
    })
  }, [formations, progressMap, search, levelFilter, statusFilter, categoryFilter])

  const enrolledCount = formations.filter(f => progressMap[f.id] !== undefined).length
  const hasFilters = search !== '' || levelFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setLevelFilter('all')
    setStatusFilter('all')
    setCategoryFilter('all')
  }

  return (
    <div>
      {/* Hero — Parcours d'apprentissage mis en avant */}
      <Link href="/dashboard/formations/parcours" style={styles.parcoursHero} className="formations-parcours-hero">
        <div style={styles.parcoursHeroIcon}>
          <Compass size={28} weight="fill" />
        </div>
        <div style={styles.parcoursHeroBody}>
          <div style={styles.parcoursHeroLabel}>Parcours d&apos;apprentissage</div>
          <div style={styles.parcoursHeroTitle}>Suis un parcours structuré, étape par étape</div>
          <div style={styles.parcoursHeroDesc}>Une progression pensée pour passer de débutant à expert LCD — sans te demander quoi faire ensuite.</div>
        </div>
        <div style={styles.parcoursHeroCta}>
          Commencer <ArrowRight size={16} weight="bold" />
        </div>
      </Link>

      {/* Stats + Profil apprenant + Favoris (sous le parcours, secondaires) */}
      <div style={styles.statsRow}>
        <span style={styles.statChip}>
          <GraduationCap size={13} weight="fill" />
          {formations.length} formation{formations.length !== 1 ? 's' : ''}
        </span>
        {enrolledCount > 0 && (
          <span style={{ ...styles.statChip, background: 'rgba(99,214,131,0.08)', color: '#63D683', border: '1px solid rgba(99,214,131,0.15)' }}>
            <CheckCircle size={13} weight="fill" />
            {enrolledCount} commencée{enrolledCount !== 1 ? 's' : ''}
          </span>
        )}
        {favorites.size > 0 && (
          <span style={{ ...styles.statChip, background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.18)' }}>
            <Heart size={13} weight="fill" />
            {favorites.size} en favori{favorites.size !== 1 ? 's' : ''}
          </span>
        )}
        {isDecouverte && (
          <span style={{ ...styles.statChip, background: 'rgba(255,213,107,0.08)', color: 'var(--accent-text)', border: '1px solid rgba(255,213,107,0.2)' }}>
            <Lock size={13} weight="fill" />
            {slotsUsed}/{slotsMax} accès gratuits utilisés
          </span>
        )}
      </div>

      {/* Navigation secondaire : profil apprenant + favoris */}
      <div style={styles.navRow}>
        <Link href="/dashboard/formations/profil-apprenant" style={{ ...styles.navLink, color: 'var(--accent-text)', borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' }}>
          <Trophy size={16} weight="fill" style={{ flexShrink: 0 }} />
          <span style={styles.navLinkText}>Mon profil apprenant</span>
          <ArrowRight size={14} weight="bold" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.7 }} />
        </Link>
        <Link href="/dashboard/formations/favoris" style={{ ...styles.navLink, color: '#f43f5e', borderColor: 'rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.06)' }}>
          <Heart size={16} weight="fill" style={{ flexShrink: 0 }} />
          <span style={styles.navLinkText}>Mes favoris</span>
          <ArrowRight size={14} weight="bold" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.7 }} />
        </Link>
      </div>

      {/* Filters */}
      <div style={styles.filtersWrap}>
        {/* Search */}
        <div style={styles.searchWrap} className="filter-search-wrap">
          <MagnifyingGlass size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher une formation…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={styles.clearBtn}>×</button>
          )}
        </div>

        {/* Category filter — scrollable row on mobile */}
        <div style={styles.filterScrollRow} className="filter-scroll-row">
          <span style={styles.filterLabel}><Funnel size={12} /> Thème</span>
          {(['all', 'visibilite', 'revenus', 'gestion', 'reglementation', 'conciergerie'] as CategoryFilter[]).map(v => (
            <button
              key={v}
              onClick={() => setCategoryFilter(v)}
              style={{
                ...styles.filterBtn,
                ...(categoryFilter === v ? styles.filterBtnActive : {}),
              }}
            >
              {v === 'all' ? 'Tous' : categoryLabel[v]}
            </button>
          ))}
        </div>

        {/* Level filter row */}
        <div style={styles.filterScrollRow} className="filter-scroll-row">
          <span style={styles.filterLabel}><Funnel size={12} /> Niveau</span>
          {(['all', 'debutant', 'intermediaire', 'avance'] as LevelFilter[]).map(v => (
            <button
              key={v}
              onClick={() => setLevelFilter(v)}
              style={{
                ...styles.filterBtn,
                ...(levelFilter === v ? styles.filterBtnActive : {}),
              }}
            >
              {v === 'all' ? 'Tous' : levelLabel[v]}
            </button>
          ))}
        </div>

        {/* Status filter row */}
        <div style={styles.filterScrollRow} className="filter-scroll-row">
          <span style={styles.filterLabel}><Funnel size={12} /> Statut</span>
          {([
            { v: 'all', label: 'Toutes' },
            { v: 'enrolled', label: 'En cours' },
            { v: 'done', label: 'Terminées' },
            { v: 'not_enrolled', label: 'Non commencées' },
          ] as { v: StatusFilter; label: string }[]).map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              style={{
                ...styles.filterBtn,
                ...(statusFilter === v ? styles.filterBtnActive : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count when filtered */}
      {hasFilters && (
        <div style={styles.resultsCount}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          <button onClick={resetFilters} style={styles.resetBtn}>
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="dash-grid-3">
        {filtered.map((f, i) => {
          const progress = progressMap[f.id] ?? null
          const enrolled = progress !== null
          const done = progress === 100
          const isLocked = unlockedSlugs !== null && slotsUsed >= slotsMax && !unlockedSlugs.includes(f.slug)

          const isFav = favorites.has(f.id)
          return (
            <div key={f.id} style={{ ...styles.card, ...(isLocked ? styles.cardLocked : {}) }} className={`glass-card fade-up d${(i % 6) + 1}`}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIcon, ...(isLocked ? { opacity: 0.5 } : {}) }}>
                  {isLocked
                    ? <Lock size={24} color="var(--text-muted)" weight="duotone" />
                    : <GraduationCap size={28} color="var(--accent-text)" weight="fill" />
                  }
                </div>
                <div style={styles.cardBadges}>
                  {SLUG_CATEGORY[f.slug] && (
                    <span style={styles.categoryBadge}>{categoryLabel[SLUG_CATEGORY[f.slug]]}</span>
                  )}
                  {isLocked
                    ? <span style={styles.lockedBadge}>Standard</span>
                    : <>
                        <span className="badge badge-yellow">{levelLabel[f.level] ?? f.level}</span>
                        <span className="badge badge-green">Disponible</span>
                        {done && <span className="badge badge-green">Terminé ✓</span>}
                      </>
                  }
                </div>
              </div>

              <h3 style={{ ...styles.cardTitle, ...(isLocked ? { color: 'var(--text-3)' } : {}) }}>{f.title}</h3>
              <p style={{ ...styles.cardDesc, ...(isLocked ? { color: 'var(--text-muted)' } : {}) }}>{f.description}</p>

              <div style={styles.meta}>
                <span style={{ ...styles.metaItem, ...(isLocked ? { opacity: 0.4 } : {}) }}><Clock size={13} /> {f.duration}</span>
                <span style={{ ...styles.metaItem, ...(isLocked ? { opacity: 0.4 } : {}) }}><BookOpen size={13} /> {f.modules_count} modules</span>
                <span style={{ ...styles.metaItem, ...(isLocked ? { opacity: 0.4 } : {}) }}><CheckCircle size={13} /> {f.lessons_count} leçons</span>
              </div>

              {enrolled && !isLocked && (
                <div style={styles.progressArea}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={styles.progressLabel}>Progression</span>
                    <span style={styles.progressPct}>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <div style={styles.cardFooter}>
                {isLocked
                  ? <Link href="/dashboard/abonnement" style={styles.lockedBtn}>
                      <Lock size={13} /> Passer en Standard
                    </Link>
                  : <div style={styles.cardFooterRow}>
                      <Link href={`/dashboard/formations/${f.slug}`} className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
                        {done ? 'Revoir' : enrolled ? 'Continuer' : 'Commencer'} <ArrowRight size={14} weight="bold" />
                      </Link>
                      <button
                        onClick={() => handleToggleFavorite(f)}
                        style={{
                          ...styles.heartBtn,
                          ...(isFav ? styles.heartBtnActive : {}),
                        }}
                        aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Heart size={18} weight={isFav ? 'fill' : 'regular'} />
                      </button>
                    </div>
                }
              </div>
            </div>
          )
        })}

        {/* Coming soon — only shown when no filters active */}
        {!hasFilters && comingSoon.map((f, i) => (
          <div key={f.id} style={styles.comingSoonCard} className={`glass-card fade-up d${(i % 6) + 1}`}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.cardIcon, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Wrench size={24} color="var(--text-muted)" weight="fill" />
              </div>
              <div style={styles.cardBadges}>
                <span style={styles.wip}>En construction</span>
              </div>
            </div>

            <h3 style={{ ...styles.cardTitle, color: 'var(--text-3)' }}>{f.title}</h3>
            <p style={{ ...styles.cardDesc, color: 'var(--text-muted)' }}>{f.description}</p>

            <div style={styles.meta}>
              <span style={{ ...styles.metaItem, opacity: 0.4 }}><Clock size={13} /> {f.duration}</span>
              <span style={{ ...styles.metaItem, opacity: 0.4 }}><BookOpen size={13} /> {f.modules} modules</span>
              <span style={{ ...styles.metaItem, opacity: 0.4 }}><CheckCircle size={13} /> {f.lessons} leçons</span>
            </div>

            <div style={styles.cardFooter}>
              <div style={styles.lockedBtn}>
                <Lock size={13} />
                Bientôt disponible
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={styles.emptyState}>
          <GraduationCap size={32} color="var(--text-muted)" weight="thin" />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '12px' }}>
            Aucune formation ne correspond à ta recherche.
          </p>
          <button onClick={resetFilters} style={styles.resetBtn}>
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  // Hero parcours d'apprentissage — mis en avant en haut
  parcoursHero: {
    display: 'flex', alignItems: 'center', gap: '20px',
    padding: 'clamp(16px, 2.5vw, 22px) clamp(18px, 3vw, 28px)',
    background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.04))',
    border: '1px solid rgba(96,165,250,0.28)',
    borderRadius: '16px',
    textDecoration: 'none',
    color: 'var(--text)',
    marginBottom: '20px',
    transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
    position: 'relative',
    overflow: 'hidden',
  } as React.CSSProperties,
  parcoursHeroIcon: {
    width: '56px', height: '56px', borderRadius: '14px',
    background: 'rgba(96,165,250,0.18)',
    color: '#60a5fa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  parcoursHeroBody: { flex: 1, minWidth: 0 },
  parcoursHeroLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px',
    textTransform: 'uppercase' as const, color: '#60a5fa',
    marginBottom: '4px',
  },
  parcoursHeroTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(17px, 2.2vw, 22px)', fontWeight: 500,
    color: 'var(--text)', lineHeight: 1.25, marginBottom: '4px',
  },
  parcoursHeroDesc: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5,
  },
  parcoursHeroCta: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '10px',
    background: '#60a5fa', color: '#fff',
    fontSize: '13px', fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  statsRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  // Bouton cœur favoris — dans le footer à côté du bouton CTA
  heartBtn: {
    width: '40px', height: '40px',
    borderRadius: '10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
    padding: 0,
    flexShrink: 0,
  } as React.CSSProperties,
  heartBtnActive: {
    background: 'rgba(244,63,94,0.12)',
    border: '1px solid rgba(244,63,94,0.4)',
    color: '#f43f5e',
  },
  cardFooterRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    justifyContent: 'space-between',
  },
  statChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '100px',
    background: 'rgba(255,213,107,0.08)', color: 'var(--accent-text)',
    border: '1px solid rgba(255,213,107,0.15)', fontSize: '12px', fontWeight: 500,
  },
  navRow: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px',
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: '10px',
    flex: '1 1 160px',
    padding: '11px 14px',
    borderRadius: '12px',
    border: '1px solid',
    textDecoration: 'none',
    fontSize: '13px', fontWeight: 500,
    cursor: 'pointer',
    minWidth: 'min(160px, 100%)',
  } as React.CSSProperties,
  navLinkText: {
    flex: 1, lineHeight: 1.3,
  },
  filtersWrap: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    marginBottom: '20px',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '9px 14px',
    width: '100%', maxWidth: 'min(360px, 100%)',
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '13px', flex: 1, minWidth: 0,
  },
  clearBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1,
    padding: '0 2px', flexShrink: 0,
  },
  // Horizontally scrollable filter row — works on all screen sizes
  // Note: overflow and scroll behavior handled by .filter-scroll-row CSS class
  filterScrollRow: {
    display: 'flex', alignItems: 'center', gap: '4px',
    overflowX: 'auto', overflowY: 'hidden', paddingBottom: '4px',
    width: '100%', minWidth: 0,
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  } as React.CSSProperties,
  filterLabel: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
    marginRight: '2px', whiteSpace: 'nowrap', flexShrink: 0,
  },
  filterBtn: {
    padding: '6px 12px', borderRadius: '8px',
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    color: 'var(--text-3)', fontSize: '12px', fontWeight: 400,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  },
  filterBtnActive: {
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.25)',
    color: 'var(--accent-text)', fontWeight: 500,
  },
  resultsCount: {
    display: 'flex', alignItems: 'center', gap: '12px',
    fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px',
    flexWrap: 'wrap',
  },
  resetBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--accent-text)', fontSize: '12px', textDecoration: 'underline',
    padding: 0,
  },
  card: { padding: 'clamp(18px,3vw,28px)', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0' },
  cardLocked: { opacity: 0.65, filter: 'grayscale(0.2)' },
  lockedBadge: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.6px',
    padding: '3px 10px', borderRadius: '100px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
  },
  comingSoonCard: {
    padding: 'clamp(18px,3vw,28px)', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0',
    background: 'var(--surface)', border: '1px solid var(--border)', opacity: 0.7,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  cardIcon: {
    width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardBadges: { display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'flex-start', justifyContent: 'flex-end' },
  categoryBadge: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px',
    padding: '3px 8px', borderRadius: '100px',
    background: 'rgba(85,107,47,0.15)', color: 'var(--text-3)',
    border: '1px solid rgba(85,107,47,0.2)',
    whiteSpace: 'nowrap',
  },
  wip: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: '100px',
    background: 'var(--border)', color: 'var(--text-muted)', border: '1px solid var(--border)',
  },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(16px,2vw,18px)', fontWeight: 400, color: 'var(--text)', lineHeight: 1.3, marginBottom: '10px' },
  cardDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '16px', flex: 1 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-3)' },
  progressArea: { marginBottom: '16px' },
  progressLabel: { fontSize: '12px', color: 'var(--text-3)' },
  progressPct: { fontSize: '12px', color: 'var(--accent-text)' },
  cardFooter: { paddingTop: '14px', borderTop: '1px solid var(--border)', marginTop: 'auto' },
  lockedBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)',
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '8px', padding: '10px 16px', minHeight: '44px',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '48px 24px', textAlign: 'center',
  },
}
