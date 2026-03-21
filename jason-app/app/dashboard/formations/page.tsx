import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import FormationsSuggestForm from './FormationsSuggestForm'
import { GraduationCap, Clock, BookOpen, ArrowRight, CheckCircle, Lock, Wrench } from '@phosphor-icons/react/dist/ssr'

const levelLabel: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

// Formations à venir — hardcodées, pas encore en DB
const COMING_SOON = [
  {
    id: 'attirer-voyageurs',
    title: 'Attirer des voyageurs sans Airbnb',
    description: 'SEO local, réseaux sociaux, groupes Facebook, bouche-à-oreille digital — les vraies stratégies pour remplir son calendrier en location directe.',
    duration: '2h30',
    modules: 5,
    lessons: 11,
    level: 'Intermédiaire',
  },
]

export default async function FormationsPage() {
  const profile = await getProfile()
  const supabase = await createClient()
  const userId = profile?.userId ?? ''

  const [{ data: formations }, { data: userFormations }] = await Promise.all([
    supabase.from('formations').select('*').eq('is_published', true).order('created_at', { ascending: true }),
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
          <h2 style={styles.pageTitle}>Tes <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>formations</em></h2>
          <p style={styles.pageDesc}>Des parcours concrets pour optimiser ta location courte durée. Accessibles à vie, à ton rythme.</p>
        </div>

        {/* Formation disponible */}
        <div style={styles.section} className="fade-up d1">
          <div style={styles.grid} className="dash-grid-3">
            {(formations ?? []).map((f, i) => {
              const progress = progressMap[f.id] ?? null
              const enrolled = progress !== null
              const done = progress === 100

              return (
                <div key={f.id} style={styles.card} className={`glass-card fade-up d${i + 1}`}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardIcon}>
                      <GraduationCap size={28} color="#FFD56B" weight="fill" />
                    </div>
                    <div style={styles.cardBadges}>
                      <span className="badge badge-yellow">{levelLabel[f.level] ?? f.level}</span>
                      <span className="badge badge-green">Disponible</span>
                      {done && <span className="badge badge-green">Terminé ✓</span>}
                    </div>
                  </div>

                  <h3 style={styles.cardTitle}>{f.title}</h3>
                  <p style={styles.cardDesc}>{f.description}</p>

                  <div style={styles.meta}>
                    <span style={styles.metaItem}><Clock size={13} /> {f.duration}</span>
                    <span style={styles.metaItem}><BookOpen size={13} /> {f.modules_count} modules</span>
                    <span style={styles.metaItem}><CheckCircle size={13} /> {f.lessons_count} leçons</span>
                  </div>

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

                  <div style={styles.cardFooter}>
                    {enrolled ? (
                      <Link href={`/dashboard/formations/${f.slug}`} className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
                        {done ? 'Revoir' : 'Continuer'} <ArrowRight size={14} weight="bold" />
                      </Link>
                    ) : (
                      <Link href={`/dashboard/formations/${f.slug}`} className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
                        Commencer <ArrowRight size={14} weight="bold" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Formations en construction */}
            {COMING_SOON.map((f, i) => (
              <div key={f.id} style={styles.comingSoonCard} className={`glass-card fade-up d${i + 2}`}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.cardIcon, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <Wrench size={24} color="var(--text-muted)" weight="fill" />
                  </div>
                  <div style={styles.cardBadges}>
                    <span style={styles.wip}>En construction</span>
                  </div>
                </div>

                <h3 style={{ ...styles.cardTitle, color: 'var(--text-3)' }}>{f.title}</h3>
                <p style={{ ...styles.cardDesc, color: 'var(--text-muted)' }}>{f.description}</p>

                <div style={styles.meta}>
                  <span style={{ ...styles.metaItem, opacity: 0.4 }}><Clock size={13} /> {f.duration}</span>
                  <span style={{ ...styles.metaItem, opacity: 0.4 }}><BookOpen size={13} /> {f.modules} modules</span>
                  <span style={{ ...styles.metaItem, opacity: 0.4 }}><CheckCircle size={13} /> {f.lessons} leçons</span>
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.lockedBtn}>
                    <Lock size={13} />
                    Bientôt disponible
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestion de formation */}
        <div style={styles.suggestSection} className="fade-up d3">
          <div style={styles.suggestBox} className="glass-card">
            <div style={styles.suggestLeft}>
              <div style={styles.suggestEmoji}>💡</div>
              <div>
                <h3 style={styles.suggestTitle}>
                  Tu voudrais une formation sur un autre sujet ?
                </h3>
                <p style={styles.suggestDesc}>
                  Dis-nous ce qui t'aiderait le plus dans ton activité — on construit les prochaines formations en fonction de tes besoins.
                </p>
              </div>
            </div>
            <FormationsSuggestForm />
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%' },
  intro: { marginBottom: '36px' },
  pageTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '10px' },
  pageDesc: { fontSize: '15px', fontWeight: 300, color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },
  section: { marginBottom: '40px' },
  grid: {},
  card: { padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0' },
  comingSoonCard: {
    padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0',
    background: 'var(--surface)', border: '1px solid var(--border)',
    opacity: 0.7,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  cardIcon: {
    width: '52px', height: '52px', borderRadius: '14px',
    background: 'rgba(0,76,63,0.3)', border: '1px solid rgba(255,213,107,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cardBadges: { display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' },
  wip: {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase',
    padding: '4px 10px', borderRadius: '100px',
    background: 'var(--border)', color: 'var(--text-muted)',
    border: '1px solid var(--border)',
  },
  cardTitle: { fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.3, marginBottom: '10px' },
  cardDesc: { fontSize: '13px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '18px', flex: 1 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-3)' },
  progressArea: { marginBottom: '20px' },
  progressLabel: { fontSize: '12px', color: 'var(--text-3)' },
  progressPct: { fontSize: '12px', color: 'var(--accent-text)' },
  cardFooter: { paddingTop: '16px', borderTop: '1px solid var(--border)' },
  lockedBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '7px',
    fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)',
    background: 'var(--surface)', border: '1px solid var(--surface-2)',
    borderRadius: '8px', padding: '9px 16px',
  },

  // Suggest section
  suggestSection: { marginTop: '8px' },
  suggestBox: {
    display: 'flex', alignItems: 'flex-start', gap: '32px',
    padding: 'clamp(20px,3vw,36px)', borderRadius: '20px', flexWrap: 'wrap',
  },
  suggestLeft: { display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '260px' },
  suggestEmoji: { fontSize: '28px', flexShrink: 0, marginTop: '3px' },
  suggestTitle: { fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px', lineHeight: 1.3 },
  suggestDesc: { fontSize: '14px', fontWeight: 300, color: 'var(--text-2)', lineHeight: 1.6 },
}
