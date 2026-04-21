'use client'

import { useState, useMemo, useTransition, useLayoutEffect, useRef } from 'react'
import {
  ArrowUpRight, UsersThree, FacebookLogo, WhatsappLogo,
  Star, MagnifyingGlass, CaretDown, CaretUp, X,
  Check, EyeSlash, WifiHigh,
} from '@phosphor-icons/react'
import { setGroupMembership, restoreAllDismissed } from './actions'

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

type MemberStatus = 'joined' | 'dismissed'

const FEATURED_CATEGORY = 'Groupes Jason & Driing'

const SUPER_CATEGORIES = [
  { id: 'hotes',          label: 'Hôtes LCD',      tags: ['Hôtes LCD', 'Gîtes', 'Investisseurs', 'Animaux'] },
  { id: 'voyageurs',      label: 'Voyageurs',       tags: ['Voyageurs'] },
  { id: 'conciergeries',  label: 'Conciergeries',   tags: ['Conciergeries'] },
  { id: 'regions',        label: 'Régions',         tags: ['Alpes', 'Auvergne', 'Belgique', 'Bourgogne', 'Bretagne', 'Corse', 'Hauts-de-France', 'Île-de-France', 'Montagne', 'Normandie', 'Occitanie', 'PACA', 'Plage', 'Pyrénées', 'Réunion', 'Ski'] },
] as const

function parseTags(tag: string | null): string[] {
  if (!tag) return []
  return tag.split(',').map(t => t.trim()).filter(Boolean)
}

function fmtNum(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `${k % 1 === 0 ? k : k.toFixed(1).replace('.', ',')}k`
  }
  return n.toLocaleString('fr-FR')
}

export default function CommunauteView({
  groups,
  userId,
  initialMemberships,
}: {
  groups: Group[]
  userId: string | null
  initialMemberships: Record<string, MemberStatus>
}) {
  const [search, setSearch]             = useState('')
  const [platformFilter, setPlatform]   = useState<'all' | 'facebook' | 'whatsapp'>('all')
  const [activeCategory, setCategory]   = useState<string | null>(null)
  const [activeRegion, setRegion]       = useState<string | null>(null)
  const [featuredOpen, setFeaturedOpen] = useState(true)
  const [memberships, setMemberships]     = useState(initialMemberships)
  const [showDismissed, setShowDismissed] = useState(false)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  // Restart animations synchronously before first paint so fade-up elements
  // are never stuck at opacity:0 during client-side navigation (React 18 issue).
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const els = container.querySelectorAll<HTMLElement>('.fade-up')
    els.forEach(el => {
      el.style.animationName = 'none'
      void el.offsetWidth
      el.style.animationName = ''
    })
  }, [])

  const joinedGroups = useMemo(
    () => groups.filter(g => memberships[g.id] === 'joined'),
    [groups, memberships]
  )
  const totalReach = joinedGroups.reduce((sum, g) => sum + (g.members_count || 0), 0)
  const dismissedCount = groups.filter(g => memberships[g.id] === 'dismissed').length

  // Régions présentes dans les données (pour le sous-filtre)
  const availableRegions = useMemo(() => {
    const regionTags = SUPER_CATEGORIES.find(c => c.id === 'regions')?.tags ?? []
    const set = new Set<string>()
    groups.forEach(g => parseTags(g.tag).forEach(t => { if (regionTags.includes(t as never)) set.add(t) }))
    return [...set].sort()
  }, [groups])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const catTags = activeCategory
      ? SUPER_CATEGORIES.find(c => c.id === activeCategory)?.tags ?? []
      : []
    return groups.filter(g => {
      if (!showDismissed && memberships[g.id] === 'dismissed') return false
      if (platformFilter !== 'all' && g.platform !== platformFilter) return false
      if (activeRegion && !parseTags(g.tag).includes(activeRegion)) return false
      if (!activeRegion && catTags.length > 0 && !parseTags(g.tag).some(t => catTags.includes(t as never))) return false
      if (!q) return true
      return (
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        parseTags(g.tag).join(' ').toLowerCase().includes(q)
      )
    })
  }, [groups, search, platformFilter, activeCategory, activeRegion, memberships, showDismissed])

  const grouped: Record<string, Group[]> = {}
  filtered.forEach(g => {
    const cat = g.category || 'Général'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(g)
  })

  const featuredGroups  = grouped[FEATURED_CATEGORY] ?? []
  const otherCategories = Object.entries(grouped).filter(([c]) => c !== FEATURED_CATEGORY)
  const isFiltering = search !== '' || platformFilter !== 'all' || activeCategory !== null || activeRegion !== null

  function toggleJoined(groupId: string) {
    const next: MemberStatus | null = memberships[groupId] === 'joined' ? null : 'joined'
    setMemberships(prev => {
      const u = { ...prev }
      if (next === null) delete u[groupId]
      else u[groupId] = next
      return u
    })
    if (userId) startTransition(() => { setGroupMembership(groupId, next) })
  }

  function dismiss(groupId: string) {
    setMemberships(prev => ({ ...prev, [groupId]: 'dismissed' }))
    if (userId) startTransition(() => { setGroupMembership(groupId, 'dismissed') })
  }

  function restore(groupId: string) {
    setMemberships(prev => { const u = { ...prev }; delete u[groupId]; return u })
    if (userId) startTransition(() => { setGroupMembership(groupId, null) })
  }

  function clearFilters() { setSearch(''); setPlatform('all'); setCategory(null); setRegion(null) }

  function renderCard(g: Group, featured = false) {
    const isJoined    = memberships[g.id] === 'joined'
    const isDismissed = memberships[g.id] === 'dismissed'
    const tags        = parseTags(g.tag)
    const isFb        = g.platform === 'facebook'

    return (
      <div
        style={featured ? s.featuredCard : s.card}
        className={featured ? undefined : 'glass-card'}
      >
        {/* Badge masqué */}
        {isDismissed && (
          <div style={s.dismissedBadge}>
            <EyeSlash size={10} />
            Masqué
          </div>
        )}

        {/* Icon + name + tags */}
        <div style={s.cardTop}>
          <div style={{
            ...s.platformIcon,
            background: featured ? 'rgba(255,213,107,0.08)' : isFb ? 'rgba(147,197,253,0.08)' : 'rgba(37,211,102,0.08)',
            border: `1px solid ${featured ? 'rgba(255,213,107,0.18)' : isFb ? 'rgba(147,197,253,0.15)' : 'rgba(37,211,102,0.15)'}`,
          }}>
            {isFb
              ? <FacebookLogo size={18} color={featured ? 'var(--accent-text)' : '#93C5FD'} weight="fill" />
              : <WhatsappLogo size={18} color="#25D366" weight="fill" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={featured ? s.featuredName : s.groupName}>{g.name}</h3>
            {tags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                {tags.map(t => (
                  <span key={t} style={featured ? s.tagPill : s.inlineTag}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {g.description && <p style={s.desc}>{g.description}</p>}

        {/* Member count */}
        {g.members_count > 0 && (
          <div style={s.statRow}>
            <span style={s.statBubble}>
              <UsersThree size={13} color="var(--accent-text)" weight="fill" />
              <strong style={s.statNum}>{fmtNum(g.members_count)}</strong>
              <span style={s.statLbl}>membres</span>
            </span>
            {isJoined && (
              <span style={s.reachBadge}>
                <WifiHigh size={11} weight="fill" />
                Portée active
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={s.actions}>
          <a
            href={g.url} target="_blank" rel="noopener noreferrer"
            style={{ ...s.joinLink, ...(featured ? s.joinLinkFeatured : {}) }}
          >
            Rejoindre <ArrowUpRight size={12} />
          </a>
          {isDismissed ? (
            <button onClick={() => restore(g.id)} style={s.restoreBtn}>Restaurer</button>
          ) : (
            <>
              <button
                onClick={() => toggleJoined(g.id)}
                style={{ ...s.statusBtn, ...(isJoined ? s.statusBtnOn : {}) }}
              >
                <Check size={12} weight={isJoined ? 'bold' : 'regular'} />
                {isJoined ? "J'y suis" : "J'y suis ?"}
              </button>
              {!isJoined && (
                <button onClick={() => dismiss(g.id)} style={s.dismissBtn} title="Pas intéressé">
                  <X size={11} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={s.page}>

      {/* Intro */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          La <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>communauté</em> LCD
        </h2>
        <p style={s.pageDesc}>
          Les meilleurs groupes pour échanger avec d'autres hôtes — et partager vos locations directement avec des voyageurs.
        </p>
      </div>

      {/* Stats banner — visible quand au moins 1 groupe rejoint */}
      {joinedGroups.length > 0 && (
        <div style={s.banner} className="fade-up">
          <div style={s.bannerStat}>
            <WifiHigh size={20} color="#FFD56B" weight="fill" />
            <div>
              <div style={s.bannerLbl}>Portée totale</div>
              <div style={s.bannerVal}>
                {fmtNum(totalReach)} <span style={s.bannerSub}>membres potentiels</span>
              </div>
            </div>
          </div>
          <div style={s.bannerDiv} />
          <div style={s.bannerStat}>
            <UsersThree size={20} color="var(--accent-text)" weight="fill" />
            <div>
              <div style={s.bannerLbl}>Groupes rejoints</div>
              <div style={s.bannerVal}>
                {joinedGroups.length} <span style={s.bannerSub}>groupe{joinedGroups.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          {groups.filter(g => !memberships[g.id]).length > 0 && (
            <>
              <div style={s.bannerDiv} />
              <div style={s.bannerStat}>
                <UsersThree size={20} color="var(--text-3)" />
                <div>
                  <div style={s.bannerLbl}>Non rejoints</div>
                  <div style={{ ...s.bannerVal, color: 'var(--text-2)' }}>
                    {groups.filter(g => !memberships[g.id]).length}{' '}
                    <span style={s.bannerSub}>groupes</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filtres */}
      <div style={s.filtersWrap} className="fade-up">
        {/* Recherche */}
        <div style={s.searchRow}>
          <MagnifyingGlass size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un groupe…"
            style={s.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={s.clearBtn} aria-label="Effacer">
              <X size={11} />
            </button>
          )}
        </div>

        {/* Plateforme */}
        <div style={s.filterLine}>
          <span style={s.filterLbl}>Plateforme</span>
          <div style={s.chipRow}>
            {(['all', 'facebook', 'whatsapp'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                style={{ ...s.chip, ...(platformFilter === p ? s.chipOn : {}) }}
              >
                {p === 'facebook' && <FacebookLogo size={11} weight="fill" />}
                {p === 'whatsapp' && <WhatsappLogo size={11} weight="fill" />}
                {p === 'all' ? 'Tous' : p === 'facebook' ? 'Facebook' : 'WhatsApp'}
              </button>
            ))}
          </div>
        </div>

        {/* Catégories : 4 groupes larges */}
        <div style={s.filterLine}>
          <span style={s.filterLbl}>Catégorie</span>
          <div style={s.chipRow}>
            {SUPER_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(activeCategory === cat.id ? null : cat.id)}
                style={{ ...s.chip, ...(activeCategory === cat.id ? s.chipTag : {}) }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sous-filtre régions — visible seulement quand "Régions" est sélectionné */}
        {activeCategory === 'regions' && availableRegions.length > 0 && (
          <div style={s.filterLine}>
            <span style={{ ...s.filterLbl, color: 'var(--text-muted)' }}>Région</span>
            <div style={s.tagsScroll}>
              {availableRegions.map(r => (
                <button
                  key={r}
                  onClick={() => setRegion(activeRegion === r ? null : r)}
                  style={{ ...s.chip, ...(activeRegion === r ? s.chipOn : {}), flexShrink: 0 }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {isFiltering && (
          <button onClick={clearFilters} style={s.resetLink}>
            <X size={10} /> Effacer les filtres
          </button>
        )}
      </div>

      {/* Aucun résultat */}
      {filtered.length === 0 && isFiltering && (
        <div style={s.empty} className="fade-up">
          <MagnifyingGlass size={28} color="var(--text-muted)" />
          <p>Aucun groupe ne correspond à votre recherche.</p>
          <button onClick={clearFilters} style={s.resetBtn}>Effacer les filtres</button>
        </div>
      )}

      {/* Section Jason & Driing */}
      {featuredGroups.length > 0 && (
        <div style={s.featuredSection} className="fade-up">
          <div style={s.featuredHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={s.featuredBadge}>
                <Star size={11} weight="fill" />
                {FEATURED_CATEGORY}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                {featuredGroups.length} groupe{featuredGroups.length > 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={() => setFeaturedOpen(v => !v)} style={s.collapseBtn}>
              {featuredOpen ? <CaretUp size={12} /> : <CaretDown size={12} />}
              {featuredOpen ? 'Réduire' : 'Voir'}
            </button>
          </div>

          {featuredOpen && (
            <>
              <p style={s.featuredSub}>
                Nos groupes officiels — rejoignez la communauté et partagez vos logements directement
              </p>
              <div className="dash-grid-2">
                {featuredGroups.map((g, i) => (
                  <div key={g.id} className={`fade-up d${i + 1}`}>
                    {renderCard(g, true)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Autres catégories */}
      {otherCategories.map(([category, catGroups]) => (
        <div key={category} style={s.section} className="fade-up">
          <div style={s.sectionLabel}>
            <UsersThree size={14} />
            {category}
            <span style={s.sectionCount}>{catGroups.length}</span>
          </div>
          <div className="dash-grid-2">
            {catGroups.map((g, i) => (
              <div key={g.id} className={`fade-up d${i + 1}`}>
                {renderCard(g)}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Groupes masqués */}
      {dismissedCount > 0 && (
        <div style={s.dismissedBar}>
          <EyeSlash size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '13px', color: 'var(--text-3)', flex: 1 }}>
            {dismissedCount} groupe{dismissedCount > 1 ? 's' : ''} masqué{dismissedCount > 1 ? 's' : ''}
          </span>
          <button onClick={() => setShowDismissed(v => !v)} style={s.showHiddenBtn}>
            {showDismissed ? 'Masquer' : 'Voir'}
          </button>
          <button
            onClick={() => {
              setMemberships(prev => {
                const u = { ...prev }
                Object.keys(u).forEach(k => { if (u[k] === 'dismissed') delete u[k] })
                return u
              })
              setShowDismissed(false)
              if (userId) startTransition(() => { restoreAllDismissed() })
            }}
            style={s.restoreAllBtn}
          >
            Tout restaurer
          </button>
        </div>
      )}

      {/* État vide */}
      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
          <UsersThree size={36} color="var(--text-muted)" />
          <p style={{ marginTop: '12px', fontSize: '14px' }}>Aucun groupe disponible pour l'instant.</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── Styles ─────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page:     { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro:    { marginBottom: '28px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px',
  },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },

  /* Stats banner */
  banner: {
    display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
    padding: '18px 22px', borderRadius: '16px', marginBottom: '32px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.07) 0%, rgba(0,76,63,0.07) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
  },
  bannerStat: { display: 'flex', alignItems: 'center', gap: '12px' },
  bannerDiv:  { width: '1px', height: '36px', background: 'var(--border)', flexShrink: 0 },
  bannerLbl:  { fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' as const },
  bannerVal:  { fontSize: '20px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginTop: '2px' },
  bannerSub:  { fontSize: '13px', fontWeight: 400, color: 'var(--text-2)' },

  /* Filtres */
  filtersWrap: { marginBottom: '36px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  searchRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '14px', fontFamily: 'Outfit, sans-serif',
  } as React.CSSProperties,
  clearBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
    borderRadius: '6px', width: '20px', height: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
  },
  filterLine: { display: 'flex', alignItems: 'center', gap: '10px' },
  filterLbl: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)',
    flexShrink: 0, minWidth: '72px',
  },
  chipRow:  { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  tagsScroll: {
    display: 'flex', gap: '6px',
    overflowX: 'auto', paddingBottom: '4px',
    scrollbarWidth: 'none',
  } as React.CSSProperties,
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '999px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, fontFamily: 'Outfit, sans-serif',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    color: 'var(--text-3)', whiteSpace: 'nowrap' as const,
  },
  chipOn: {
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)',
  },
  chipTag: {
    background: 'rgba(147,197,253,0.1)', border: '1px solid rgba(147,197,253,0.25)',
    color: 'rgba(147,197,253,0.85)',
  },
  resetLink: {
    alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '999px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500, fontFamily: 'Outfit, sans-serif',
    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
    color: 'rgba(239,68,68,0.7)',
  },

  /* Empty */
  empty: {
    textAlign: 'center', padding: '48px 0', color: 'var(--text-3)',
    fontSize: '14px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px',
  },
  resetBtn: {
    padding: '8px 18px', borderRadius: '10px', cursor: 'pointer',
    background: 'rgba(255,213,107,0.08)', border: '1px solid rgba(255,213,107,0.2)',
    color: 'var(--accent-text)', fontSize: '13px',
  },

  /* Featured section */
  featuredSection: {
    marginBottom: '40px', padding: '22px 24px', borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.05) 0%, rgba(255,213,107,0.02) 100%)',
    border: '1px solid rgba(255,213,107,0.15)',
  },
  featuredHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', marginBottom: '6px',
  },
  featuredBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 11px', borderRadius: '999px',
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.25)',
    color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600,
  },
  collapseBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
  },
  featuredSub: {
    fontSize: '13px', color: 'var(--text-3)', fontWeight: 300,
    marginBottom: '20px', marginTop: '4px',
  },
  featuredCard: {
    padding: '18px', borderRadius: '14px',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
    background: 'rgba(255,213,107,0.03)', border: '1px solid rgba(255,213,107,0.1)',
    height: '100%',
  },
  featuredName: {
    fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 400,
    color: 'var(--text)', margin: 0,
  },
  tagPill: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    color: 'var(--accent-text)', background: 'rgba(0,76,63,0.08)',
    border: '1px solid var(--border)', borderRadius: '100px', padding: '2px 8px',
  },

  /* Other sections */
  section:      { marginBottom: '36px' },
  sectionLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.7px',
    textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: '18px',
  },
  sectionCount: {
    fontSize: '10px', padding: '1px 7px', borderRadius: '100px',
    background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
  },
  card: {
    padding: '18px', borderRadius: '16px',
    display: 'flex', flexDirection: 'column' as const, gap: '10px', height: '100%',
  },

  /* Shared card elements */
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  platformIcon: {
    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  groupName: {
    fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 400,
    color: 'var(--text)', margin: 0,
  },
  inlineTag: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '100px',
    background: 'rgba(147,197,253,0.07)', border: '1px solid rgba(147,197,253,0.14)',
    color: 'rgba(147,197,253,0.65)',
  },
  desc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, margin: 0, flex: 1 },

  /* Stats row */
  statRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const },
  statBubble: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 11px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    fontSize: '12px', color: 'var(--text-2)',
  },
  statNum: { fontWeight: 700, fontSize: '14px', color: 'var(--text)' },
  statLbl: { color: 'var(--text-3)', fontSize: '12px' },
  reachBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 500, color: '#34D399',
    background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
    padding: '3px 9px', borderRadius: '100px',
  },

  /* Card actions */
  actions: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginTop: 'auto', flexWrap: 'wrap' as const, paddingTop: '4px',
  },
  joinLink: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '7px 14px', borderRadius: '8px', textDecoration: 'none',
    fontSize: '12px', fontWeight: 600,
    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
    color: 'var(--text-2)',
  },
  joinLinkFeatured: {
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.25)',
    color: 'var(--accent-text)',
  },
  statusBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 500,
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    color: 'var(--text-3)',
  },
  statusBtnOn: {
    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
    color: '#34D399',
  },
  dismissBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer',
    background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
    flexShrink: 0,
  },
  restoreBtn: {
    fontSize: '11px', color: 'var(--text-muted)', background: 'none',
    border: '1px solid var(--border)', padding: '5px 10px',
    borderRadius: '7px', cursor: 'pointer',
  },

  /* Badge masqué sur la carte */
  dismissedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.3px',
    color: 'var(--text-muted)', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '6px',
    padding: '2px 7px', alignSelf: 'flex-start',
  },

  /* Dismissed bar */
  dismissedBar: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 16px', borderRadius: '10px', marginTop: '8px',
    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
  },
  showHiddenBtn: {
    fontSize: '12px', color: 'var(--accent-text)', background: 'none',
    border: '1px solid rgba(255,213,107,0.2)', padding: '4px 10px',
    borderRadius: '6px', cursor: 'pointer',
  },
  restoreAllBtn: {
    fontSize: '12px', color: '#34D399', background: 'rgba(52,211,153,0.08)',
    border: '1px solid rgba(52,211,153,0.2)', padding: '4px 12px',
    borderRadius: '6px', cursor: 'pointer', fontWeight: 500,
  },
}
