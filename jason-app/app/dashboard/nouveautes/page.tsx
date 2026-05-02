'use client'

import { useState } from 'react'
import { Sparkle, ArrowUp, Wrench, Star } from '@phosphor-icons/react/dist/ssr'
import { CHANGELOG, ChangelogTag } from '@/lib/constants/changelog'

const TAG_CONFIG: Record<ChangelogTag, { label: string; color: string; bg: string; border: string }> = {
  nouveau:       { label: 'Nouveau',      color: '#63D683', bg: 'rgba(99,214,131,0.10)',  border: 'rgba(99,214,131,0.25)' },
  amélioration:  { label: 'Amélioration', color: '#FFD56B', bg: 'rgba(255,213,107,0.10)', border: 'rgba(255,213,107,0.25)' },
  correction:    { label: 'Correction',   color: '#93C5FD', bg: 'rgba(147,197,253,0.10)', border: 'rgba(147,197,253,0.25)' },
  important:     { label: 'Important',    color: '#F472B6', bg: 'rgba(244,114,182,0.10)', border: 'rgba(244,114,182,0.25)' },
}

function TagIcon({ tag, size = 11 }: { tag: ChangelogTag; size?: number }) {
  if (tag === 'nouveau')      return <Sparkle size={size} weight="fill" />
  if (tag === 'amélioration') return <ArrowUp  size={size} weight="bold" />
  if (tag === 'correction')   return <Wrench   size={size} weight="fill" />
  return <Star size={size} weight="fill" />
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

type Filter = 'all' | ChangelogTag

export default function NouveautesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const filtered = CHANGELOG.filter(e => activeFilter === 'all' || e.tag === activeFilter)

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',          label: 'Tout voir' },
    { key: 'nouveau',      label: 'Nouveau' },
    { key: 'amélioration', label: 'Amélioration' },
    { key: 'correction',   label: 'Correction' },
    { key: 'important',    label: 'Important' },
  ]

  return (
    <>

      <div style={s.page}>
        {/* Intro */}
        <div style={s.intro} className="fade-up">
          <h2 style={s.pageTitle}>
            Historique des <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>mises à jour</em>
          </h2>
          <p style={s.pageDesc}>
            Suis l'évolution de la plateforme, chaque amélioration, nouvelle fonctionnalité et correction.
          </p>
          <div style={s.statRow}>
            <span style={s.statChip}>
              <Sparkle size={12} weight="fill" color="#FFD56B" />
              {CHANGELOG.length} mises à jour depuis le lancement
            </span>
          </div>
        </div>

        {/* Filtres */}
        <div style={s.filterBar} className="fade-up d1">
          {filters.map(f => {
            const cfg = f.key !== 'all' ? TAG_CONFIG[f.key as ChangelogTag] : null
            const isActive = activeFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  ...s.filterBtn,
                  ...(isActive
                    ? {
                        background: cfg ? cfg.bg : 'rgba(255,213,107,0.08)',
                        border: `1px solid ${cfg ? cfg.border : 'rgba(255,213,107,0.25)'}`,
                        color: cfg ? cfg.color : 'var(--accent-text)',
                      }
                    : {}),
                }}
              >
                {cfg && <TagIcon tag={f.key as ChangelogTag} size={10} />}
                {f.label}
                <span style={{ ...s.filterCount, ...(isActive && cfg ? { color: cfg.color, background: cfg.bg } : {}) }}>
                  {f.key === 'all'
                    ? CHANGELOG.length
                    : CHANGELOG.filter(e => e.tag === f.key).length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Timeline alternante */}
        <div className="cl-wrap fade-up d2">
          {filtered.map((entry, i) => {
            const tag = TAG_CONFIG[entry.tag]
            // Alternance : pairs → carte à gauche, impairs → carte à droite
            const cardOnLeft = i % 2 === 0

            const CardEl = (
              <div style={s.card} className="glass-card">
                <div style={s.cardMeta}>
                  <span style={{ ...s.tagBadge, color: tag.color, background: tag.bg, border: `1px solid ${tag.border}` }}>
                    <TagIcon tag={entry.tag} />
                    {tag.label}
                  </span>
                  {/* Date visible sur mobile dans la carte */}
                  <span style={{ ...s.dateInCard }}>{formatDate(entry.date)}</span>
                </div>
                <h3 style={s.cardTitle}>{entry.title}</h3>
                <p style={s.cardDesc}>{entry.description}</p>
              </div>
            )

            const MetaEl = (
              <div className={`cl-meta ${cardOnLeft ? 'r' : 'l'}`}>
                {formatDateShort(entry.date)}
              </div>
            )

            return (
              <div key={entry.id} className={`cl-row${cardOnLeft ? '' : ' cl-card-right'}`}>
                {/* Carte, toujours dans .cl-card */}
                <div className="cl-card">
                  {CardEl}
                </div>

                {/* Centre : dot + ligne */}
                <div className="cl-center">
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: tag.color, boxShadow: `0 0 10px ${tag.color}60`,
                    flexShrink: 0, zIndex: 1,
                  }} />
                  {i < filtered.length - 1 && (
                    <div style={{
                      width: '1px', flex: 1, minHeight: '32px',
                      background: 'var(--border)', marginTop: '8px',
                    }} />
                  )}
                </div>

                {/* Meta date, masqué sur mobile */}
                <div className="cl-meta-col">
                  {MetaEl}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={s.empty}>
              <Sparkle size={32} color="var(--text-muted)" weight="fill" />
              <p style={{ color: 'var(--text-3)', marginTop: '10px', fontSize: '14px' }}>Aucune entrée pour ce filtre.</p>
            </div>
          )}

          {/* Fin de timeline */}
          {filtered.length > 0 && (
            <div style={s.timelineEnd}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Lancement de la plateforme · Janvier 2026
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:     { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro:    { marginBottom: '28px', maxWidth: '720px' },
  pageTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '8px',
  },
  pageDesc:  { fontSize: '15px', fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: '16px' },
  statRow:   { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statChip:  {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 500,
    padding: '5px 12px', borderRadius: '100px',
    background: 'rgba(255,213,107,0.07)', border: '1px solid rgba(255,213,107,0.15)',
    color: 'var(--text-3)',
  },

  filterBar: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '32px' },
  filterBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '12.5px', fontWeight: 500, padding: '7px 14px',
    borderRadius: '100px', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    color: 'var(--text-2)', fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.18s',
  },
  filterCount: {
    fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '100px',
    background: 'var(--surface)', color: 'var(--text-muted)',
  },

  card:      { padding: '20px 22px', borderRadius: '16px' },
  cardMeta:  { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' as const },
  tagBadge:  {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 600,
    padding: '3px 9px', borderRadius: '100px',
  },
  dateInCard: { fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' },
  cardTitle:  { fontSize: '14.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.4 },
  cardDesc:   { fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.65, margin: 0 },

  timelineEnd: {
    display: 'flex', alignItems: 'center', gap: '14px',
    justifyContent: 'center', padding: '16px 0 8px',
  },
  empty: { textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
}
