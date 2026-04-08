'use client'

import { useState } from 'react'
import {
  Newspaper, ArrowUpRight, Clock, Funnel,
} from '@phosphor-icons/react'
import type { Actualite } from './page'

const CATEGORIES = [
  { value: 'all',                label: 'Tout',                color: 'var(--text-2)', bg: 'var(--border)' },
  { value: 'reglementation',     label: 'Réglementation',      color: '#60a5fa',       bg: 'rgba(96,165,250,0.12)' },
  { value: 'fiscalite',          label: 'Fiscalité',           color: '#34d399',       bg: 'rgba(52,211,153,0.12)' },
  { value: 'gites',              label: 'Gîtes & Meublés',     color: '#f59e0b',       bg: 'rgba(245,158,11,0.12)' },
  { value: 'chambres-hotes',     label: "Chambres d'hôtes",    color: '#ec4899',       bg: 'rgba(236,72,153,0.12)' },
  { value: 'conciergerie',       label: 'Conciergeries',       color: '#8b5cf6',       bg: 'rgba(139,92,246,0.12)' },
  { value: 'reservation-directe', label: 'Réserv. directe',   color: '#10b981',       bg: 'rgba(16,185,129,0.12)' },
  { value: 'marche',             label: 'Marché',              color: '#f472b6',       bg: 'rgba(244,114,182,0.12)' },
  { value: 'communes',           label: 'Communes & Villes',   color: '#64748b',       bg: 'rgba(100,116,139,0.12)' },
  { value: 'plateformes',        label: 'Plateformes OTA',     color: '#fb923c',       bg: 'rgba(251,146,60,0.12)' },
  { value: 'outils',             label: 'Outils & Tech',       color: '#a78bfa',       bg: 'rgba(167,139,250,0.12)' },
  { value: 'general',            label: 'Général',             color: '#94a3b8',       bg: 'rgba(148,163,184,0.12)' },
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

export default function ActualitesView({ articles }: { articles: Actualite[] }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = activeFilter === 'all'
    ? articles
    : articles.filter(a => a.category === activeFilter)

  // Only show category filters that have articles
  const usedCategories = new Set(articles.map(a => a.category))
  const visibleCats = CATEGORIES.filter(c => c.value === 'all' || usedCategories.has(c.value))

  return (
    <div style={s.page}>

      {/* Intro */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          Actualités <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>LCD</em>
        </h2>
        <p style={s.pageDesc}>
          Réglementation, fiscalité, marché, actualités des gîtes, chambres d'hôtes, conciergeries et réservation directe — triées et résumées pour toi.
        </p>
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
            gîtes, chambres d&apos;hôtes, conciergeries, réservation directe — tout le secteur LCD
            centralisé et trié par profil.
          </p>
        </div>
      ) : (
        <>
          {/* Filters */}
          {visibleCats.length > 2 && (
            <div style={s.filters} className="fade-up d1">
              <Funnel size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={s.filterRow} className="actu-filter-row">
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
                        {articles.filter(a => a.category === cat.value).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="guide-priority-grid fade-up d2">
            {filtered.map(article => {
              const cat = getCat(article.category)
              const domain = getDomain(article.source_url)
              return (
                <div key={article.id} style={s.card} className="glass-card">
                  <div style={s.cardMeta}>
                    <span style={{ ...s.catBadge, color: cat.color, background: cat.bg, borderColor: `${cat.color}25` }}>
                      {cat.label}
                    </span>
                    <span style={s.dateLabel}>{formatDate(article.published_at ?? article.created_at)}</span>
                  </div>

                  <h3 style={s.cardTitle}>{article.title}</h3>
                  <p style={s.cardSummary}>{article.summary}</p>

                  {article.source_url && (
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={s.sourceLink}
                      className="actu-source-link"
                    >
                      {domain ?? 'Lire la source'}
                      <ArrowUpRight size={12} style={{ flexShrink: 0 }} />
                    </a>
                  )}
                </div>
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
        .actu-source-link {
          color: var(--text-3) !important;
          text-decoration: none;
          transition: color 0.15s;
        }
        .actu-source-link:hover {
          color: var(--text-2) !important;
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

  card: { padding: '22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' as const },
  catBadge: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' as const, padding: '3px 8px', borderRadius: '100px', border: '1px solid' },
  dateLabel: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: 300 },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.4, margin: 0 },
  cardSummary: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 },
  sourceLink: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 400, marginTop: '4px', alignSelf: 'flex-start' },

  noResults: { padding: '32px', textAlign: 'center' as const, fontSize: '14px', color: 'var(--text-muted)', borderRadius: '16px' },
}
