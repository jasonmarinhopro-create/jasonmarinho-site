'use client'

import { useState, useMemo, useTransition, useLayoutEffect, useRef } from 'react'
import {
  ArrowUpRight, UsersThree, FacebookLogo,
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

// Mapping adresse (mots-clés) → tag région des groupes FB
const REGION_KEYWORDS: Record<string, string[]> = {
  'Île-de-France':   ['paris', 'île-de-france', 'ile-de-france', 'idf', ' 75', ' 77', ' 78', ' 91', ' 92', ' 93', ' 94', ' 95'],
  'PACA':            ['paca', 'provence', 'marseille', 'nice', 'aix-en-provence', 'cannes', 'avignon', 'toulon', 'antibes', ' 13', ' 83', ' 84', ' 04', ' 05', ' 06'],
  'Bretagne':        ['bretagne', 'rennes', 'brest', 'quimper', 'lorient', 'vannes', 'saint-malo', 'dinard', ' 22', ' 29', ' 35', ' 56'],
  'Normandie':       ['normandie', 'rouen', 'caen', 'le havre', 'cherbourg', 'évreux', 'deauville', 'honfleur', ' 14', ' 27', ' 50', ' 61', ' 76'],
  'Occitanie':       ['occitanie', 'toulouse', 'montpellier', 'nîmes', 'nimes', 'perpignan', 'narbonne', 'sète', ' 31', ' 34', ' 11', ' 66', ' 30', ' 81', ' 82', ' 09'],
  'Hauts-de-France': ['hauts-de-france', 'lille', 'amiens', 'roubaix', 'tourcoing', 'arras', 'calais', ' 59', ' 62', ' 60', ' 02', ' 80'],
  'Auvergne':        ['auvergne', 'clermont-ferrand', 'clermont', 'vichy', ' 63', ' 15', ' 43', ' 03'],
  'Bourgogne':       ['bourgogne', 'dijon', 'beaune', 'nevers', 'mâcon', 'macon', 'auxerre', ' 21', ' 58', ' 71', ' 89'],
  'Corse':           ['corse', 'ajaccio', 'bastia', 'porto-vecchio', 'calvi', 'bonifacio', ' 20', ' 2a', ' 2b'],
  'Réunion':         ['réunion', 'reunion', 'saint-denis', 'saint-pierre', 'saint-paul', ' 974'],
  'Belgique':        ['belgique', 'belgium', 'bruxelles', 'brussels', 'liège', 'anvers', 'antwerpen', 'gand', 'ghent', 'namur'],
  'Alpes':           ['alpes', 'chamonix', 'megève', 'megeve', 'grenoble', 'annecy', 'savoie', 'isère', 'haute-savoie', 'tignes', 'val d\'isère', 'val d isere', 'val thorens', 'courchevel', ' 73', ' 74', ' 38'],
  'Pyrénées':        ['pyrénées', 'pyrenees', 'pau', 'tarbes', 'lourdes', 'biarritz', ' 64', ' 65'],
  'Montagne':        ['montagne', 'station de ski', 'massif', 'morzine', 'avoriaz', 'la plagne', 'les arcs', 'serre-chevalier'],
  'Plage':           ['plage', 'côte d\'azur', 'cote d azur', 'arcachon', 'biarritz', 'la baule', 'cap d\'agde', 'cap ferret'],
  'Ski':             ['ski', 'station', 'chamonix', 'megève', 'megeve', 'val thorens', 'courchevel', 'tignes', 'val d\'isère'],
}

function detectRegions(adresses: string[]): Set<string> {
  const detected = new Set<string>()
  for (const addr of adresses) {
    const text = ' ' + addr.toLowerCase() + ' '
    for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          detected.add(region)
          break
        }
      }
    }
  }
  return detected
}

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
  userAdresses,
}: {
  groups: Group[]
  userId: string | null
  initialMemberships: Record<string, MemberStatus>
  userAdresses: string[]
}) {
  const [search, setSearch]             = useState('')
  const [activeCategory, setCategory]   = useState<string | null>(null)
  const [activeRegion, setRegion]       = useState<string | null>(null)
  const [featuredOpen, setFeaturedOpen] = useState(false)
  const [memberships, setMemberships]     = useState(initialMemberships)
  const [showDismissed, setShowDismissed] = useState(false)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  // Force all fade-up elements visible after every render.
  // animation-fill-mode:both sets opacity:0 before the animation fires;
  // React 18 client-side navigation can prevent animations from firing → black screen.
  // Running with no deps array ensures new elements from state changes (e.g. "Voir" click) are also fixed.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.querySelectorAll<HTMLElement>('.fade-up').forEach(el => {
      el.style.animation = 'none'
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
  })

  const joinedGroups = useMemo(
    () => groups.filter(g => memberships[g.id] === 'joined'),
    [groups, memberships]
  )
  const totalReach = joinedGroups.reduce((sum, g) => sum + (g.members_count || 0), 0)
  const dismissedCount = groups.filter(g => memberships[g.id] === 'dismissed').length

  // Total possible (Facebook only, ni rejoint ni dismissed)
  const fbGroups = groups.filter(g => g.platform === 'facebook')
  const totalFbReach = fbGroups.reduce((sum, g) => sum + (g.members_count || 0), 0)
  const coveragePct = totalFbReach > 0 ? Math.round((totalReach / totalFbReach) * 100) : 0
  const unexploitedReach = fbGroups
    .filter(g => !memberships[g.id])
    .reduce((sum, g) => sum + (g.members_count || 0), 0)

  // Régions détectées depuis les adresses des logements de l'utilisateur
  const detectedRegions = useMemo(() => detectRegions(userAdresses), [userAdresses])

  // "Pour toi" : top 4 groupes recommandés
  // 1. Si régions détectées : groupes correspondants non rejoints / non dismissed
  // 2. Sinon : top 4 groupes (par members_count) non rejoints, hors Driing
  const recommendedGroups = useMemo(() => {
    const candidates = fbGroups.filter(g =>
      !memberships[g.id] && g.category !== FEATURED_CATEGORY
    )
    if (detectedRegions.size > 0) {
      const matched = candidates.filter(g => {
        const tags = parseTags(g.tag)
        return tags.some(t => detectedRegions.has(t))
      })
      if (matched.length > 0) {
        return matched.sort((a, b) => (b.members_count ?? 0) - (a.members_count ?? 0)).slice(0, 4)
      }
    }
    // Fallback : top groupes
    return candidates.sort((a, b) => (b.members_count ?? 0) - (a.members_count ?? 0)).slice(0, 4)
  }, [fbGroups, memberships, detectedRegions])

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
      // Facebook only — les groupes WhatsApp ne sont plus affichés
      if (g.platform !== 'facebook') return false
      if (!showDismissed && memberships[g.id] === 'dismissed') return false
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
  }, [groups, search, activeCategory, activeRegion, memberships, showDismissed])

  const grouped: Record<string, Group[]> = {}
  filtered.forEach(g => {
    const cat = g.category || 'Général'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(g)
  })

  const featuredGroups  = grouped[FEATURED_CATEGORY] ?? []
  const otherCategories = Object.entries(grouped).filter(([c]) => c !== FEATURED_CATEGORY)
  const isFiltering = search !== '' || activeCategory !== null || activeRegion !== null

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

  function clearFilters() { setSearch(''); setCategory(null); setRegion(null) }

  function renderCard(g: Group, featured = false) {
    const isJoined    = memberships[g.id] === 'joined'
    const isDismissed = memberships[g.id] === 'dismissed'
    const tags        = parseTags(g.tag)

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
            background: featured ? 'rgba(255,213,107,0.08)' : 'rgba(24,119,242,0.08)',
            border: `1px solid ${featured ? 'rgba(255,213,107,0.18)' : 'rgba(24,119,242,0.18)'}`,
          }}>
            <FacebookLogo size={18} color={featured ? 'var(--accent-text)' : '#1877F2'} weight="fill" />
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
    <div ref={containerRef} style={s.page} className="communaute-no-fade">

      {/* Intro */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          Groupes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Facebook</em>
        </h2>
        <p style={s.pageDesc}>
          Étends ta visibilité commerciale en rejoignant les groupes où voyagent tes futurs clients.
          Rejoins-en quelques-uns ciblés pour démultiplier ta portée — sans effort.
        </p>
      </div>

      {/* Stats banner — toujours visible */}
      <div style={s.banner} className="fade-up">
        <div style={s.bannerStat}>
          <WifiHigh size={20} color="#15803d" weight="fill" />
          <div>
            <div style={s.bannerLbl}>Portée active</div>
            <div style={{ ...s.bannerVal, color: '#15803d' }}>
              {fmtNum(totalReach)} <span style={s.bannerSub}>voyageurs touchés</span>
            </div>
          </div>
        </div>
        <div style={s.bannerDiv} className="communaute-banner-div" />
        <div style={s.bannerStat}>
          <UsersThree size={20} color="var(--accent-text)" weight="fill" />
          <div>
            <div style={s.bannerLbl}>Couverture</div>
            <div style={s.bannerVal}>
              {coveragePct}% <span style={s.bannerSub}>de la portée totale</span>
            </div>
            <div style={{ ...s.coverageBar, marginTop: '6px' }}>
              <div style={{ ...s.coverageFill, width: `${coveragePct}%` }} />
            </div>
          </div>
        </div>
        {unexploitedReach > 0 && (
          <>
            <div style={s.bannerDiv} className="communaute-banner-div" />
            <div style={s.bannerStat}>
              <UsersThree size={20} color="#d97706" weight="fill" />
              <div>
                <div style={s.bannerLbl}>Potentiel restant</div>
                <div style={{ ...s.bannerVal, color: '#d97706' }}>
                  +{fmtNum(unexploitedReach)} <span style={s.bannerSub}>voyageurs à atteindre</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pour toi : recommandations contextuelles */}
      {recommendedGroups.length > 0 && !isFiltering && (
        <div style={s.recommendedSection} className="fade-up">
          <div style={s.recommendedHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={14} weight="fill" color="var(--accent-text)" />
              <span style={s.recommendedLabel}>
                {detectedRegions.size > 0 ? 'Recommandés pour toi' : 'À fort potentiel'}
              </span>
              {detectedRegions.size > 0 && (
                <span style={s.recommendedRegions}>
                  {Array.from(detectedRegions).slice(0, 3).join(' · ')}
                </span>
              )}
            </div>
            <span style={s.recommendedSub}>
              {detectedRegions.size > 0
                ? 'Détectés depuis tes logements'
                : 'Les groupes les plus suivis que tu n\'as pas encore rejoints'
              }
            </span>
          </div>
          <div className="dash-grid-2">
            {recommendedGroups.map(g => (
              <div key={g.id}>
                {renderCard(g, false)}
              </div>
            ))}
          </div>
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

        {/* Catégories : 4 groupes larges */}
        <div style={s.filterLine} className="communaute-filter-line">
          <span style={s.filterLbl} className="filter-lbl">Catégorie</span>
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
          <div style={s.filterLine} className="communaute-filter-line">
            <span style={{ ...s.filterLbl, color: 'var(--text-muted)' }} className="filter-lbl">Région</span>
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

      {/* Communauté Driing — section sobre en bas */}
      {featuredGroups.length > 0 && (
        <div style={s.section} className="fade-up">
          <button
            onClick={() => setFeaturedOpen(v => !v)}
            style={s.driingHeader}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UsersThree size={14} color="var(--text-2)" />
              <span style={s.sectionLabelSober}>Communauté Driing</span>
              <span style={s.sectionCount}>{featuredGroups.length}</span>
            </div>
            <span style={s.driingToggle}>
              {featuredOpen ? <CaretUp size={11} /> : <CaretDown size={11} />}
              {featuredOpen ? 'Réduire' : 'Voir'}
            </span>
          </button>
          {featuredOpen && (
            <div className="dash-grid-2" style={{ marginTop: '14px' }}>
              {featuredGroups.map(g => (
                <div key={g.id}>
                  {renderCard(g, false)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
    fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(26px,3vw,38px)',
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
  coverageBar: {
    height: '5px', background: 'var(--surface-2)', borderRadius: '3px',
    overflow: 'hidden' as const, width: '100%', maxWidth: '180px',
  },
  coverageFill: {
    height: '100%', background: 'linear-gradient(90deg, var(--accent-text), #15803d)',
    borderRadius: '3px', transition: 'width 0.4s',
  },

  /* Filtres */
  filtersWrap: { marginBottom: '36px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  searchRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '12px',
    background: 'var(--surface)', border: '1px solid var(--border)',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-outfit), sans-serif',
  } as React.CSSProperties,
  clearBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)',
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
    fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-outfit), sans-serif',
    background: 'var(--surface)', border: '1px solid var(--border-2)',
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
    fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-outfit), sans-serif',
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
    background: 'var(--surface)', border: '1px solid var(--border)',
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
    fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', fontWeight: 400,
    color: 'var(--text)', margin: 0,
  },
  tagPill: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px',
    color: 'var(--accent-text)', background: 'rgba(0,76,63,0.08)',
    border: '1px solid var(--border)', borderRadius: '100px', padding: '2px 8px',
  },

  /* Pour toi recommendations */
  recommendedSection: {
    marginBottom: '36px',
    padding: '20px 22px',
    borderRadius: '16px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
  },
  recommendedHeader: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
    marginBottom: '14px',
  },
  recommendedLabel: {
    fontSize: '13px', fontWeight: 700, color: 'var(--accent-text)',
    letterSpacing: '0.3px',
  },
  recommendedRegions: {
    fontSize: '11.5px', fontWeight: 500, color: 'var(--text-2)',
    padding: '2px 8px', borderRadius: '100px',
    background: 'var(--accent-bg-2)',
    border: '1px solid var(--accent-border-2)',
  },
  recommendedSub: {
    fontSize: '12px', color: 'var(--text-2)', fontWeight: 400,
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
    background: 'var(--surface)', color: 'var(--text-muted)',
  },
  sectionLabelSober: {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase' as const, color: 'var(--text-2)',
  },
  driingHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    background: 'var(--surface)', border: '1px dashed var(--border)',
    cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif',
  },
  driingToggle: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-3)',
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
    fontFamily: 'var(--font-fraunces), serif', fontSize: '15px', fontWeight: 400,
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
    background: 'var(--surface)', border: '1px solid var(--border)',
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
    background: 'var(--surface)', border: '1px solid var(--border)',
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
    background: 'var(--surface)', border: '1px solid var(--border)',
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
    background: 'var(--surface)', border: '1px solid var(--border)',
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
