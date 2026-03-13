import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { GraduationCap, Clock, BookOpen, ArrowRight, CheckCircle, Lock } from '@phosphor-icons/react/dist/ssr'

const levelLabel: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

export default async function FormationsPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const userId = profile?.userId ?? ''

  const [{ data: formations }, { data: userFormations }] = await Promise.all([
    supabase.from('formations').select('*').eq('is_published', true).order('created_at'),
    supabase.from('user_formations').select('*').eq('user_id', userId),
  ])

  const progressMap = Object.fromEntries(
    (userFormations ?? []).map(uf => [uf.formation_id, uf.progress])
  )

  return (
    <>
      <Header title="Formations" userName={profile?.full_name ?? undefined} />

      <div style={styles.page}>
        <div style={styles.intro} className="fade-up">
          <h2 style={styles.pageTitle}>Tes <em style={{ color: '#FFD56B', fontStyle: 'italic' }}>formations</em></h2>
          <p style={styles.pageDesc}>Des parcours concrets pour optimiser ta location courte durée. Accessibles à vie, à ton rythme.</p>
        </div>

        <div style={styles.grid} className="dash-grid-3">
          {(formations ?? []).map((f, i) => {
            const progress = progressMap[f.id] ?? null
            const enrolled = progress !== null
            const done = progress === 100

            return (
              <div key={f.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
                {/* Header card */}
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    <GraduationCap size={28} color="#FFD56B" weight="fill" />
                  </div>
                  <div style={styles.cardBadges}>
                    <span className="badge badge-yellow">{levelLabel[f.level] ?? f.level}</span>
                    {done && <span className="badge badge-green">Terminé</span>}
                  </div>
                </div>

                {/* Content */}
                <h3 style={styles.cardTitle}>{f.title}</h3>
                <p style={styles.cardDesc}>{f.description}</p>

                {/* Meta */}
                <div style={styles.meta}>
                  <span style={styles.metaItem}>
                    <Clock size={13} /> {f.duration}
                  </span>
                  <span style={styles.metaItem}>
                    <BookOpen size={13} /> {f.modules_count} modules
                  </span>
                  <span style={styles.metaItem}>
                    <CheckCircle size={13} /> {f.lessons_count} leçons
                  </span>
                </div>

                {/* Progress */}
                {enrolled && (
                  <div style={styles.progressArea}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={styles.progressLabel}>Progression</span>
                      <span style={styles.progressPct}>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div style={styles.cardFooter}>
                  {enrolled ? (
                    <Link href={`/dashboard/formations/${f.slug}`} className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
                      {done ? 'Revoir' : 'Continuer'} <ArrowRight size={14} weight="bold" />
                    </Link>
                  ) : (
                    <Link href={`/dashboard/formations/${f.slug}`} className="btn-ghost" style={{ fontSize: '13px', padding: '10px 18px' }}>
                      Commencer <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '36px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: '#f0f4ff', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', maxWidth: '520px', lineHeight: 1.6 },
  grid: {}, /* handled by className dash-grid-3 */
  card: { padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  cardIcon: {
    width: '52px', height: '52px', borderRadius: '14px',
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardBadges: { display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: '#f0f4ff', lineHeight: 1.3, marginBottom: '10px' },
  cardDesc: { fontSize: '13px', fontWeight: 300, color: 'rgba(240,244,255,0.5)', lineHeight: 1.65, marginBottom: '18px', flex: 1 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(240,244,255,0.38)' },
  progressArea: { marginBottom: '20px' },
  progressLabel: { fontSize: '12px', color: 'rgba(240,244,255,0.4)' },
  progressPct: { fontSize: '12px', color: '#FFD56B' },
  cardFooter: { paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' },
}
