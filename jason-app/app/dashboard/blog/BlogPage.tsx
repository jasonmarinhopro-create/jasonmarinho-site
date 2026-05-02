'use client'

import { useState, useMemo } from 'react'
import { ArrowSquareOut, MagnifyingGlass, X, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { type BlogArticle, type BlogCategory, BLOG_CATEGORIES } from '@/lib/blog/articles'

const BLOG_BASE = 'https://jasonmarinho.com/blog'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  articles: BlogArticle[]
}

export default function BlogPage({ articles }: Props) {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return articles.filter(a => {
      if (activeCategory !== 'all' && a.categorySlug !== activeCategory) return false
      if (q && !a.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [articles, activeCategory, search])

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<BlogCategory | 'all', number>> = { all: articles.length }
    for (const a of articles) {
      counts[a.categorySlug] = (counts[a.categorySlug] ?? 0) + 1
    }
    return counts
  }, [articles])

  return (
    <div style={{ padding: 'clamp(24px,3vw,40px)', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={s.badge}>
          <span style={s.badgeDot} />
          {articles.length} articles
        </div>
        <h1 style={s.title}>
          Blog <em style={{ fontStyle: 'italic', color: 'var(--accent-text)' }}>LCD</em>
        </h1>
        <p style={s.subtitle}>
          Conseils pratiques, stratégies et ressources pour développer ton activité de location courte durée.
        </p>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <MagnifyingGlass size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Rechercher un article…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
        />
        {search && (
          <button onClick={() => setSearch('')} style={s.searchClear}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div style={s.filters}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{ ...s.filterChip, ...(activeCategory === 'all' ? s.filterChipActive : {}) }}
        >
          Tous
          <span style={activeCategory === 'all' ? s.countActive : s.count}>
            {categoryCounts.all}
          </span>
        </button>
        {(Object.entries(BLOG_CATEGORIES) as [BlogCategory, typeof BLOG_CATEGORIES[BlogCategory]][]).map(([slug, cat]) => {
          const active = activeCategory === slug
          return (
            <button
              key={slug}
              onClick={() => setActiveCategory(slug)}
              style={{
                ...s.filterChip,
                ...(active ? { ...s.filterChipActive, background: cat.bg, borderColor: cat.color, color: cat.color } : {}),
              }}
            >
              {cat.label}
              {categoryCounts[slug] != null && (
                <span style={active ? { ...s.countActive, background: cat.color } : s.count}>
                  {categoryCounts[slug]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Results count */}
      {(search || activeCategory !== 'all') && (
        <p style={s.resultCount}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'all' && ` en ${BLOG_CATEGORIES[activeCategory].label}`}
          {search && ` pour "${search}"`}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <MagnifyingGlass size={32} style={{ color: 'var(--text-3)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>Aucun article trouvé.</p>
          <button onClick={() => { setSearch(''); setActiveCategory('all') }} style={s.resetBtn}>
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(article => {
            const cat = BLOG_CATEGORIES[article.categorySlug]
            return (
              <a
                key={article.slug}
                href={`${BLOG_BASE}/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={s.card}
                className="blog-card"
              >
                <div style={s.cardTop}>
                  <span style={{ ...s.catBadge, color: cat.color, background: cat.bg }}>
                    {cat.label}
                  </span>
                  <ArrowSquareOut size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </div>

                <h2 style={s.cardTitle}>{article.title}</h2>

                <div style={s.cardMeta}>
                  <span style={s.metaItem}>{formatDate(article.date)}</span>
                  <span style={s.metaDot} />
                  <span style={s.metaItem}>{article.readTime} min</span>
                </div>

                <div style={s.cardFooter}>
                  <span style={s.readLink}>
                    Lire l'article <ArrowRight size={12} />
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      )}

      <style>{`
        .blog-card {
          transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
        }
        .blog-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.1);
          border-color: var(--surface-3) !important;
        }
        .blog-card:hover .read-link-inner {
          gap: 8px !important;
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    padding: '5px 12px', borderRadius: '100px',
    marginBottom: '12px',
  },
  badgeDot: {
    width: '5px', height: '5px',
    background: 'var(--accent-text)', borderRadius: '50%',
  },
  title: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: 'clamp(28px,3.5vw,40px)',
    fontWeight: 300, letterSpacing: '-1px',
    color: 'var(--text)',
    marginBottom: '8px', lineHeight: 1.1,
  },
  subtitle: {
    fontSize: '15px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.65,
    maxWidth: '520px',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 14px',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: '14px', color: 'var(--text)',
    fontFamily: 'inherit',
  },
  searchClear: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: '2px',
  },
  filters: {
    display: 'flex', flexWrap: 'wrap', gap: '8px',
    marginBottom: '20px',
  },
  filterChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 13px', borderRadius: '100px',
    fontSize: '13px', fontWeight: 400,
    color: 'var(--text-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  filterChipActive: {
    background: 'var(--accent-bg)',
    borderColor: 'var(--accent-border)',
    color: 'var(--accent-text)',
    fontWeight: 500,
  },
  count: {
    fontSize: '11px', fontWeight: 600,
    background: 'var(--surface-2)', color: 'var(--text-3)',
    borderRadius: '100px', padding: '1px 6px',
  },
  countActive: {
    fontSize: '11px', fontWeight: 600,
    background: 'var(--accent-text)', color: '#fff',
    borderRadius: '100px', padding: '1px 6px',
  },
  resultCount: {
    fontSize: '13px', color: 'var(--text-3)',
    marginBottom: '16px', fontWeight: 300,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  card: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px', padding: '20px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  cardTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  catBadge: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
    padding: '3px 9px', borderRadius: '100px',
  },
  cardTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '15px', fontWeight: 400, lineHeight: 1.4,
    color: 'var(--text)', letterSpacing: '-0.2px',
    flex: 1,
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', gap: '7px',
    marginTop: 'auto',
  },
  metaItem: {
    fontSize: '12px', color: 'var(--text-3)', fontWeight: 300,
  },
  metaDot: {
    width: '3px', height: '3px',
    background: 'var(--text-3)', borderRadius: '50%', opacity: 0.5,
  },
  cardFooter: {
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
    marginTop: '4px',
  },
  readLink: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)',
    transition: 'gap 0.18s',
  },
  empty: {
    textAlign: 'center', padding: '56px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  resetBtn: {
    marginTop: '12px', padding: '8px 18px',
    borderRadius: '8px', fontSize: '13px', fontWeight: 500,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
