'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'

// useLayoutEffect emet un warning cote SSR — la variante isomorphe s'y
// replie sur useEffect, cote client on garde useLayoutEffect pour ecrire
// le filtre AVANT peinture (elimine le flicker Tous → sauvegarde).
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
import Link from 'next/link'
import ComparisonTable from './ComparisonTable'
import HubHero, { HeroEm, heroCard } from '@/components/dashboard/HubHero'
import Resources from './Resources'
import AskQuestionCard from '@/components/chez-nous/AskQuestionCard'
import {
  HouseLine, Coffee, Buildings, Handshake, Sparkle,
  ArrowRight, ArrowUpRight, BookOpen, Calculator, MagnifyingGlass,
} from '@phosphor-icons/react/dist/ssr'

// Type local, la data + le rendu des cards vivent dans GuideCards.tsx (server)
type ProfileFilter = 'all' | 'commun' | 'gites' | 'chambres' | 'conciergerie' | 'direct'

// Couleurs uniquement (sans icônes) pour le rendu des filter tabs.
// La version complète avec icônes vit dans GuideCards.tsx.
const PROFILE_DEFS: Record<Exclude<ProfileFilter, 'all'>, { color: string; bg: string }> = {
  commun:       { color: 'var(--accent-text)', bg: 'var(--accent-bg)' },
  gites:        { color: '#8A5A12', bg: 'rgba(255,213,107,0.20)' },
  chambres:     { color: '#B83A7C', bg: 'rgba(244,114,182,0.14)' },
  conciergerie: { color: '#6E5446', bg: 'rgba(139,109,94,0.14)' },
  direct:       { color: '#2F7D52', bg: 'rgba(47,158,91,0.12)' },
}

const FILTER_TABS: { id: ProfileFilter; label: string; Icon: React.ElementType | null }[] = [
  { id: 'all',          label: 'Tous les profils',    Icon: null },
  { id: 'commun',       label: 'Essentiels',          Icon: Sparkle },
  { id: 'gites',        label: 'Gîtes',               Icon: HouseLine },
  { id: 'chambres',     label: "Chambres d'hôtes",    Icon: Coffee },
  { id: 'conciergerie', label: 'Conciergeries',       Icon: Buildings },
  { id: 'direct',       label: 'Réservation directe', Icon: Handshake },
]

const GLOSSARY: { term: string; def: string }[] = [
  { term: 'LCD', def: 'Location de Courte Durée, location meublée touristique de moins de 30 jours.' },
  { term: 'LMNP', def: 'Loueur en Meublé Non Professionnel, statut fiscal pour la majorité des hôtes (revenus < 23 000 € OU < 50 % des revenus du foyer).' },
  { term: 'LMP', def: 'Loueur en Meublé Professionnel, au-delà de 23 000 € de recettes ET > 50 % des revenus du foyer ; régime social et fiscal différent.' },
  { term: 'EI', def: 'Entreprise Individuelle, création gratuite, régime travailleur non salarié, responsabilité illimitée par défaut.' },
  { term: 'SASU', def: 'Société par Actions Simplifiée Unipersonnelle, assimilé-salarié, responsabilité limitée au capital, optimisation salaire/dividendes.' },
  { term: 'Micro-BIC', def: 'Régime micro pour les Bénéfices Industriels et Commerciaux, abattement forfaitaire (30 % non classé, 50 % classé ou chambres d\'hôtes) sans déduction réelle.' },
  { term: 'Régime réel', def: 'Régime fiscal qui permet de déduire toutes les charges réelles (amortissement, intérêts, travaux), souvent plus avantageux > 30 k€/an.' },
  { term: 'Atout France', def: 'Organisme qui classe les meublés de tourisme de 1 à 5 étoiles ; classement valable 5 ans, donne accès à l\'abattement micro-BIC de 50 % (au lieu de 30 %).' },
  { term: 'Loi Le Meur', def: 'Loi de 2024 qui a aligné la fiscalité des meublés de tourisme non classés sur celle des LLD (abattement 30 %, plafond 15 000 €).' },
  { term: 'Loi Hoguet', def: 'Loi de 1970 qui encadre les professionnels de l\'immobilier, s\'applique aux conciergeries qui encaissent les loyers pour le compte du propriétaire.' },
  { term: 'ERP', def: 'Établissement Recevant du Public, règles de sécurité incendie strictes ; bascule à partir de 5 chambres ou 15 personnes en chambres d\'hôtes.' },
  { term: 'RC Pro', def: 'Responsabilité Civile Professionnelle, couvre les dommages causés à un tiers dans l\'exercice de l\'activité ; obligatoire pour les conciergeries.' },
  { term: 'DPE', def: 'Diagnostic de Performance Énergétique, classe le logement de A à G ; les G sont interdits à la location depuis 2025, F en 2028, E en 2034.' },
  { term: 'HACCP', def: 'Hazard Analysis Critical Control Point, démarche d\'hygiène alimentaire applicable aux chambres d\'hôtes servant un petit-déjeuner.' },
  { term: 'PMR', def: 'Personne à Mobilité Réduite, l\'accessibilité PMR est obligatoire pour les ERP (chambres d\'hôtes > 5 chambres).' },
  { term: 'GMB', def: 'Google My Business (devenu Google Business Profile), fiche gratuite indispensable pour la visibilité locale et la réservation directe.' },
  { term: 'Channel manager', def: 'Logiciel qui synchronise calendriers, prix et messages entre Airbnb, Booking, Vrbo, Driing et site propre (Smoobu, Lodgify, Hospitable…).' },
  { term: 'Aircover', def: 'Assurance dommages incluse par Airbnb pour les hôtes, couverture limitée, ne remplace pas une vraie assurance LCD.' },
  { term: 'Cerfa 14004*04', def: 'Formulaire de déclaration en mairie pour la mise en location d\'un meublé de tourisme, obligatoire avant la 1ère location.' },
]

function Glossaire() {
  const [open, setOpen] = useState(false)
  return (
    <div style={s.glossaireWrap} className="fade-up">
      <button
        onClick={() => setOpen(o => !o)}
        style={s.glossaireToggle}
        aria-expanded={open}
      >
        <span style={s.glossaireToggleLeft}>
          <BookOpen size={16} weight="fill" />
          <span>Glossaire, {GLOSSARY.length} termes essentiels</span>
        </span>
        <span style={{ ...s.glossaireChevron, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ArrowRight size={14} weight="bold" />
        </span>
      </button>
      {open && (
        <div style={s.glossaireList}>
          {GLOSSARY.map(g => (
            <div key={g.term} style={s.glossaireItem}>
              <div style={s.glossaireTerm}>{g.term}</div>
              <div style={s.glossaireDef}>{g.def}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface GuideUIProps {
  /** Cards rendues côté serveur (GuideCards.tsx), passées depuis page.tsx */
  guideCards: React.ReactNode
  /** Nombre de fiches (GUIDE_CARD_COUNT), affiché dans le hero */
  cardCount: number
}

export default function GuideUI({ guideCards, cardCount }: GuideUIProps) {
  const [activeFilter, setActiveFilter] = useState<ProfileFilter>('all')
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState<number>(-1) // -1 = pas encore mesuré
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const saved = localStorage.getItem('guide-filter') as ProfileFilter | null
    if (saved && ['all', 'commun', 'gites', 'chambres', 'conciergerie', 'direct'].includes(saved)) {
      setActiveFilter(saved)
    }
  }, [])

  function handleFilter(id: ProfileFilter) {
    setActiveFilter(id)
    localStorage.setItem('guide-filter', id)
  }

  // Filtre DOM : les cards sont rendues server-side avec data-profile + data-search.
  // On toggle leur display selon le filtre actif et la recherche.
  useEffect(() => {
    const container = cardsContainerRef.current
    if (!container) return
    const cards = container.querySelectorAll<HTMLElement>('[data-guide-card]')
    const q = search.trim().toLowerCase()
    let visible = 0
    cards.forEach(card => {
      const profile = card.dataset.profile
      const text = card.dataset.search ?? ''
      const matchProfile = activeFilter === 'all' || profile === activeFilter
      const matchSearch = !q || text.includes(q)
      const show = matchProfile && matchSearch
      card.style.display = show ? '' : 'none'
      if (show) visible++
    })
    setVisibleCount(visible)
  }, [activeFilter, search])

  const q = search.trim().toLowerCase()

  return (
    <div style={s.page} className="guide-no-fade">

      {/* Hero (sept. 2026, même gabarit vert que Formations et Trouver des
          voyageurs). Les 3 « Par où commencer ? » sont des raccourcis de filtre. */}
      <HubHero
        eyebrowIcon={<BookOpen size={14} weight="fill" />}
        eyebrow="Guide LCD"
        title={<>Les règles de ta location, <HeroEm>sans jargon</HeroEm></>}
        desc="Gîte, chambres d’hôtes, conciergerie ou réservation directe : chaque activité a ses obligations et sa fiscalité. Chaque fiche renvoie vers l’outil de ton espace qui t’aide à t’y conformer."
        aside={
          <div style={{ ...heroCard, flex: '1 1 240px' }}>
            <span style={s.asideStat}>{cardCount}</span>
            <span style={s.asideMeta}>fiches pratiques, pour 5 profils d&apos;hôtes</span>
            <span style={{ ...s.updatedBadge, alignSelf: 'flex-start' }}>
              <span style={s.updatedDot} />
              Mis à jour avril 2026
            </span>
          </div>
        }
      >
        {!q && activeFilter === 'all' && (
          <>
            <div style={s.parcoursLabel}>Par où commencer ?</div>
            <div style={s.parcoursList}>
              <button onClick={() => handleFilter('gites')} style={s.parcoursCard}>
                <span style={{ ...s.parcoursIcon, background: 'rgba(255,213,107,0.20)', color: '#8A5A12' }}>
                  <HouseLine size={18} weight="fill" />
                </span>
                <div>
                  <div style={s.parcoursTitle}>Je débute en gîte</div>
                  <div style={s.parcoursDesc}>Statut, fiscalité, obligations légales</div>
                </div>
              </button>
              <button onClick={() => handleFilter('direct')} style={s.parcoursCard}>
                <span style={{ ...s.parcoursIcon, background: 'rgba(47,158,91,0.12)', color: '#2F7D52' }}>
                  <Handshake size={18} weight="fill" />
                </span>
                <div>
                  <div style={s.parcoursTitle}>Je passe à la résa directe</div>
                  <div style={s.parcoursDesc}>Contrat, paiement, visibilité</div>
                </div>
              </button>
              <button onClick={() => handleFilter('conciergerie')} style={s.parcoursCard}>
                <span style={{ ...s.parcoursIcon, background: 'rgba(139,109,94,0.14)', color: '#6E5446' }}>
                  <Buildings size={18} weight="fill" />
                </span>
                <div>
                  <div style={s.parcoursTitle}>Je structure ma conciergerie</div>
                  <div style={s.parcoursDesc}>Hoguet, équipe, mandats, scaling</div>
                </div>
              </button>
            </div>
          </>
        )}
      </HubHero>

      {/* Recherche */}
      <div style={s.searchWrap} className="fade-up d1">
        <span style={s.searchIconWrap}>
          <MagnifyingGlass size={15} weight="bold" />
        </span>
        <input
          type="text"
          placeholder="Rechercher : DPE, Hoguet, RGPD…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.searchInput}
        />
        {search && (
          <button onClick={() => setSearch('')} style={s.searchClear} aria-label="Effacer">
            ×
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={s.filterWrap} className="fade-up d1">
        {FILTER_TABS.map(tab => {
          const Icon = tab.Icon
          const isActive = activeFilter === tab.id
          const def = tab.id !== 'all' ? PROFILE_DEFS[tab.id as Exclude<ProfileFilter, 'all'>] : null
          return (
            <button
              key={tab.id}
              onClick={() => handleFilter(tab.id)}
              style={{
                ...s.filterTab,
                ...(isActive ? {
                  background: def ? def.bg : 'rgba(0,76,63,0.15)',
                  borderColor: def ? `${def.color}70` : 'var(--accent-text)',
                  color: def ? def.color : 'var(--accent-text)',
                } : {}),
              }}
            >
              {Icon && <Icon size={13} weight="fill" />}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Cards, rendues server-side, filtrées via DOM data-attributes */}
      <div ref={cardsContainerRef}>
        {guideCards}
      </div>

      {visibleCount === 0 && (
        <div style={s.emptyState} className="fade-up">
          <MagnifyingGlass size={28} color="var(--text-3)" weight="thin" />
          <div style={s.emptyTitle}>Aucun résultat pour « {search} »</div>
          <div style={s.emptyDesc}>Essaie un mot-clé plus court ou change de profil.</div>
          <button onClick={() => setSearch('')} style={s.emptyBtn}>Effacer la recherche</button>
        </div>
      )}

      {/* Tableau comparatif des 4 profils */}
      <ComparisonTable />

      {/* Teaser : les simulateurs ont leur propre page */}
      <Link href="/dashboard/simulateurs" style={s.calcTeaser} className="fade-up glass-card">
        <div style={s.calcTeaserIcon}>
          <Calculator size={20} weight="fill" />
        </div>
        <div style={s.calcTeaserContent}>
          <div style={s.calcTeaserTitle}>Outils de simulation</div>
          <div style={s.calcTeaserDesc}>
            Calcule ta fiscalité (micro-BIC), compare EI vs SASU, estime ta rentabilité et la taxe de séjour applicable.
          </div>
        </div>
        <ArrowUpRight size={18} weight="bold" style={s.calcTeaserArrow} />
      </Link>

      {/* Ressources & téléchargements */}
      <Resources />

      {/* Glossaire */}
      <Glossaire />

      {/* Une situation que les fiches ne couvrent pas : Questions & réponses */}
      <div style={{ margin: '0 0 24px' }}>
        <AskQuestionCard
          title="Ta situation n'est pas dans le guide ?"
          text="Litige, mairie, caution, avis injuste : pose ta question à Jason et aux autres hôtes, réponse sous 48 h."
        />
      </div>

      {/* Driing banner */}
      <div style={s.banner} className="fade-up glass-card">
        <div style={s.bannerIcon}>
          <HouseLine size={28} color="var(--accent-text)" weight="fill" />
        </div>
        <div style={s.bannerText}>
          <h3 style={s.bannerTitle}>Tu connais Driing ?</h3>
          <p style={s.bannerDesc}>
            La plateforme de réservation sans commissions pour hôtes LCD, alternative directe à Airbnb.
          </p>
        </div>
        <Link
          href="https://jasonmarinho.com/blog/driing-plateforme-vacances-sans-commissions"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ fontSize: '13px', padding: '10px 18px', flexShrink: 0 }}
        >
          Découvrir <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  asideStat: { fontFamily: 'var(--font-fraunces), serif', fontSize: '40px', lineHeight: 1, color: 'var(--accent-text)' },
  asideMeta: { fontSize: '12.5px', color: 'var(--text-3)' },
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },

  calcTeaser: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: 'clamp(16px, 2.5vw, 22px)',
    borderRadius: '14px',
    textDecoration: 'none', color: 'inherit',
    marginBottom: '28px',
    transition: 'transform 0.15s, border-color 0.15s',
  },
  calcTeaserIcon: {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'var(--accent-bg)', color: 'var(--accent-text)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  calcTeaserContent: { flex: 1, minWidth: 0 },
  calcTeaserTitle: {
    fontFamily: 'var(--font-fraunces), serif',
    fontSize: '16px', fontWeight: 400, color: 'var(--text)',
    marginBottom: '3px',
  },
  calcTeaserDesc: {
    fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55,
  },
  calcTeaserArrow: {
    color: 'var(--accent-text)', flexShrink: 0,
  },


  updatedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '11px', fontWeight: 500,
    color: 'var(--text-2)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '4px 10px', borderRadius: '100px',
    marginBottom: '14px',
    letterSpacing: '0.2px',
  },
  updatedDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--accent-text)',
    boxShadow: '0 0 0 3px var(--accent-bg)',
  },

  filterWrap: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginBottom: '28px' },
  filterTab: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 500, padding: '8px 16px',
    borderRadius: '100px', border: '1.5px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-2)',
    cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap' as const, fontFamily: 'inherit',
  },

  card: { padding: '22px', borderRadius: '20px', display: 'flex', flexDirection: 'column' as const, gap: '0', position: 'relative' as const },

  profileBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const, padding: '4px 9px',
    borderRadius: '100px', border: '1px solid',
    marginBottom: '16px', alignSelf: 'flex-start' as const,
  },

  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' },
  iconBox: { width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)', margin: '0 0 3px' },
  cardSub: { fontSize: '12px', fontWeight: 300, color: 'var(--text-2)', margin: 0 },

  rules: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  rule: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '9px' },
  ruleText: { fontSize: '12.5px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.55 },

  articlesBlock: {
    marginTop: '16px', paddingTop: '14px',
    borderTop: '1px solid var(--border)',
  },
  articlesLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
    marginBottom: '8px',
  },
  articlesList: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px',
  },
  articleLink: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: 400,
    color: 'var(--text-2)', textDecoration: 'none',
    padding: '5px 8px', borderRadius: '7px',
    transition: 'all 0.15s',
    alignSelf: 'flex-start' as const,
    maxWidth: '100%',
  },

  // Parcours guidés
  parcoursLabel: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase' as const,
    color: 'var(--text-3)',
    marginBottom: '10px',
  },
  parcoursList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '10px',
  },
  parcoursCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', borderRadius: '14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    transition: 'all 0.18s',
  },
  parcoursIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  parcoursTitle: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  parcoursDesc: {
    fontSize: '11px', fontWeight: 300,
    color: 'var(--text-3)',
    lineHeight: 1.4,
  },

  // Recherche
  searchWrap: {
    position: 'relative' as const,
    marginBottom: '14px',
    maxWidth: '520px',
  },
  searchIconWrap: {
    position: 'absolute' as const,
    left: '14px', top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-3)',
    display: 'flex',
    pointerEvents: 'none' as const,
  },
  searchInput: {
    width: '100%',
    padding: '11px 14px 11px 40px',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  searchClear: {
    position: 'absolute' as const,
    right: '8px', top: '50%',
    transform: 'translateY(-50%)',
    width: '24px', height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: 'var(--border)',
    color: 'var(--text-2)',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1,
  },

  // Empty state
  emptyState: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', textAlign: 'center' as const,
    gap: '8px',
    padding: '60px 20px',
    marginBottom: '32px',
  },
  emptyTitle: {
    fontSize: '15px', fontWeight: 500,
    color: 'var(--text)',
    marginTop: '8px',
  },
  emptyDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'var(--text-3)',
  },
  emptyBtn: {
    marginTop: '12px',
    padding: '8px 16px',
    fontSize: '12px', fontWeight: 500,
    color: 'var(--accent-text)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Glossaire
  glossaireWrap: {
    marginBottom: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden' as const,
  },
  glossaireToggle: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%',
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: '14px', fontWeight: 500,
  },
  glossaireToggleLeft: {
    display: 'inline-flex', alignItems: 'center', gap: '10px',
    color: 'var(--text-2)',
  },
  glossaireChevron: {
    color: 'var(--text-3)',
    transition: 'transform 0.2s',
    display: 'flex',
  },
  glossaireList: {
    padding: '0 20px 18px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px 24px',
    borderTop: '1px solid var(--border)',
    paddingTop: '18px',
  },
  glossaireItem: { display: 'flex', flexDirection: 'column' as const, gap: '3px' },
  glossaireTerm: {
    fontSize: '12px', fontWeight: 600,
    color: 'var(--accent-text)',
    fontFamily: 'var(--font-fraunces), serif',
    letterSpacing: '0.2px',
  },
  glossaireDef: {
    fontSize: '12.5px', fontWeight: 300,
    color: 'var(--text-2)',
    lineHeight: 1.55,
  },

  banner: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const, padding: 'clamp(20px,3vw,32px)', borderRadius: '20px' },
  bannerIcon: { width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0, background: 'rgba(0,76,63,0.25)', border: '1px solid rgba(255,213,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, minWidth: '200px' },
  bannerTitle: { fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 400, color: 'var(--text)', margin: '0 0 4px' },
  bannerDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 },
}
