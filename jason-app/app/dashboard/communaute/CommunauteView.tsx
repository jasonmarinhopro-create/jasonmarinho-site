'use client'

import { useState } from 'react'
import { ArrowUpRight, UsersThree, FacebookLogo, FileText, MapPin } from '@phosphor-icons/react'

interface Group {
  id: string
  name: string
  platform: 'facebook' | 'whatsapp'
  description: string
  members_count: number
  url: string
  template?: { title: string; content: string } | null
}

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

const AUDIENCE_FILTERS = [
  { id: 'all',           label: 'Tous les groupes' },
  { id: 'conciergerie',  label: 'Conciergeries' },
  { id: 'hote',          label: 'Hôtes' },
]

function detectAudience(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('conciergerie') || lower.includes('concierg')) return 'conciergerie'
  if (lower.includes('hôte') || lower.includes('hote') || lower.includes('airbnb')) return 'hote'
  return 'all'
}

export default function CommunauteView({ groups }: { groups: Group[] }) {
  const [audience, setAudience] = useState('all')
  const [region, setRegion] = useState('all')

  // Only show regions that have at least 1 group
  const usedRegionIds = new Set(groups.map(g => detectRegion(g.name)))
  const availableRegions = [
    { id: 'all', label: 'Toutes les régions' },
    ...REGIONS.filter(r => usedRegionIds.has(r.id)),
  ]

  const filtered = groups.filter(g => {
    const matchAudience = audience === 'all' || detectAudience(g.name) === audience || detectAudience(g.name) === 'all'
    const matchRegion = region === 'all' || detectRegion(g.name) === region
    return matchAudience && matchRegion
  })

  return (
    <div style={styles.page}>
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          La <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>communauté</em> LCD
        </h2>
        <p style={styles.pageDesc}>
          Les meilleurs groupes Facebook pour échanger avec d'autres hôtes — avec les gabarits de présentation pour bien démarrer.
        </p>
      </div>

      {/* Filters */}
      <div style={styles.filtersSection} className="fade-up">
        {/* Audience */}
        <div style={styles.filterRow}>
          {AUDIENCE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setAudience(f.id)}
              style={{
                ...styles.filterPill,
                ...(audience === f.id ? styles.filterPillActive : {}),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Regions — only if multiple exist */}
        {availableRegions.length > 1 && (
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

      {/* Count */}
      <div style={styles.countRow} className="fade-up">
        <span style={styles.count}>{filtered.length}</span>
        <span style={styles.countLabel}>
          groupe{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
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

      {filtered.length === 0 && (
        <div style={styles.empty}>
          <FacebookLogo size={36} color="rgba(240,244,255,0.15)" weight="fill" />
          <p style={{ marginTop: '12px', color: 'rgba(240,244,255,0.35)', fontSize: '14px' }}>
            Aucun groupe pour ces filtres.
          </p>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '28px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '10px',
  },
  pageDesc: {
    fontSize: '15px', fontWeight: 300,
    color: 'rgba(240,244,255,0.5)', maxWidth: '520px', lineHeight: 1.6,
  },

  filtersSection: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    marginBottom: '24px',
  },
  filterRow: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
  },
  regionLabel: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'rgba(240,244,255,0.35)', fontWeight: 500,
    marginRight: '4px',
  },
  filterPill: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '7px 15px', borderRadius: '999px',
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
  filterPillRegion: {
    background: 'rgba(147,197,253,0.1)',
    border: '1px solid rgba(147,197,253,0.25)',
    color: '#93C5FD',
  },

  countRow: {
    display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px',
  },
  count: {
    fontFamily: 'Fraunces, serif', fontSize: '20px',
    fontWeight: 400, color: '#f0f4ff',
  },
  countLabel: { fontSize: '14px', color: 'rgba(240,244,255,0.4)' },

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
    fontWeight: 400, color: '#f0f4ff', marginBottom: '6px',
  },
  metaRow: {
    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
  },
  memberCount: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'rgba(240,244,255,0.38)',
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
    color: 'rgba(240,244,255,0.55)', lineHeight: 1.65,
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
    color: 'rgba(240,244,255,0.7)', marginBottom: '10px',
  },
  templateContent: {
    fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 300,
    color: 'rgba(240,244,255,0.45)', lineHeight: 1.7,
    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    maxHeight: '140px', overflowY: 'auto',
  },
  empty: { textAlign: 'center', padding: '60px 20px' },
}
