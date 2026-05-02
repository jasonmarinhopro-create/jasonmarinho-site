'use client'

import { useState, useTransition } from 'react'
import { ArrowUpRight, Star, Buildings, Handshake, Sparkle, Heart, TrendUp } from '@phosphor-icons/react/dist/ssr'
import { DRIING_SERVICES } from '@/lib/constants/partners'
import { ECOSYSTEME_TOOLS, ECOSYSTEME_CATEGORIES, type EcosystemeTool } from '@/lib/constants/ecosysteme'
import PartenaireSuggestForm from './PartenaireSuggestForm'
import { toggleToolInterest } from './actions'

interface Partner {
  id: string
  name: string
  description: string
  advantage: string
  promo_code: string | null
  url: string
  category: string
}

export default function PartenairesView({
  additionalPartners = [],
  plan = 'decouverte',
  interestCounts = {},
  userVotedSlugs = [],
  isAuthenticated = false,
}: {
  additionalPartners?: Partner[]
  plan?: string
  interestCounts?: Record<string, number>
  userVotedSlugs?: string[]
  isAuthenticated?: boolean
}) {
  const isDecouverte = plan === 'decouverte'
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Optimistic UI : copies locales mises à jour immédiatement au clic
  const [counts, setCounts] = useState<Record<string, number>>(interestCounts)
  const [voted, setVoted] = useState<Set<string>>(new Set(userVotedSlugs))
  const [, startTransition] = useTransition()

  function handleToggleInterest(slug: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return
    const wasVoted = voted.has(slug)
    // Optimistic update
    setVoted(prev => {
      const next = new Set(prev)
      if (wasVoted) next.delete(slug); else next.add(slug)
      return next
    })
    setCounts(prev => ({
      ...prev,
      [slug]: Math.max(0, (prev[slug] ?? 0) + (wasVoted ? -1 : 1)),
    }))
    startTransition(async () => {
      const res = await toggleToolInterest(slug)
      if (res.error) {
        // Rollback en cas d'erreur
        setVoted(prev => {
          const next = new Set(prev)
          if (wasVoted) next.add(slug); else next.delete(slug)
          return next
        })
        setCounts(prev => ({
          ...prev,
          [slug]: Math.max(0, (prev[slug] ?? 0) + (wasVoted ? 1 : -1)),
        }))
      }
    })
  }

  // Outils avec partenariat (discount), affichés en haut
  const partnered = ECOSYSTEME_TOOLS.filter(t => t.partnership === 'discount')

  // Outils sans partenariat, affichés par catégorie dans le catalogue
  const catalog = ECOSYSTEME_TOOLS.filter(t => t.partnership === 'none')
  const filteredCatalog = activeCategory
    ? catalog.filter(t => t.category === activeCategory)
    : catalog

  // Group catalog by category
  const grouped: Record<string, EcosystemeTool[]> = {}
  filteredCatalog.forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = []
    grouped[t.category].push(t)
  })

  return (
    <div style={styles.page}>
      {/* Hero intro */}
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          L&apos;<em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>écosystème</em> LCD
        </h2>
        <p style={styles.pageDesc}>
          Tous les services, partenaires et acteurs qui font vivre ta location courte durée.
          Avec partenariats négociés mis en avant quand ils existent, sinon liens directs vers les outils du marché.
        </p>
      </div>

      {/* ── Driing featured ── */}
      <div style={styles.featured} className="fade-up">
        <div style={styles.featuredHeader}>
          <div style={styles.featuredBadge}>
            <Star size={11} weight="fill" color="var(--accent-text)" />
            Partenaire phare · Driing
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

        <div style={styles.featuredBrand}>
          <div style={styles.featuredLogo}>
            <Buildings size={26} color="var(--accent-text)" weight="duotone" />
          </div>
          <div>
            <div style={styles.featuredName}>Driing</div>
            <div style={styles.featuredTagline}>La suite complète pour les hôtes professionnels</div>
          </div>
        </div>

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

      {/* ── Partenariats négociés (hors Driing) ── */}
      {(partnered.length > 0 || additionalPartners.length > 0) && (
        <div style={styles.sectionWrap} className="fade-up">
          <div style={styles.sectionLabel}>
            <Sparkle size={13} weight="fill" color="#15803d" />
            Partenariats négociés pour les membres
            <span style={styles.sectionCount}>
              {partnered.length + additionalPartners.length}
            </span>
          </div>
          <div style={styles.partneredGrid} className="dash-grid-2">
            {partnered.map(t => (
              <a
                key={t.slug}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.partneredCard}
                className="glass-card"
              >
                <div style={styles.partneredHead}>
                  <div style={styles.partneredName}>{t.name}</div>
                  <span style={styles.discountBadge}>
                    <Sparkle size={10} weight="fill" /> Réduction membre
                  </span>
                </div>
                <p style={styles.partneredDesc}>{t.description}</p>
                {t.partnershipText && (
                  <div style={styles.advantageBox}>
                    <span style={styles.advantageLabel}>Avantage</span>
                    <span style={styles.advantageText}>{t.partnershipText}</span>
                  </div>
                )}
                <div style={styles.serviceLink}>
                  Voir le site <ArrowUpRight size={12} />
                </div>
              </a>
            ))}
            {additionalPartners.map(p => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.partneredCard}
                className="glass-card"
              >
                <div style={styles.partneredHead}>
                  <div style={styles.partneredName}>{p.name}</div>
                  <span style={styles.discountBadge}>
                    <Sparkle size={10} weight="fill" /> Réduction membre
                  </span>
                </div>
                <p style={styles.partneredDesc}>{p.description}</p>
                <div style={styles.advantageBox}>
                  <span style={styles.advantageLabel}>Avantage</span>
                  <span style={styles.advantageText}>{p.advantage}</span>
                  {p.promo_code && !isDecouverte && (
                    <span style={styles.promoCode}>{p.promo_code}</span>
                  )}
                  {p.promo_code && isDecouverte && (
                    <a href="/dashboard/abonnement" style={styles.promoLocked}>
                      🔒 Code promo, Standard
                    </a>
                  )}
                </div>
                <div style={styles.serviceLink}>
                  Voir le site <ArrowUpRight size={12} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Catalogue par catégorie ── */}
      <div style={styles.sectionWrap} className="fade-up">
        <div style={styles.sectionLabel}>
          <Buildings size={13} weight="fill" color="var(--text-2)" />
          Catalogue des outils LCD
          <span style={styles.sectionCount}>{catalog.length}</span>
        </div>
        <p style={styles.catalogDesc}>
          Les outils les plus utilisés du marché, sans partenariat négocié à ce jour.
          Si tu en utilises un, n&apos;hésite pas à nous le faire savoir pour qu&apos;on cherche à négocier.
        </p>

        {/* Filtre catégories */}
        <div style={styles.catChips}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ ...styles.catChip, ...(activeCategory === null ? styles.catChipOn : {}) }}
          >
            Tout
          </button>
          {ECOSYSTEME_CATEGORIES.map(cat => {
            const count = catalog.filter(t => t.category === cat.id).length
            if (count === 0) return null
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                style={{ ...styles.catChip, ...(activeCategory === cat.id ? styles.catChipOn : {}) }}
              >
                <span>{cat.emoji}</span> {cat.label}
                <span style={styles.catChipCount}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Listing groupé par catégorie */}
        {ECOSYSTEME_CATEGORIES.filter(cat => grouped[cat.id]?.length > 0).map(cat => (
          <div key={cat.id} style={styles.catBlock}>
            <div style={styles.catHeader}>
              <span style={styles.catEmoji}>{cat.emoji}</span>
              <div>
                <div style={styles.catTitle}>{cat.label}</div>
                <div style={styles.catSubtitle}>{cat.desc}</div>
              </div>
            </div>
            <div style={styles.catGrid} className="dash-grid-2">
              {grouped[cat.id].map(t => {
                const count = counts[t.slug] ?? 0
                const isVoted = voted.has(t.slug)
                return (
                  <div key={t.slug} style={styles.toolCard}>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.toolLink}
                    >
                      <div style={styles.toolHead}>
                        <div style={styles.toolName}>{t.name}</div>
                        <ArrowUpRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      </div>
                      <p style={styles.toolDesc}>{t.description}</p>
                    </a>
                    <div style={styles.toolFooter}>
                      <button
                        onClick={(e) => handleToggleInterest(t.slug, e)}
                        disabled={!isAuthenticated}
                        style={{
                          ...styles.interestBtn,
                          ...(isVoted ? styles.interestBtnOn : {}),
                          opacity: isAuthenticated ? 1 : 0.5,
                          cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                        }}
                        title={!isAuthenticated ? 'Connecte-toi pour voter' : isVoted ? 'Retirer mon intérêt' : 'M\'intéresse'}
                      >
                        <Heart size={12} weight={isVoted ? 'fill' : 'regular'} />
                        {isVoted ? "Ça m'intéresse" : "M'intéresse"}
                      </button>
                      {count > 0 && (
                        <span style={styles.interestCount}>
                          {count} {count > 1 ? 'intéressés' : 'intéressé'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filteredCatalog.length === 0 && (
          <div style={styles.empty}>
            Aucun outil dans cette catégorie pour l&apos;instant.
          </div>
        )}
      </div>

      {/* ── Top demandés par la communauté ── */}
      {(() => {
        const topRequested = catalog
          .map(t => ({ tool: t, count: counts[t.slug] ?? 0 }))
          .filter(({ count }) => count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
        if (topRequested.length === 0) return null
        return (
          <div style={styles.sectionWrap} className="fade-up">
            <div style={styles.sectionLabel}>
              <TrendUp size={13} weight="fill" color="var(--accent-text)" />
              Top demandés par la communauté
              <span style={styles.sectionCount}>{topRequested.length}</span>
            </div>
            <p style={styles.catalogDesc}>
              Les outils les plus demandés par les membres pour un partenariat. Plus de votes = plus de chances qu&apos;on négocie une réduction.
            </p>
            <div style={styles.topGrid}>
              {topRequested.map(({ tool, count }, i) => {
                const cat = ECOSYSTEME_CATEGORIES.find(c => c.id === tool.category)
                const isVoted = voted.has(tool.slug)
                return (
                  <div key={tool.slug} style={styles.topCard}>
                    <div style={styles.topRank}>#{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.topName}>
                        {tool.name}
                        {cat && <span style={styles.topCat}>{cat.emoji} {cat.label}</span>}
                      </div>
                      <div style={styles.topMeta}>
                        <span style={{ color: 'var(--accent-text)', fontWeight: 700 }}>{count}</span>
                        {' '}membre{count > 1 ? 's' : ''} intéressé{count > 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleInterest(tool.slug, e)}
                      disabled={!isAuthenticated}
                      style={{
                        ...styles.interestBtn,
                        ...(isVoted ? styles.interestBtnOn : {}),
                        opacity: isAuthenticated ? 1 : 0.5,
                        cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Heart size={12} weight={isVoted ? 'fill' : 'regular'} />
                      {isVoted ? 'Voté' : 'Voter'}
                    </button>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.topLink}
                    >
                      <ArrowUpRight size={13} weight="bold" />
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Suggérer un partenaire ── */}
      <div style={styles.suggestSection} className="fade-up d3">
        <div style={styles.suggestBox} className="glass-card">
          <div style={styles.suggestLeft}>
            <div style={styles.suggestEmoji}>
              <Handshake size={28} color="var(--accent-text)" weight="duotone" />
            </div>
            <div>
              <h3 style={styles.suggestTitle}>
                Tu utilises un outil pas listé ici ?
              </h3>
              <p style={styles.suggestDesc}>
                Dis-nous lequel, on l&apos;ajoutera au catalogue et on cherchera à négocier
                un partenariat si beaucoup de membres le demandent.
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
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '28px' },
  pageTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'var(--text-2)', maxWidth: '720px', lineHeight: 1.6,
  },

  /* ── Section générique ── */
  sectionWrap: { marginBottom: '40px' },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '12px', fontWeight: 700, letterSpacing: '0.7px',
    textTransform: 'uppercase' as const, color: 'var(--text-2)', marginBottom: '14px',
  },
  sectionCount: {
    fontSize: '11px', padding: '1px 8px', borderRadius: '100px',
    background: 'var(--surface)', color: 'var(--text-muted)', fontWeight: 600,
    letterSpacing: 0,
  },

  /* ── Driing featured ── */
  featured: {
    marginBottom: '40px',
    background: 'linear-gradient(135deg, rgba(0,76,63,0.45) 0%, rgba(0,51,42,0.3) 100%)',
    border: '1px solid var(--accent-border)',
    borderRadius: '20px',
    padding: 'clamp(20px,3vw,32px)',
  },
  featuredHeader: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '20px', flexWrap: 'wrap' as const,
  },
  featuredBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.7px',
    textTransform: 'uppercase' as const, color: 'var(--accent-text)',
  },
  featuredBrand: {
    display: 'flex', alignItems: 'center', gap: '14px',
    marginBottom: '24px',
  },
  featuredLogo: {
    width: '48px', height: '48px', flexShrink: 0,
    background: 'rgba(0,76,63,0.6)',
    border: '1px solid var(--accent-border)',
    borderRadius: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  featuredName: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '22px',
    fontWeight: 500, color: 'var(--text)',
  },
  featuredTagline: {
    fontSize: '13px', color: 'var(--text-2)', marginTop: '3px',
  },
  servicesGrid: {
    display: 'grid', gap: '12px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  },
  serviceCard: {
    padding: '16px 18px', borderRadius: '14px',
    background: 'rgba(0,0,0,0.20)', border: '1px solid var(--border)',
    textDecoration: 'none' as const, color: 'var(--text-2)',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  },
  serviceHead: { display: 'flex', alignItems: 'center', gap: '12px' },
  serviceIcon: {
    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  serviceName: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  serviceTagline: { fontSize: '11.5px', fontWeight: 600, marginTop: '2px' },
  serviceDesc: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
  serviceLink: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)', marginTop: 'auto',
  },

  /* ── Partenariats négociés ── */
  partneredGrid: { display: 'grid', gap: '14px' },
  partneredCard: {
    padding: '18px 20px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px solid rgba(21,128,61,0.32)',
    textDecoration: 'none' as const, color: 'var(--text-2)',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  },
  partneredHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
    flexWrap: 'wrap' as const,
  },
  partneredName: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '17px',
    fontWeight: 500, color: 'var(--text)',
  },
  partneredDesc: { fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, margin: 0 },
  discountBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
    padding: '3px 9px', borderRadius: '100px',
    background: 'rgba(21,128,61,0.14)', color: '#15803d',
    border: '1px solid rgba(21,128,61,0.32)',
  },
  advantageBox: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    padding: '10px 12px', borderRadius: '10px',
    background: 'rgba(21,128,61,0.06)', border: '1px solid rgba(21,128,61,0.16)',
  },
  advantageLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
    textTransform: 'uppercase' as const, color: '#15803d',
  },
  advantageText: { fontSize: '13px', color: 'var(--text)', fontWeight: 500 },
  promoCode: {
    display: 'inline-block', alignSelf: 'flex-start' as const,
    padding: '3px 10px', borderRadius: '7px',
    fontFamily: 'monospace', fontSize: '12px', fontWeight: 700,
    background: 'rgba(21,128,61,0.14)', color: '#15803d',
    border: '1px dashed rgba(21,128,61,0.32)',
    marginTop: '4px',
  },
  promoLocked: {
    display: 'inline-block', alignSelf: 'flex-start' as const,
    padding: '4px 10px', borderRadius: '7px',
    fontSize: '11.5px', fontWeight: 600,
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
    textDecoration: 'none' as const, marginTop: '4px',
  },

  /* ── Catalogue ── */
  catalogDesc: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55,
    maxWidth: '700px', margin: '0 0 18px',
  },
  catChips: {
    display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
    marginBottom: '24px',
  },
  catChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '100px',
    fontSize: '12px', fontWeight: 500,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)', cursor: 'pointer',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  catChipOn: {
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
  },
  catChipCount: {
    fontSize: '10px', fontWeight: 700,
    padding: '1px 6px', borderRadius: '100px',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-muted)',
  },

  catBlock: { marginBottom: '28px' },
  catHeader: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    marginBottom: '14px',
  },
  catEmoji: { fontSize: '24px', flexShrink: 0, lineHeight: 1 },
  catTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '18px', fontWeight: 500, color: 'var(--text)',
  },
  catSubtitle: {
    fontSize: '12.5px', color: 'var(--text-2)', marginTop: '3px', lineHeight: 1.4,
  },
  catGrid: { display: 'grid', gap: '10px' },

  toolCard: {
    padding: '14px 16px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  toolLink: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    textDecoration: 'none' as const, color: 'inherit',
  },
  toolHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  toolName: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  toolDesc: { fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 },
  toolFooter: {
    display: 'flex', alignItems: 'center', gap: '10px',
    paddingTop: '8px', borderTop: '1px solid var(--border)',
  },

  /* ── Bouton M'intéresse ── */
  interestBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 11px', borderRadius: '100px',
    fontSize: '11.5px', fontWeight: 600,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-2)',
    fontFamily: 'var(--font-outfit), sans-serif',
    transition: 'all 0.15s',
  },
  interestBtnOn: {
    background: 'rgba(244,114,182,0.10)', color: '#db2777',
    border: '1px solid rgba(244,114,182,0.32)',
  },
  interestCount: {
    fontSize: '11px', color: 'var(--text-2)', fontWeight: 500,
  },

  /* ── Top demandés ── */
  topGrid: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  topCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 16px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--accent-border)',
  },
  topRank: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 500,
    color: 'var(--accent-text)', minWidth: '32px',
  },
  topName: {
    fontSize: '14px', fontWeight: 600, color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const,
  },
  topCat: {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-2)',
    background: 'var(--surface-2)', padding: '1px 8px', borderRadius: '100px',
  },
  topMeta: {
    fontSize: '12px', color: 'var(--text-2)', marginTop: '3px',
  },
  topLink: {
    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
    background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--accent-text)', textDecoration: 'none' as const,
  },

  empty: {
    padding: '32px', borderRadius: '14px',
    background: 'var(--surface)', border: '1px dashed var(--border)',
    textAlign: 'center' as const, fontSize: '13px', color: 'var(--text-muted)',
  },

  /* ── Suggest ── */
  suggestSection: { marginBottom: '24px' },
  suggestBox: {
    padding: 'clamp(20px,3vw,32px)', borderRadius: '18px',
    display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' as const,
  },
  suggestLeft: {
    display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px',
  },
  suggestEmoji: {
    width: '52px', height: '52px', flexShrink: 0,
    background: 'var(--accent-bg-2)', border: '1px solid var(--accent-border-2)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  suggestTitle: {
    fontFamily: 'var(--font-fraunces), serif', fontSize: '17px',
    fontWeight: 500, color: 'var(--text)', margin: 0,
  },
  suggestDesc: {
    fontSize: '13px', color: 'var(--text-2)', marginTop: '6px',
    lineHeight: 1.55, margin: 0, maxWidth: '420px',
  },

  /* legacy (used by additional partners section) */
  additionalSection: {},
  additionalLabel: {},
  additionalGrid: {},
  additionalCard: {},
  additionalTop: {},
  additionalName: {},
  categoryPill: {},
  additionalDesc: {},
}
