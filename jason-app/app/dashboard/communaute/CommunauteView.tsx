'use client'

import { useState, useMemo } from 'react'
import {
  ArrowUpRight, UsersThree, FacebookLogo, WhatsappLogo,
  Tag, Star, MagnifyingGlass, CaretDown, CaretUp, X,
} from '@phosphor-icons/react'

interface Group {
  id: string
  name: string
  platform: 'facebook' | 'whatsapp'
  description: string
  members_count: number
  url: string
  category: string
  tag: string | null
}

const FEATURED_CATEGORY = 'Groupes Jason & Driing'

/** Le champ `tag` accepte des valeurs séparées par virgule : "Bretagne, Normandie" */
function parseTags(tag: string | null): string[] {
  if (!tag) return []
  return tag.split(',').map(t => t.trim()).filter(Boolean)
}

export default function CommunauteView({ groups }: { groups: Group[] }) {
  const [search, setSearch]             = useState('')
  const [platformFilter, setPlatform]   = useState<'all' | 'facebook' | 'whatsapp'>('all')
  const [activeTag, setActiveTag]       = useState<string | null>(null)
  const [featuredOpen, setFeaturedOpen] = useState(true)

  // Tous les tags uniques pour les chips de filtre
  const allTags = useMemo(() => {
    const set = new Set<string>()
    groups.forEach(g => parseTags(g.tag).forEach(t => set.add(t)))
    return [...set].sort()
  }, [groups])

  // Groupes filtrés
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return groups.filter(g => {
      if (platformFilter !== 'all' && g.platform !== platformFilter) return false
      if (activeTag && !parseTags(g.tag).includes(activeTag)) return false
      if (!q) return true
      const tagsStr = parseTags(g.tag).join(' ').toLowerCase()
      return (
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        tagsStr.includes(q)
      )
    })
  }, [groups, search, platformFilter, activeTag])

  const grouped: Record<string, Group[]> = {}
  filtered.forEach(g => {
    const cat = g.category || 'Général'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(g)
  })

  const featuredGroups   = grouped[FEATURED_CATEGORY] ?? []
  const otherCategories  = Object.entries(grouped).filter(([cat]) => cat !== FEATURED_CATEGORY)
  const isFiltering      = search !== '' || platformFilter !== 'all' || activeTag !== null

  function clearFilters() {
    setSearch('')
    setPlatform('all')
    setActiveTag(null)
  }

  return (
    <div style={s.page}>

      {/* ── Intro ── */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          La <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>communauté</em> LCD
        </h2>
        <p style={s.pageDesc}>
          Les meilleurs groupes pour échanger avec d'autres hôtes — et partager vos locations directement avec des voyageurs.
        </p>
      </div>

      {/* ── Recherche + filtres ── */}
      <div style={s.searchBlock} className="fade-up">
        <div style={s.searchWrap}>
          <MagnifyingGlass size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par ville, région, thème…"
            style={s.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={s.clearBtn} aria-label="Effacer">
              <X size={12} />
            </button>
          )}
        </div>

        <div style={s.filterRow}>
          {/* Plateforme */}
          <button onClick={() => setPlatform('all')} style={{ ...s.chip, ...(platformFilter === 'all' ? s.chipActive : {}) }}>
            Tous
          </button>
          <button onClick={() => setPlatform('facebook')} style={{ ...s.chip, ...(platformFilter === 'facebook' ? s.chipActive : {}) }}>
            <FacebookLogo size={11} weight="fill" /> Facebook
          </button>
          <button onClick={() => setPlatform('whatsapp')} style={{ ...s.chip, ...(platformFilter === 'whatsapp' ? s.chipActive : {}) }}>
            <WhatsappLogo size={11} weight="fill" /> WhatsApp
          </button>

          {/* Séparateur + tags dynamiques */}
          {allTags.length > 0 && <span style={s.chipDivider} />}
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              style={{ ...s.chip, ...(activeTag === t ? s.chipTag : {}) }}
            >
              <Tag size={10} /> {t}
            </button>
          ))}

          {/* Reset si filtre actif */}
          {isFiltering && (
            <button onClick={clearFilters} style={s.chipReset}>
              <X size={10} /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* ── Aucun résultat ── */}
      {filtered.length === 0 && isFiltering && (
        <div style={s.emptySearch} className="fade-up">
          <MagnifyingGlass size={30} color="var(--text-muted)" />
          <p>Aucun groupe ne correspond à votre recherche.</p>
          <button onClick={clearFilters} style={s.resetBtn}>Effacer les filtres</button>
        </div>
      )}

      {/* ── Section mise en avant : Groupes Jason & Driing ── */}
      {featuredGroups.length > 0 && (
        <div style={s.featuredSection} className="fade-up">
          {/* Header avec badge + bouton réduire */}
          <div style={s.featuredHeaderRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <span style={s.featuredBadge}>
                <Star size={11} weight="fill" />
                {FEATURED_CATEGORY}
              </span>
              {!featuredOpen && (
                <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                  {featuredGroups.length} groupe{featuredGroups.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button onClick={() => setFeaturedOpen(v => !v)} style={s.collapseBtn}>
              {featuredOpen ? <CaretUp size={12} /> : <CaretDown size={12} />}
              {featuredOpen ? 'Réduire' : 'Voir'}
            </button>
          </div>

          {/* Contenu dépliable */}
          {featuredOpen && (
            <>
              <p style={s.featuredSubtitle}>
                Nos groupes officiels — rejoignez la communauté et partagez vos logements directement
              </p>
              <div className="dash-grid-2">
                {featuredGroups.map((g, i) => (
                  <div key={g.id} style={s.featuredCard} className={`fade-up d${i + 1}`}>
                    <div style={s.featuredCardTop}>
                      <div style={s.featuredIconWrap}>
                        <FacebookLogo size={20} color="#FFD56B" weight="fill" />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {parseTags(g.tag).map(t => (
                          <span key={t} style={s.tagPill}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <h3 style={s.featuredName}>{g.name}</h3>
                    <p style={s.featuredDesc}>{g.description}</p>
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ fontSize: '13px', padding: '9px 18px', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
                    >
                      Rejoindre <ArrowUpRight size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Autres catégories ── */}
      {otherCategories.map(([category, catGroups]) => (
        <div key={category} style={s.sectionBlock} className="fade-up">
          <div style={s.sectionLabel}>
            <UsersThree size={14} />
            {category}
            <span style={s.sectionCount}>{catGroups.length}</span>
          </div>

          <div className="dash-grid-2">
            {catGroups.map((g, i) => {
              const isFb = g.platform === 'facebook'
              const tags = parseTags(g.tag)
              return (
                <div key={g.id} style={s.card} className={`glass-card fade-up d${i + 1}`}>
                  <div style={s.cardHead}>
                    <div style={{
                      ...s.platformIcon,
                      background: isFb ? 'rgba(147,197,253,0.08)' : 'rgba(37,211,102,0.08)',
                      border: `1px solid ${isFb ? 'rgba(147,197,253,0.15)' : 'rgba(37,211,102,0.15)'}`,
                    }}>
                      {isFb
                        ? <FacebookLogo size={20} color="#93C5FD" weight="fill" />
                        : <WhatsappLogo size={20} color="#25D366" weight="fill" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={s.groupName}>{g.name}</h3>
                      {g.members_count > 0 && (
                        <div style={s.memberCount}>
                          <UsersThree size={12} />
                          {g.members_count.toLocaleString('fr-FR')} membres
                        </div>
                      )}
                    </div>
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ fontSize: '12px', padding: '7px 14px', flexShrink: 0 }}
                    >
                      Rejoindre <ArrowUpRight size={13} />
                    </a>
                  </div>
                  {g.description && <p style={s.desc}>{g.description}</p>}
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {tags.map(t => (
                        <span key={t} style={s.inlineTag}>
                          <Tag size={9} /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ── État vide (aucun groupe en base) ── */}
      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: '14px' }}>
          <UsersThree size={36} color="var(--text-muted)" />
          <p style={{ marginTop: '12px' }}>Aucun groupe disponible pour l'instant.</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── Styles ─────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page:      { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro:     { marginBottom: '28px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc:  { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },

  /* Recherche */
  searchBlock: { marginBottom: '36px' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 16px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    marginBottom: '12px',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '14px', fontFamily: 'Outfit, sans-serif',
  } as React.CSSProperties,
  clearBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
    borderRadius: '6px', width: '22px', height: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
  },

  /* Filtres */
  filterRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '999px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, fontFamily: 'Outfit, sans-serif',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    color: 'var(--text-3)',
  },
  chipActive: {
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)',
  },
  chipTag: {
    background: 'rgba(147,197,253,0.1)', border: '1px solid rgba(147,197,253,0.25)',
    color: 'rgba(147,197,253,0.85)',
  },
  chipReset: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '5px 11px', borderRadius: '999px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, fontFamily: 'Outfit, sans-serif',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
    color: 'rgba(239,68,68,0.7)',
  },
  chipDivider: {
    display: 'inline-block', width: '1px', height: '16px',
    background: 'var(--border)', flexShrink: 0, margin: '0 2px',
  },

  /* Aucun résultat */
  emptySearch: {
    textAlign: 'center', padding: '48px 0', color: 'var(--text-3)',
    fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
  },
  resetBtn: {
    padding: '8px 18px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    color: 'var(--accent-text)', fontSize: '13px', cursor: 'pointer',
  },

  /* Section featured */
  featuredSection: {
    marginBottom: '40px', padding: '22px 24px', borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.05) 0%, rgba(255,213,107,0.02) 100%)',
    border: '1px solid rgba(255,213,107,0.15)',
  },
  featuredHeaderRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', marginBottom: '6px',
  },
  featuredBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 11px', borderRadius: '999px',
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.25)',
    color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px',
  },
  collapseBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
  },
  featuredSubtitle: {
    fontSize: '13px', color: 'var(--text-3)', fontWeight: 300,
    marginBottom: '20px', marginTop: '4px',
  },
  featuredCard: {
    padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '165px',
    background: 'rgba(255,213,107,0.03)', border: '1px solid rgba(255,213,107,0.1)',
  },
  featuredCardTop:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' },
  featuredIconWrap: {
    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tagPill: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    color: 'rgba(255,213,107,0.7)', background: 'rgba(255,213,107,0.07)',
    border: '1px solid rgba(255,213,107,0.14)', borderRadius: '100px', padding: '2px 9px',
  },
  featuredName: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  featuredDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, flex: 1, margin: 0 },

  /* Sections régulières */
  sectionBlock: { marginBottom: '36px' },
  sectionLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.7px',
    textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '18px',
  },
  sectionCount: {
    fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '100px',
    background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
  },
  card:         { padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardHead:     { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  platformIcon: {
    width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  groupName:    { fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 400, color: 'var(--text)', margin: 0 },
  memberCount:  { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' },
  inlineTag: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '100px',
    background: 'rgba(147,197,253,0.07)', border: '1px solid rgba(147,197,253,0.14)',
    color: 'rgba(147,197,253,0.65)',
  },
  desc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, margin: 0 },
}
