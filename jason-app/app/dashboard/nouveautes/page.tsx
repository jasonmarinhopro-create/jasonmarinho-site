import { getProfile } from '@/lib/queries/profile'
import Header from '@/components/layout/Header'
import { CHANGELOG, ChangelogTag } from '@/lib/constants/changelog'
import { Sparkle, ArrowUp, Wrench, Star } from '@phosphor-icons/react/dist/ssr'

const TAG_CONFIG: Record<ChangelogTag, { label: string; color: string; bg: string }> = {
  nouveau:      { label: 'Nouveau',       color: '#63D683', bg: 'rgba(99,214,131,0.12)'  },
  amélioration: { label: 'Amélioration',  color: '#FFD56B', bg: 'rgba(255,213,107,0.13)' },
  correction:   { label: 'Correction',    color: '#93C5FD', bg: 'rgba(147,197,253,0.13)' },
  important:    { label: 'Important',     color: '#F472B6', bg: 'rgba(244,114,182,0.13)' },
}

function TagIcon({ tag }: { tag: ChangelogTag }) {
  if (tag === 'nouveau')      return <Sparkle size={11} weight="fill" />
  if (tag === 'amélioration') return <ArrowUp  size={11} weight="bold" />
  if (tag === 'correction')   return <Wrench   size={11} weight="fill" />
  return <Star size={11} weight="fill" />
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NouveautesPage() {
  const profile = await getProfile()

  return (
    <>
      <Header title="Nouveautés" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>
            Nouveautés <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>Driing</em>
          </h2>
          <p style={styles.pageDesc}>
            Toutes les améliorations, nouvelles fonctionnalités et corrections apportées à la plateforme.
          </p>
        </div>

        <div style={styles.timeline} className="fade-up d1">
          {CHANGELOG.map((entry, i) => {
            const tag = TAG_CONFIG[entry.tag]
            return (
              <div key={entry.id} style={styles.entry}>
                {/* Timeline dot + line */}
                <div style={styles.dotCol}>
                  <div style={{ ...styles.dot, background: tag.color, boxShadow: `0 0 8px ${tag.color}60` }} />
                  {i < CHANGELOG.length - 1 && <div style={styles.dotLine} />}
                </div>

                {/* Content */}
                <div style={styles.card} className="glass-card">
                  <div style={styles.cardMeta}>
                    <span style={{ ...styles.tagBadge, color: tag.color, background: tag.bg }}>
                      <TagIcon tag={entry.tag} />
                      {tag.label}
                    </span>
                    <span style={styles.date}>{formatDate(entry.date)}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{entry.title}</h3>
                  <p style={styles.cardDesc}>{entry.description}</p>
                </div>
              </div>
            )
          })}

          {/* End of timeline */}
          <div style={styles.timelineEnd}>
            <div style={styles.timelineEndDot} />
            <span style={styles.timelineEndLabel}>Lancement de la plateforme</span>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '720px' },
  intro: { marginBottom: '36px' },
  pageTitle: {
    fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)',
    fontWeight: 400, color: 'var(--text)', marginBottom: '8px',
  },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.6 },

  timeline: { display: 'flex', flexDirection: 'column' },

  entry: { display: 'flex', gap: '0', alignItems: 'flex-start' },

  dotCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginRight: '20px', paddingTop: '22px', flexShrink: 0,
  },
  dot: {
    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
  },
  dotLine: {
    width: '1px', flex: 1, minHeight: '24px',
    background: 'var(--border)', marginTop: '8px',
  },

  card: {
    flex: 1, borderRadius: '16px', padding: '20px 22px',
    marginBottom: '16px',
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '10px', flexWrap: 'wrap' as const,
  },
  tagBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 600,
    padding: '3px 9px', borderRadius: '100px', letterSpacing: '0.2px',
  },
  date: { fontSize: '12px', color: 'var(--text-muted)' },
  cardTitle: {
    fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    marginBottom: '8px', lineHeight: 1.4,
  },
  cardDesc: {
    fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.65, margin: 0,
  },

  timelineEnd: {
    display: 'flex', alignItems: 'center', gap: '14px',
    paddingLeft: '0px', paddingBottom: '8px',
    marginLeft: '4px',
  },
  timelineEndDot: {
    width: '4px', height: '4px', borderRadius: '50%',
    background: 'var(--border)', flexShrink: 0,
    marginLeft: '3px',
  },
  timelineEndLabel: {
    fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic',
  },
}
