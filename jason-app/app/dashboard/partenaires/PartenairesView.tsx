'use client'

import { ArrowUpRight, Star, Buildings, Handshake } from '@phosphor-icons/react'
import { DRIING_SERVICES } from '@/lib/constants/partners'
import PartenaireSuggestForm from './PartenaireSuggestForm'

interface Partner {
  id: string
  name: string
  description: string
  advantage: string
  promo_code: string | null
  url: string
  category: string
}

export default function PartenairesView({ additionalPartners = [], plan = 'decouverte' }: { additionalPartners?: Partner[]; plan?: string }) {
  const isDecouverte = plan === 'decouverte'
  return (
    <div style={styles.page}>
      {/* Intro */}
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          Partenaires <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>exclusifs</em>
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
            href="https://www.driing.co/"
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

        {/* Service cards — dynamiques via DRIING_SERVICES */}
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

      {/* ── Partenaires additionnels (depuis la DB) ── */}
      {additionalPartners.length > 0 && (
        <div style={styles.additionalSection} className="fade-up d2">
          <div style={styles.additionalLabel}>Autres partenaires</div>
          <div style={styles.additionalGrid} className="dash-grid-2">
            {additionalPartners.map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.additionalCard}
                className="glass-card"
              >
                <div style={styles.additionalTop}>
                  <div style={styles.additionalName}>{p.name}</div>
                  <span style={styles.categoryPill}>{p.category}</span>
                </div>
                <p style={styles.additionalDesc}>{p.description}</p>
                <div style={styles.advantageBox}>
                  <span style={styles.advantageLabel}>Avantage membres</span>
                  <span style={styles.advantageText}>{p.advantage}</span>
                  {p.promo_code && !isDecouverte && (
                    <span style={styles.promoCode}>{p.promo_code}</span>
                  )}
                  {p.promo_code && isDecouverte && (
                    <a href="/dashboard/abonnement" style={styles.promoLocked}>
                      🔒 Code promo — Standard
                    </a>
                  )}
                </div>
                <div style={styles.serviceLink}>
                  Découvrir <ArrowUpRight size={12} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Suggest a partner */}
      <div style={styles.suggestSection} className="fade-up d3">
        <div style={styles.suggestBox} className="glass-card">
          <div style={styles.suggestLeft}>
            <div style={styles.suggestEmoji}>
              <Handshake size={28} color="#FFD56B" weight="duotone" />
            </div>
            <div>
              <h3 style={styles.suggestTitle}>
                Tu connais un outil ou service utile aux hôtes ?
              </h3>
              <p style={styles.suggestDesc}>
                Suggère-nous un partenaire potentiel — on étudiera la possibilité de négocier une offre exclusive pour les membres.
              </p>
            </div>
          </div>
          <PartenaireSuggestForm />
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '1400px' },
  intro: { marginBottom: '28px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'var(--text-2)', maxWidth: '560px', lineHeight: 1.6,
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
    textTransform: 'uppercase', color: 'var(--accent-text)',
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
    fontWeight: 400, color: 'var(--text)',
  },
  featuredTagline: {
    fontSize: '13px', color: 'var(--text-3)', marginTop: '3px',
  },

  /* 3 services Driing */
  servicesGrid: {},
  serviceCard: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
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
    fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px',
  },
  serviceTagline: {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px',
  },
  serviceDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.65,
    flex: 1,
  },
  serviceLink: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--text-3)',
    marginTop: 'auto',
  },

  /* ── Partenaires additionnels ── */
  additionalSection: { marginBottom: '40px' },
  additionalLabel: {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.7px',
    textTransform: 'uppercase', color: 'var(--text-3)',
    marginBottom: '18px',
  },
  additionalGrid: {},
  additionalCard: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    padding: '22px', borderRadius: '16px', textDecoration: 'none',
    transition: 'background 0.18s',
  },
  additionalTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
  },
  additionalName: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text)',
    fontFamily: 'Fraunces, serif',
  },
  categoryPill: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    color: 'var(--accent-text)', background: 'rgba(0,76,63,0.2)',
    border: '1px solid rgba(0,76,63,0.3)', borderRadius: '100px',
    padding: '3px 10px', flexShrink: 0,
  },
  additionalDesc: {
    fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65,
  },
  advantageBox: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    padding: '12px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.04)',
    border: '1px solid rgba(255,213,107,0.1)',
  },
  advantageLabel: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase', color: 'rgba(255,213,107,0.5)',
  },
  advantageText: {
    fontSize: '13px', color: 'var(--text-2)', fontWeight: 400,
  },
  promoCode: {
    fontSize: '12px', fontWeight: 700, color: 'var(--accent-text)',
    fontFamily: 'monospace', letterSpacing: '1px', marginTop: '2px',
  },
  promoLocked: {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
    marginTop: '4px', textDecoration: 'none', display: 'block',
    opacity: 0.7,
  },

  // Suggest section
  suggestSection: { marginTop: '8px' },
  suggestBox: {
    display: 'flex', alignItems: 'flex-start', gap: '32px',
    padding: 'clamp(20px,3vw,36px)', borderRadius: '20px', flexWrap: 'wrap',
  },
  suggestLeft: { display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '260px' },
  suggestEmoji: { flexShrink: 0, marginTop: '3px' },
  suggestTitle: { fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 },
  suggestDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.6 },
}
