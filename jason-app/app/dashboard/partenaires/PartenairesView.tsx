'use client'

import { useState } from 'react'
import { ArrowUpRight, Tag, Star, CalendarBlank, BookOpen, Buildings } from '@phosphor-icons/react'

interface Partner {
  id: string
  name: string
  category: string
  description: string
  advantage: string
  promo_code?: string
  url: string
}

const DRIING_SERVICES = [
  {
    icon: CalendarBlank,
    name: 'Plateforme de réservation',
    tagline: '0 % de commission',
    desc: 'Recevez des réservations directes sans payer de commission à Airbnb ou Booking. Vos revenus, intégralement.',
    url: 'https://driing.com',
    color: '#34D399',
  },
  {
    icon: BookOpen,
    name: 'Livret d\'accueil digital',
    tagline: 'Expérience voyageur premium',
    desc: 'Créez un livret d\'accueil interactif partageable par lien ou QR code — instructions d\'arrivée, Wi-Fi, recommandations locales.',
    url: 'https://driing.com',
    color: '#93C5FD',
  },
  {
    icon: Buildings,
    name: 'Annuaire des conciergeries',
    tagline: 'Visibilité & mise en réseau',
    desc: 'Référencez votre conciergerie pour être trouvé par des propriétaires et collaborer avec d\'autres professionnels du secteur.',
    url: 'https://driing.com',
    color: '#FFD56B',
  },
]

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

      {/* ── Driing featured banner ── */}
      <div style={styles.featured} className="fade-up">
        {/* Header */}
        <div style={styles.featuredHeader}>
          <div style={styles.featuredBadge}>
            <Star size={11} weight="fill" color="#FFD56B" />
            Partenaire phare
          </div>
          <a
            href="https://driing.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ fontSize: '13px', padding: '9px 18px', marginLeft: 'auto' }}
          >
            Découvrir Driing <ArrowUpRight size={14} weight="bold" />
          </a>
        </div>

        {/* Brand */}
        <div style={styles.featuredBrand}>
          <div style={styles.featuredLogo}>
            <Buildings size={26} color="#FFD56B" weight="duotone" />
          </div>
          <div>
            <div style={styles.featuredName}>Driing</div>
            <div style={styles.featuredTagline}>La suite complète pour les hôtes professionnels</div>
          </div>
        </div>

        {/* 3 service cards */}
        <div style={styles.servicesGrid} className="driing-services-grid">
          {DRIING_SERVICES.map(({ icon: Icon, name, tagline, desc, url, color }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.serviceCard}
              className="driing-service-card"
            >
              <div style={styles.serviceHead}>
                <div style={{ ...styles.serviceIcon, background: color + '18', border: `1px solid ${color}30` }}>
                  <Icon size={18} color={color} weight="fill" />
                </div>
                <div>
                  <div style={styles.serviceName}>{name}</div>
                  <div style={{ ...styles.serviceTagline, color }}>{tagline}</div>
                </div>
              </div>
              <p style={styles.serviceDesc}>{desc}</p>
              <div style={styles.serviceLink}>
                En savoir plus <ArrowUpRight size={12} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Section title + filters */}
      {partners.length > 0 && (
        <>
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
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '1400px' },
  intro: { marginBottom: '28px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', maxWidth: '560px', lineHeight: 1.6,
  },

  /* ── Driing featured ── */
  featured: {
    marginBottom: '44px',
    background: 'linear-gradient(135deg, rgba(0,76,63,0.45) 0%, rgba(0,51,42,0.3) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
    borderRadius: '20px',
    padding: 'clamp(20px,3vw,32px)',
  },
  featuredHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '20px',
  },
  featuredBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px',
    textTransform: 'uppercase', color: '#FFD56B',
  },
  featuredBrand: {
    display: 'flex', alignItems: 'center', gap: '14px',
    marginBottom: '24px',
  },
  featuredLogo: {
    width: '48px', height: '48px', flexShrink: 0,
    background: 'rgba(0,76,63,0.6)',
    border: '1px solid rgba(255,213,107,0.2)',
    borderRadius: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  featuredName: {
    fontFamily: 'Fraunces, serif', fontSize: '22px',
    fontWeight: 400, color: '#f0f4ff',
  },
  featuredTagline: {
    fontSize: '13px', color: 'rgba(240,244,255,0.45)', marginTop: '3px',
  },

  /* 3 services */
  servicesGrid: {},  /* handled by CSS class driing-services-grid */
  serviceCard: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '20px',
    textDecoration: 'none',
    transition: 'background 0.18s, border-color 0.18s',
    cursor: 'pointer',
  },
  serviceHead: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
  },
  serviceIcon: {
    width: '36px', height: '36px', flexShrink: 0,
    borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  serviceName: {
    fontSize: '14px', fontWeight: 600, color: '#f0f4ff', marginBottom: '3px',
  },
  serviceTagline: {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px',
  },
  serviceDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', lineHeight: 1.65,
    flex: 1,
  },
  serviceLink: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 500,
    color: 'rgba(240,244,255,0.35)',
    marginTop: 'auto',
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
}
