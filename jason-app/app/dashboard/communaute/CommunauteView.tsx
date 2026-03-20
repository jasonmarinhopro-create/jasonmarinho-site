'use client'

import { useState } from 'react'
import { ArrowUpRight, UsersThree, FacebookLogo, FileText, MapPin, Star } from '@phosphor-icons/react'

interface Group {
  id: string
  name: string
  platform: 'facebook' | 'whatsapp'
  description: string
  members_count: number
  url: string
  template?: { title: string; content: string } | null
}

// Jason & Driing's owned groups — featured section
const JASON_GROUPS = [
  {
    id: 'jd-1',
    name: "Groupe d'entraide entre hôtes",
    description: "Le groupe principal géré par Jason et Driing. Entraide, conseils et partage d'expériences entre hôtes en location directe.",
    url: 'https://www.facebook.com/groups/locationdirect/',
    tag: 'Hôtes LCD',
  },
  {
    id: 'jd-2',
    name: 'Partager sa location en direct',
    description: "Publiez vos annonces de location sans commission pour toucher des voyageurs directement, sans passer par les plateformes.",
    url: 'https://www.facebook.com/groups/locationssanscommission/',
    tag: 'Voyageurs',
  },
  {
    id: 'jd-3',
    name: 'Trouver une conciergerie',
    description: "Groupe dédié aux conciergeries et hôtes qui cherchent à déléguer la gestion de leur bien. Mises en relation directes.",
    url: 'https://www.facebook.com/groups/trouverconciergerie/',
    tag: 'Conciergeries',
  },
  {
    id: 'jd-4',
    name: 'Locations Ski',
    description: "Spécial montagne et stations de ski. Partagez vos chalets et appartements directement avec les skieurs.",
    url: 'https://www.facebook.com/groups/locationski/',
    tag: 'Ski',
  },
]

// Additional community groups for hosts to share their listings
const EXTRA_GROUPS = [
  {
    id: 'ex-1',
    name: 'Gîtes et Chambres d\'hôtes',
    description: "Grand groupe de partage pour gîtes et chambres d'hôtes. Idéal pour toucher des voyageurs cherchant des logements authentiques.",
    url: 'https://www.facebook.com/groups/GitesChambres/',
  },
  {
    id: 'ex-2',
    name: 'Location de vacances France',
    description: "Groupe communautaire pour partager vos locations de vacances et rentrer en contact avec des voyageurs en France.",
    url: 'https://www.facebook.com/groups/1621576811388429/',
  },
  {
    id: 'ex-3',
    name: 'Locations Bretagne & Normandie',
    description: "Groupe régional dédié aux locations saisonnières en Bretagne et Normandie. Partagez vos biens et échangez avec d'autres hôtes de la région.",
    url: 'https://www.facebook.com/groups/581616559233686/',
    region: 'Bretagne / Normandie',
  },
]

// French region detection from group name
const REGIONS: { id: string; label: string; keywords: string[] }[] = [
  { id: 'national', label: 'National', keywords: ['france', 'francophone', 'pro', 'airbnb france', 'location courte durée', 'lcd', 'conciergerie france', 'conciergeries'] },
  { id: 'idf',      label: 'Île-de-France', keywords: ['paris', 'île-de-france', 'idf', 'seine', 'versailles', 'banlieue'] },
  { id: 'paca',     label: 'PACA',          keywords: ['paca', 'provence', 'marseille', 'nice', 'toulon', 'côte d\'azur', 'azur', 'alpes-maritimes', 'var', 'vaucluse'] },
  { id: 'aura',     label: 'Auvergne-Rhône-Alpes', keywords: ['lyon', 'grenoble', 'annecy', 'savoie', 'haute-savoie', 'rhône-alpes', 'rhône', 'auvergne', 'clermont'] },
  { id: 'occ',      label: 'Occitanie',     keywords: ['toulouse', 'montpellier', 'occitanie', 'languedoc', 'hérault', 'gard', 'pyrénées'] },
  { id: 'na',       label: 'Nouvelle-Aquitaine', keywords: ['bordeaux', 'biarritz', 'pays basque', 'périgord', 'dordogne', 'charente', 'gironde', 'nouvelle-aquitaine'] },
  { id: 'bre',      label: 'Bretagne',      keywords: ['bretagne', 'rennes', 'brest', 'nantes', 'finistère', 'morbihan', 'ille-et-vilaine'] },
  { id: 'nor',      label: 'Normandie',     keywords: ['normandie', 'rouen', 'caen', 'deauville', 'manche', 'calvados'] },
  { id: 'ge',       label: 'Grand Est',     keywords: ['strasbourg', 'alsace', 'moselle', 'champagne', 'ardennes', 'grand est'] },
  { id: 'hdf',      label: 'Hauts-de-France', keywords: ['lille', 'nord', 'pas-de-calais', 'hauts-de-france', 'amiens'] },
  { id: 'pdl',      label: 'Pays de la Loire', keywords: ['nantes', 'le mans', 'angers', 'pays de la loire', 'loire-atlantique', 'vendée'] },
  { id: 'dom',      label: 'DOM-TOM',       keywords: ['réunion', 'martinique', 'guadeloupe', 'guyane', 'mayotte', 'dom', 'outre-mer'] },
]

function detectRegion(name: string): string {
  const lower = name.toLowerCase()
  for (const region of REGIONS) {
    if (region.keywords.some(k => lower.includes(k))) return region.id
  }
  return 'national'
}

export default function CommunauteView({ groups }: { groups: Group[] }) {
  const [region, setRegion] = useState('all')

  const usedRegionIds = new Set(groups.map(g => detectRegion(g.name)))
  const availableRegions = [
    { id: 'all', label: 'Toutes les régions' },
    ...REGIONS.filter(r => usedRegionIds.has(r.id)),
  ]

  const filtered = groups.filter(g => {
    return region === 'all' || detectRegion(g.name) === region
  })

  return (
    <div style={styles.page}>
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          La <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>communauté</em> LCD
        </h2>
        <p style={styles.pageDesc}>
          Les meilleurs groupes Facebook pour échanger avec d'autres hôtes — et partager vos locations directement avec des voyageurs.
        </p>
      </div>

      {/* ── Jason & Driing featured section ── */}
      <div style={styles.featuredSection} className="fade-up">
        <div style={styles.featuredHeader}>
          <div style={styles.featuredBadge}>
            <Star size={12} weight="fill" />
            Groupes Jason & Driing
          </div>
          <p style={styles.featuredSubtitle}>
            Nos groupes officiels — rejoignez la communauté et partagez vos logements directement
          </p>
        </div>

        <div style={styles.featuredGrid} className="dash-grid-2">
          {JASON_GROUPS.map((g, i) => (
            <div key={g.id} style={styles.featuredCard} className={`fade-up d${i + 1}`}>
              <div style={styles.featuredCardTop}>
                <div style={styles.featuredIconWrap}>
                  <FacebookLogo size={20} color="#FFD56B" weight="fill" />
                </div>
                <span style={styles.tagPill}>{g.tag}</span>
              </div>
              <h3 style={styles.featuredName}>{g.name}</h3>
              <p style={styles.featuredDesc}>{g.description}</p>
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
      </div>

      {/* ── Extra community groups ── */}
      <div style={styles.sectionBlock} className="fade-up">
        <div style={styles.sectionLabel}>
          <UsersThree size={14} />
          Groupes pour partager vos locations
        </div>
        <div style={styles.grid} className="dash-grid-2">
          {EXTRA_GROUPS.map((g, i) => (
            <div key={g.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
              <div style={styles.cardHead}>
                <div style={styles.platformIcon}>
                  <FacebookLogo size={20} color="#93C5FD" weight="fill" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={styles.groupName}>{g.name}</h3>
                  {'region' in g && g.region && (
                    <div style={styles.metaRow}>
                      <div style={styles.regionBadge}>
                        <MapPin size={11} />
                        {g.region}
                      </div>
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
              <p style={styles.desc}>{g.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── DB groups (community) ── */}
      {filtered.length > 0 && (
        <div style={styles.sectionBlock} className="fade-up">
          <div style={styles.sectionLabelRow}>
            <div style={styles.sectionLabel}>
              <FacebookLogo size={14} />
              Autres groupes de la communauté
            </div>

            {availableRegions.length > 2 && (
              <div style={styles.filterRow}>
                <div style={styles.regionLabel}>
                  <MapPin size={13} />
                  Région :
                </div>
                {availableRegions.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    style={{
                      ...styles.filterPill,
                      ...(region === r.id ? styles.filterPillRegion : {}),
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.grid} className="dash-grid-2">
            {filtered.map((g, i) => (
              <div key={g.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
                <div style={styles.cardHead}>
                  <div style={styles.platformIcon}>
                    <FacebookLogo size={22} color="#93C5FD" weight="fill" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={styles.groupName}>{g.name}</h3>
                    <div style={styles.metaRow}>
                      <div style={styles.memberCount}>
                        <UsersThree size={13} />
                        {g.members_count.toLocaleString('fr-FR')} membres
                      </div>
                      {detectRegion(g.name) !== 'national' && (
                        <div style={styles.regionBadge}>
                          <MapPin size={11} />
                          {REGIONS.find(r => r.id === detectRegion(g.name))?.label}
                        </div>
                      )}
                    </div>
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

                <p style={styles.desc}>{g.description}</p>

                {g.template && (
                  <div style={styles.templateBox}>
                    <div style={styles.templateHead}>
                      <FileText size={14} color="#FFD56B" />
                      <span style={styles.templateLabel}>Gabarit de présentation</span>
                    </div>
                    <p style={styles.templateTitle}>{g.template.title}</p>
                    <pre style={styles.templateContent}>{g.template.content}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '32px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6,
  },

  // Featured Jason/Driing section
  featuredSection: {
    marginBottom: '40px',
    padding: '28px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.06) 0%, rgba(255,213,107,0.02) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
  },
  featuredHeader: { marginBottom: '24px' },
  featuredBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 12px', borderRadius: '999px',
    background: 'rgba(255,213,107,0.12)',
    border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600,
    letterSpacing: '0.4px', marginBottom: '10px',
  },
  featuredSubtitle: {
    fontSize: '14px', color: 'var(--text-3)', fontWeight: 300,
  },
  featuredGrid: {},
  featuredCard: {
    padding: '22px',
    borderRadius: '14px',
    background: 'rgba(255,213,107,0.04)',
    border: '1px solid rgba(255,213,107,0.12)',
    display: 'flex', flexDirection: 'column', gap: '10px',
    minHeight: '180px',
  },
  featuredCardTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  featuredIconWrap: {
    width: '38px', height: '38px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.1)',
    border: '1px solid rgba(255,213,107,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tagPill: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
    color: 'rgba(255,213,107,0.7)',
    background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.15)',
    borderRadius: '100px', padding: '3px 10px',
  },
  featuredName: {
    fontFamily: 'Fraunces, serif', fontSize: '16px',
    fontWeight: 400, color: 'var(--text)',
  },
  featuredDesc: {
    fontSize: '13px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.65, flex: 1,
  },

  // Section blocks
  sectionBlock: { marginBottom: '36px' },
  sectionLabelRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '10px', marginBottom: '18px',
  },
  sectionLabel: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.7px',
    textTransform: 'uppercase', color: 'var(--text-3)',
    marginBottom: '18px',
  },

  filterRow: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
  },
  regionLabel: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--text-3)', fontWeight: 500,
    marginRight: '4px',
  },
  filterPill: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '7px 15px', borderRadius: '999px',
    fontSize: '13px', fontWeight: 400,
    background: 'var(--border)',
    border: '1px solid var(--border)',
    color: 'var(--text-2)',
    cursor: 'pointer', transition: 'all 0.18s',
  },
  filterPillRegion: {
    background: 'rgba(147,197,253,0.1)',
    border: '1px solid rgba(147,197,253,0.25)',
    color: '#93C5FD',
  },

  grid: {},
  card: {
    padding: '28px', borderRadius: '18px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  cardHead: { display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' },
  platformIcon: {
    width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
    background: 'rgba(147,197,253,0.08)',
    border: '1px solid rgba(147,197,253,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  groupName: {
    fontFamily: 'Fraunces, serif', fontSize: '17px',
    fontWeight: 400, color: 'var(--text)', marginBottom: '6px',
  },
  metaRow: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
  },
  memberCount: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'var(--text-3)',
  },
  regionBadge: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 500,
    color: 'rgba(147,197,253,0.7)',
    background: 'rgba(147,197,253,0.08)',
    border: '1px solid rgba(147,197,253,0.15)',
    borderRadius: '100px', padding: '2px 8px',
  },
  desc: {
    fontSize: '14px', fontWeight: 300,
    color: 'var(--text-2)', lineHeight: 1.65,
  },
  templateBox: {
    background: 'rgba(255,213,107,0.04)',
    border: '1px solid rgba(255,213,107,0.1)',
    borderRadius: '12px', padding: '16px',
  },
  templateHead: { display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' },
  templateLabel: {
    fontSize: '11px', fontWeight: 600,
    letterSpacing: '0.8px', textTransform: 'uppercase',
    color: 'rgba(255,213,107,0.6)',
  },
  templateTitle: {
    fontSize: '13px', fontWeight: 500,
    color: 'var(--text-2)', marginBottom: '10px',
  },
  templateContent: {
    fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 300,
    color: 'var(--text-3)', lineHeight: 1.7,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: '140px', overflowY: 'auto',
  },
}
