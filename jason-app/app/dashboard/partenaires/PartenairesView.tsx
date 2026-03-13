'use client'

import { useState } from 'react'
import { ArrowUpRight, Tag, Star, Buildings } from '@phosphor-icons/react'

interface Partner {
  id: string
  name: string
  category: string
  description: string
  advantage: string
  promo_code?: string
  url: string
}

export default function PartenairesView({ partners }: { partners: Partner[] }) {
  const categories = ['Tout', ...new Set(partners.map(p => p.category))]
  const [activeCategory, setActiveCategory] = useState('Tout')

  const filtered = activeCategory === 'Tout'
    ? partners
    : partners.filter(p => p.category === activeCategory)

  return (
    <div style={styles.page}>
      {/* Intro */}
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          Partenaires <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>exclusifs</em>
        </h2>
        <p style={styles.pageDesc}>
          Des outils et services négociés pour les membres — sélectionnés pour les hôtes et conciergeries professionnels.
        </p>
      </div>

      {/* Featured banner — Driing */}
      <div style={styles.featured} className="fade-up">
        <div style={styles.featuredInner}>
          <div style={styles.featuredLeft}>
            <div style={styles.featuredBadge}>
              <Star size={11} weight="fill" color="#FFD56B" />
              Partenaire phare
            </div>
            <div style={styles.featuredLogo}>
              <Buildings size={28} color="#FFD56B" weight="duotone" />
            </div>
            <div>
              <div style={styles.featuredName}>Driing</div>
              <div style={styles.featuredTagline}>La suite complète pour les hôtes professionnels</div>
            </div>
          </div>
          <p style={styles.featuredDesc}>
            Driing accompagne les conciergeries et hôtes avec des outils pensés pour professionnaliser leur activité — livret d'accueil digital, annuaire et plateforme de réservation sans commission.
          </p>
          <a
            href="https://driing.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
          >
            Découvrir Driing <ArrowUpRight size={14} weight="bold" />
          </a>
        </div>
      </div>

      {/* Section title + filters */}
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>
          Offres&nbsp;
          <span style={{ color: 'rgba(240,244,255,0.38)', fontWeight: 400 }}>
            ({partners.length})
          </span>
        </div>

        {categories.length > 2 && (
          <div style={styles.filterRow}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.filterPill,
                  ...(activeCategory === cat ? styles.filterPillActive : {}),
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={styles.grid} className="dash-grid-3">
        {filtered.map((p, i) => (
          <div key={p.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
            <div style={styles.cardHeader}>
              <div style={styles.logoPlaceholder}>
                <Buildings size={22} color="#FFD56B" weight="duotone" />
              </div>
              <div>
                <div style={styles.partnerName}>{p.name}</div>
                <div style={styles.partnerCat}>{p.category}</div>
              </div>
            </div>

            <p style={styles.desc}>{p.description}</p>

            <div style={styles.advantageBox}>
              <Tag size={13} color="#FFD56B" />
              <span style={styles.advantageText}>{p.advantage}</span>
            </div>

            {p.promo_code && (
              <div style={styles.promoRow}>
                <span style={styles.promoLabel}>Code promo</span>
                <code style={styles.promoCode}>{p.promo_code}</code>
              </div>
            )}

            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: '13px', padding: '10px 18px', alignSelf: 'flex-start', marginTop: 'auto' }}
            >
              Accéder à l'offre <ArrowUpRight size={14} weight="bold" />
            </a>
          </div>
        ))}
      </div>

      {partners.length === 0 && (
        <div style={styles.empty}>
          D'autres partenaires arrivent bientôt.
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '1400px' },
  intro: { marginBottom: '32px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', maxWidth: '520px', lineHeight: 1.6,
  },

  /* Featured banner */
  featured: {
    marginBottom: '40px',
    background: 'linear-gradient(135deg, rgba(0,76,63,0.45) 0%, rgba(0,51,42,0.3) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '18px',
    padding: 'clamp(20px,3vw,32px)',
  },
  featuredInner: {
    display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap',
  },
  featuredLeft: {
    display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px',
  },
  featuredBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px',
    textTransform: 'uppercase', color: '#FFD56B',
  },
  featuredLogo: {
    width: '52px', height: '52px',
    background: 'rgba(0,76,63,0.6)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  featuredName: {
    fontFamily: 'Fraunces, serif', fontSize: '22px',
    fontWeight: 400, color: '#f0f4ff',
  },
  featuredTagline: {
    fontSize: '13px', color: 'rgba(240,244,255,0.5)', marginTop: '3px',
  },
  featuredDesc: {
    flex: 1, fontSize: '14px', fontWeight: 300,
    color: 'rgba(240,244,255,0.6)', lineHeight: 1.7,
    alignSelf: 'center', minWidth: '220px',
  },

  /* Section header */
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
  },
  sectionTitle: {
    fontFamily: 'Fraunces, serif', fontSize: '22px',
    fontWeight: 400, color: '#f0f4ff',
  },
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterPill: {
    padding: '7px 16px', borderRadius: '999px',
    fontSize: '13px', fontWeight: 400,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(240,244,255,0.5)',
    cursor: 'pointer', transition: 'all 0.18s',
  },
  filterPillActive: {
    background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.25)',
    color: '#FFD56B',
  },

  /* Cards */
  grid: {},
  card: {
    padding: '24px', borderRadius: '16px',
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoPlaceholder: {
    width: '44px', height: '44px', flexShrink: 0,
    background: 'rgba(0,76,63,0.3)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '11px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  partnerName: { fontSize: '15px', fontWeight: 600, color: '#f0f4ff' },
  partnerCat: { fontSize: '11px', color: 'rgba(240,244,255,0.35)', marginTop: '2px' },
  desc: {
    fontSize: '13px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', lineHeight: 1.65,
  },
  advantageBox: {
    display: 'flex', alignItems: 'flex-start', gap: '8px',
    background: 'rgba(255,213,107,0.06)',
    border: '1px solid rgba(255,213,107,0.14)',
    borderRadius: '10px', padding: '10px 14px',
  },
  advantageText: { fontSize: '13px', color: 'rgba(255,213,107,0.85)', lineHeight: 1.5 },
  promoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  promoLabel: { fontSize: '12px', color: 'rgba(240,244,255,0.38)' },
  promoCode: {
    fontFamily: 'monospace', fontSize: '13px', fontWeight: 600,
    color: '#FFD56B', background: 'rgba(255,213,107,0.08)',
    border: '1px dashed rgba(255,213,107,0.25)',
    borderRadius: '6px', padding: '3px 9px',
  },
  empty: {
    textAlign: 'center', padding: '60px 20px',
    color: 'rgba(240,244,255,0.3)', fontSize: '14px',
  },
}
