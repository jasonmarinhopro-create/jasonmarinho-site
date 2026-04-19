'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, ArrowRight, Funnel } from '@phosphor-icons/react'
import type { BlogPost } from './page'

const CATEGORIES = [
  { value: 'all',        label: 'Tout',                  color: 'var(--text-2)',  bg: 'var(--border)' },
  { value: 'conseil',    label: 'Conseils',              color: '#34d399',        bg: 'rgba(52,211,153,0.12)' },
  { value: 'strategie',  label: 'Stratégie',             color: '#60a5fa',        bg: 'rgba(96,165,250,0.12)' },
  { value: 'experience', label: "Retour d'expérience",   color: '#f59e0b',        bg: 'rgba(245,158,11,0.12)' },
  { value: 'outil',      label: 'Outils',                color: '#a78bfa',        bg: 'rgba(167,139,250,0.12)' },
  { value: 'marche',     label: 'Marché',                color: '#f472b6',        bg: 'rgba(244,114,182,0.12)' },
  { value: 'general',    label: 'Général',               color: '#94a3b8',        bg: 'rgba(148,163,184,0.12)' },
]

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BlogView({ posts }: { posts: BlogPost[] }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = activeFilter === 'all'
    ? posts
    : posts.filter(p => p.category === activeFilter)

  const usedCategories = new Set(posts.map(p => p.category))
  const visibleCats = CATEGORIES.filter(c => c.value === 'all' || usedCategories.has(c.value))

  return (
    <div style={s.page}>
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          Le <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>blog</em>
        </h2>
        <p style={s.pageDesc}>
          Conseils, stratégies, retours d&apos;expérience et analyses du marché LCD — écrits par Jason.
        </p>
      </div>

      {posts.length === 0 ? (
        <div style={s.emptyWrap} className="fade-up glass-card">
          <div style={s.emptyIcon}>
            <BookOpen size={32} color="var(--text-3)" />
          </div>
          <div style={s.emptyLabel}>
            <Clock size={13} color="var(--text-muted)" />
            Bientôt disponible
          </div>
          <p style={s.emptyDesc}>
            Le premier article arrive bientôt. Stratégies, conseils pratiques et retours
            du terrain — tout pour développer ton activité LCD sereinement.
          </p>
        </div>
      ) : (
        <>
          {visibleCats.length > 2 && (
            <div style={s.filters} className="fade-up d1">
              <Funnel size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={s.filterRow}>
                {visibleCats.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveFilter(cat.value)}
                    style={{
                      ...s.filterBtn,
                      ...(activeFilter === cat.value
                        ? { color: cat.color, background: cat.bg, borderColor: `${cat.color}30` }
                        : {}),
                    }}
                  >
                    {cat.label}
                    {cat.value !== 'all' && (
                      <span style={s.filterCount}>
                        {posts.filter(p => p.category === cat.value).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="guide-priority-grid fade-up d2">
            {filtered.map(post => {
              const cat = getCat(post.category)
              return (
                <Link key={post.id} href={`/dashboard/blog/${post.slug}`} style={s.card} className="glass-card blog-card">
                  <div style={s.cardMeta}>
                    <span style={{ ...s.catBadge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>
                      {cat.label}
                    </span>
                    <span style={s.dateLabel}>{formatDate(post.published_at ?? post.created_at)}</span>
                  </div>

                  <h3 style={s.cardTitle}>{post.title}</h3>
                  {post.summary && <p style={s.cardSummary}>{post.summary}</p>}

                  <div style={s.cardFooter}>
                    {post.reading_time && (
                      <span style={s.readTime}>
                        <Clock size={12} />
                        {post.reading_time} min
                      </span>
                    )}
                    <span style={s.readMore}>
                      Lire <ArrowRight size={13} weight="bold" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={s.noResults} className="glass-card fade-up">
              Aucun article dans cette catégorie pour le moment.
            </div>
          )}
        </>
      )}

      <style>{`
        .blog-card {
          text-decoration: none !important;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .blog-card:hover {
          border-color: rgba(255,213,107,0.25) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  intro: { marginBottom: '28px', maxWidth: '600px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.7 },

  emptyWrap: { padding: '48px 32px', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' as const, maxWidth: '520px' },
  emptyIcon: { width: '64px', height: '64px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.8px' },
  emptyDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: '400px' },

  filters: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  filterBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' as const },
  filterCount: { fontSize: '10px', fontWeight: 700, background: 'var(--border)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '100px' },

  card: { padding: '22px', borderRadius: '16px' },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' as const },
  catBadge: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '100px', border: '1px solid' },
  dateLabel: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: 300 },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.4, margin: 0 },
  cardSummary: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 },

  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' },
  readTime: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 300 },
  readMore: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)' },

  noResults: { padding: '32px', textAlign: 'center' as const, fontSize: '14px', color: 'var(--text-muted)', borderRadius: '16px' },
}
