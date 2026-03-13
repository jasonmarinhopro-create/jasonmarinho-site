'use client'

import { useState } from 'react'
import { ArrowUpRight, UsersThree, FacebookLogo, WhatsappLogo, FileText } from '@phosphor-icons/react'

interface Group {
  id: string
  name: string
  platform: 'facebook' | 'whatsapp'
  description: string
  members_count: number
  url: string
  template?: { title: string; content: string } | null
}

const PLATFORM_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
]

// Detect group audience from its name
function detectAudience(name: string): 'conciergerie' | 'hote' | 'tous' {
  const lower = name.toLowerCase()
  if (lower.includes('conciergerie') || lower.includes('concierg')) return 'conciergerie'
  if (lower.includes('hôte') || lower.includes('hote') || lower.includes('airbnb')) return 'hote'
  return 'tous'
}

const AUDIENCE_FILTERS = [
  { id: 'all', label: 'Tous les groupes' },
  { id: 'conciergerie', label: 'Conciergeries' },
  { id: 'hote', label: 'Hôtes' },
]

export default function CommunauteView({ groups }: { groups: Group[] }) {
  const [platform, setPlatform] = useState('all')
  const [audience, setAudience] = useState('all')

  const filtered = groups.filter(g => {
    const matchPlatform = platform === 'all' || g.platform === platform
    const matchAudience = audience === 'all' || detectAudience(g.name) === audience || detectAudience(g.name) === 'tous'
    return matchPlatform && matchAudience
  })

  return (
    <div style={styles.page}>
      <div style={styles.intro} className="fade-up">
        <h2 style={styles.pageTitle}>
          La <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>communauté</em> LCD
        </h2>
        <p style={styles.pageDesc}>
          Les meilleurs groupes pour échanger avec d'autres hôtes — avec les gabarits de présentation pour bien démarrer.
        </p>
      </div>

      {/* Filters */}
      <div style={styles.filtersWrap} className="fade-up">
        {/* Audience */}
        <div style={styles.filterGroup}>
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

        {/* Platform */}
        <div style={styles.filterGroup}>
          {PLATFORM_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setPlatform(f.id)}
              style={{
                ...styles.filterPill,
                ...(platform === f.id ? styles.filterPillPlatform : {}),
                ...(platform === f.id && f.id === 'facebook' ? { borderColor: 'rgba(147,197,253,0.35)', color: '#93C5FD' } : {}),
                ...(platform === f.id && f.id === 'whatsapp' ? { borderColor: 'rgba(52,211,153,0.35)', color: '#34D399' } : {}),
              }}
            >
              {f.id === 'facebook' && <FacebookLogo size={13} weight={platform === 'facebook' ? 'fill' : 'regular'} />}
              {f.id === 'whatsapp' && <WhatsappLogo size={13} weight={platform === 'whatsapp' ? 'fill' : 'regular'} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={styles.countRow} className="fade-up">
        <span style={styles.count}>{filtered.length}</span>
        <span style={styles.countLabel}>groupe{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      <div style={styles.grid} className="dash-grid-2">
        {filtered.map((g, i) => (
          <div key={g.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
            <div style={styles.cardHead}>
              <div style={styles.platformIcon}>
                {g.platform === 'facebook'
                  ? <FacebookLogo size={22} color="#93C5FD" weight="fill" />
                  : <WhatsappLogo size={22} color="#34D399" weight="fill" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={styles.groupName}>{g.name}</h3>
                <div style={styles.memberCount}>
                  <UsersThree size={13} />
                  {g.members_count.toLocaleString('fr-FR')} membres
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
        <div style={styles.empty}>Aucun groupe pour ces filtres.</div>
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

  filtersWrap: {
    display: 'flex', gap: '12px', flexWrap: 'wrap',
    alignItems: 'center', marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex', gap: '8px', flexWrap: 'wrap',
    padding: '4px 0',
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
  filterPillPlatform: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#f0f4ff',
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
  cardHead: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' },
  platformIcon: {
    width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  groupName: {
    fontFamily: 'Fraunces, serif', fontSize: '17px',
    fontWeight: 400, color: '#f0f4ff', marginBottom: '3px',
  },
  memberCount: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: 'rgba(240,244,255,0.38)',
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
  empty: {
    textAlign: 'center', padding: '60px 20px',
    color: 'rgba(240,244,255,0.3)', fontSize: '14px',
  },
}
