'use client'

import { ArrowUpRight, UsersThree, FacebookLogo, WhatsappLogo, Tag, Star } from '@phosphor-icons/react'

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

// La catégorie "Groupes Jason & Driing" bénéficie d'une mise en avant spéciale
const FEATURED_CATEGORY = 'Groupes Jason & Driing'

export default function CommunauteView({ groups }: { groups: Group[] }) {
  // Grouper par catégorie
  const grouped: Record<string, Group[]> = {}
  groups.forEach(g => {
    const cat = g.category || 'Général'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(g)
  })

  const featuredGroups = grouped[FEATURED_CATEGORY] ?? []
  const otherCategories = Object.entries(grouped).filter(([cat]) => cat !== FEATURED_CATEGORY)

  return (
    <div style={s.page}>
      {/* Intro */}
      <div style={s.intro} className="fade-up">
        <h2 style={s.pageTitle}>
          La <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>communauté</em> LCD
        </h2>
        <p style={s.pageDesc}>
          Les meilleurs groupes pour échanger avec d'autres hôtes — et partager vos locations directement avec des voyageurs.
        </p>
      </div>

      {/* ── Section mise en avant : Groupes Jason & Driing ── */}
      {featuredGroups.length > 0 && (
        <div style={s.featuredSection} className="fade-up">
          <div style={s.featuredHeader}>
            <div style={s.featuredBadge}>
              <Star size={12} weight="fill" />
              {FEATURED_CATEGORY}
            </div>
            <p style={s.featuredSubtitle}>
              Nos groupes officiels — rejoignez la communauté et partagez vos logements directement
            </p>
          </div>

          <div className="dash-grid-2">
            {featuredGroups.map((g, i) => (
              <div key={g.id} style={s.featuredCard} className={`fade-up d${i + 1}`}>
                <div style={s.featuredCardTop}>
                  <div style={s.featuredIconWrap}>
                    <FacebookLogo size={20} color="#FFD56B" weight="fill" />
                  </div>
                  {g.tag && <span style={s.tagPill}>{g.tag}</span>}
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
              return (
                <div key={g.id} style={s.card} className={`glass-card fade-up d${i + 1}`}>
                  <div style={s.cardHead}>
                    <div style={{ ...s.platformIcon, background: isFb ? 'rgba(147,197,253,0.08)' : 'rgba(37,211,102,0.08)', border: `1px solid ${isFb ? 'rgba(147,197,253,0.15)' : 'rgba(37,211,102,0.15)'}` }}>
                      {isFb
                        ? <FacebookLogo size={20} color="#93C5FD" weight="fill" />
                        : <WhatsappLogo size={20} color="#25D366" weight="fill" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h3 style={s.groupName}>{g.name}</h3>
                        {g.tag && (
                          <span style={s.inlineTag}>
                            <Tag size={9} />
                            {g.tag}
                          </span>
                        )}
                      </div>
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
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* État vide */}
      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: '14px' }}>
          <UsersThree size={36} color="var(--text-muted)" />
          <p style={{ marginTop: '12px' }}>Aucun groupe disponible pour l'instant.</p>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:     { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro:    { marginBottom: '32px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc:  { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },

  // Featured
  featuredSection: {
    marginBottom: '40px', padding: '28px', borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,213,107,0.06) 0%, rgba(255,213,107,0.02) 100%)',
    border: '1px solid rgba(255,213,107,0.18)',
  },
  featuredHeader:   { marginBottom: '24px' },
  featuredBadge:    {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 12px', borderRadius: '999px',
    background: 'rgba(255,213,107,0.12)', border: '1px solid rgba(255,213,107,0.3)',
    color: 'var(--accent-text)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.4px', marginBottom: '10px',
  },
  featuredSubtitle: { fontSize: '14px', color: 'var(--text-3)', fontWeight: 300 },
  featuredCard:     {
    padding: '22px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '180px',
    background: 'rgba(255,213,107,0.04)', border: '1px solid rgba(255,213,107,0.12)',
  },
  featuredCardTop:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  featuredIconWrap: {
    width: '38px', height: '38px', borderRadius: '10px',
    background: 'rgba(255,213,107,0.1)', border: '1px solid rgba(255,213,107,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tagPill: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
    color: 'rgba(255,213,107,0.7)', background: 'rgba(255,213,107,0.08)',
    border: '1px solid rgba(255,213,107,0.15)', borderRadius: '100px', padding: '3px 10px',
  },
  featuredName: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)' },
  featuredDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, flex: 1 },

  // Regular sections
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

  card:         { padding: '22px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' },
  cardHead:     { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  platformIcon: {
    width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  groupName: { fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 400, color: 'var(--text)', marginBottom: 0 },
  inlineTag: {
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '100px',
    background: 'rgba(147,197,253,0.08)', border: '1px solid rgba(147,197,253,0.15)',
    color: 'rgba(147,197,253,0.7)',
  },
  memberCount: {
    display: 'flex', alignItems: 'center', gap: '4px',
    fontSize: '12px', color: 'var(--text-3)',
  },
  desc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65 },
}
