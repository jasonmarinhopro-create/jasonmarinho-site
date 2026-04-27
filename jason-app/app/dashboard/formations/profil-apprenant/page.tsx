import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Trophy, Flame, Clock, BookOpen, ArrowRight, Star } from '@phosphor-icons/react/dist/ssr'

export default async function ProfilApprenantPage() {
  const profile = await getProfile()
  if (!profile) return null

  const supabase = await createClient()
  const userId = profile.userId

  // Toutes les inscriptions de l'utilisateur (avec progression)
  const [
    { data: userFormations },
    { data: formations },
    { data: completionLog },
  ] = await Promise.all([
    supabase
      .from('user_formations')
      .select('formation_id, progress, completed_lessons')
      .eq('user_id', userId),
    supabase
      .from('formations')
      .select('id, slug, title, description, duration, level, lessons_count')
      .eq('is_published', true),
    supabase
      .from('user_lesson_completion_log')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(500),
  ])

  const formationsById = Object.fromEntries((formations ?? []).map(f => [f.id, f]))

  // Stats globales
  const enrolled = (userFormations ?? []).filter(uf => (uf.progress ?? 0) > 0)
  const completed = enrolled.filter(uf => uf.progress === 100)
  const inProgress = enrolled.filter(uf => uf.progress > 0 && uf.progress < 100)

  const totalLessonsDone = enrolled.reduce(
    (sum, uf) => sum + ((uf.completed_lessons as number[] | null)?.length ?? 0),
    0,
  )

  // Heures totales (estimation : 12 min par leçon en moyenne, ou parser duration des formations)
  // Approximation simple : 15 min par leçon
  const totalMinutes = totalLessonsDone * 15
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMin = totalMinutes % 60

  // Streak — jours consécutifs où au moins 1 leçon a été complétée
  const streak = (() => {
    if (!completionLog || completionLog.length === 0) return 0
    const days = new Set<string>()
    completionLog.forEach((c: any) => {
      days.add(new Date(c.completed_at).toISOString().slice(0, 10))
    })
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10)
      if (days.has(d)) count++
      else if (i === 0) continue // si pas d'activité aujourd'hui, regarder hier
      else break
    }
    return count
  })()

  // Niveau global
  const niveau =
    totalLessonsDone === 0 ? { label: 'Nouveau', color: 'var(--text-muted)', bg: 'var(--surface)', desc: 'Commence ta première leçon !' } :
    totalLessonsDone < 10 ? { label: 'Apprenti', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', desc: 'Continue, tu prends de l\'élan' } :
    totalLessonsDone < 30 ? { label: 'Praticien', color: '#34d399', bg: 'rgba(52,211,153,0.10)', desc: 'Tu maîtrises les bases' } :
    totalLessonsDone < 60 ? { label: 'Expert', color: 'var(--accent-text)', bg: 'var(--accent-bg)', desc: 'Tu deviens une référence' } :
                            { label: 'Maître', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', desc: 'Tu connais la LCD sur le bout des doigts' }

  // Badges débloqués
  const BADGES_DEFS = [
    { id: 'first', emoji: '🎓', label: 'Première leçon',     desc: 'Tu as commencé ton apprentissage',     unlocked: totalLessonsDone >= 1 },
    { id: 'ten',   emoji: '📚', label: '10 leçons terminées', desc: 'Tu prends de bonnes habitudes',         unlocked: totalLessonsDone >= 10 },
    { id: 'first-formation', emoji: '🏅', label: 'Première formation', desc: 'Tu as terminé une formation entière', unlocked: completed.length >= 1 },
    { id: 'three', emoji: '🥉', label: '3 formations finies',  desc: 'Tu construis ta culture LCD',           unlocked: completed.length >= 3 },
    { id: 'streak3', emoji: '🔥', label: 'Streak 3 jours',      desc: '3 jours d\'apprentissage consécutifs', unlocked: streak >= 3 },
    { id: 'streak7', emoji: '⚡', label: 'Streak 7 jours',      desc: 'Une semaine de régularité !',          unlocked: streak >= 7 },
    { id: 'fifty',  emoji: '🌟', label: '50 leçons terminées',  desc: 'Sérieusement engagé',                  unlocked: totalLessonsDone >= 50 },
    { id: 'all',    emoji: '👑', label: 'Toutes les formations',desc: 'Tu as tout terminé — bravo !',         unlocked: completed.length >= 16 },
  ]
  const badgesUnlocked = BADGES_DEFS.filter(b => b.unlocked)
  const badgesLocked = BADGES_DEFS.filter(b => !b.unlocked)

  return (
    <>
      <Header title="Mon profil apprenant" userName={profile.full_name ?? undefined} />
      <div style={s.page}>
        <Link href="/dashboard/formations" style={s.backLink}>
          <ArrowLeft size={14} weight="bold" />
          Toutes les formations
        </Link>

        <div style={s.intro}>
          <h1 style={s.title}>
            Mon <em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>profil apprenant</em>
          </h1>
          <p style={s.desc}>
            Ton activité, tes badges et tes formations en cours.
          </p>
        </div>

        {/* Niveau */}
        <div style={{ ...s.niveauCard, background: niveau.bg, borderColor: `${niveau.color}40` }}>
          <div>
            <div style={s.niveauLabel}>Niveau</div>
            <div style={{ ...s.niveauValue, color: niveau.color }}>{niveau.label}</div>
            <div style={s.niveauDesc}>{niveau.desc}</div>
          </div>
          <Trophy size={40} weight="duotone" color={niveau.color} />
        </div>

        {/* Stats grid */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: 'rgba(96,165,250,0.10)' }}>
              <BookOpen size={16} weight="fill" color="#60a5fa" />
            </span>
            <div>
              <div style={s.statValue}>{totalLessonsDone}</div>
              <div style={s.statLabel}>Leçons terminées</div>
            </div>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: 'rgba(52,211,153,0.10)' }}>
              <GraduationCap size={16} weight="fill" color="#34d399" />
            </span>
            <div>
              <div style={s.statValue}>{completed.length} / {(formations ?? []).length}</div>
              <div style={s.statLabel}>Formations finies</div>
            </div>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: 'rgba(245,158,11,0.10)' }}>
              <Clock size={16} weight="fill" color="#f59e0b" />
            </span>
            <div>
              <div style={s.statValue}>{totalHours}h{remainingMin > 0 ? `${String(remainingMin).padStart(2,'0')}` : ''}</div>
              <div style={s.statLabel}>Temps estimé</div>
            </div>
          </div>
          <div style={s.statCard}>
            <span style={{ ...s.statIcon, background: streak > 0 ? 'rgba(239,68,68,0.10)' : 'var(--surface-2)' }}>
              <Flame size={16} weight="fill" color={streak > 0 ? '#ef4444' : 'var(--text-muted)'} />
            </span>
            <div>
              <div style={{ ...s.statValue, color: streak > 0 ? '#ef4444' : 'var(--text)' }}>
                {streak} {streak > 0 ? 'jours 🔥' : ''}
              </div>
              <div style={s.statLabel}>Streak actuel</div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>
            <Star size={16} weight="fill" color="var(--accent-text)" />
            Badges débloqués <span style={s.sectionCount}>{badgesUnlocked.length} / {BADGES_DEFS.length}</span>
          </h2>
          <div style={s.badgesGrid}>
            {BADGES_DEFS.map(b => (
              <div key={b.id} style={{ ...s.badgeCard, opacity: b.unlocked ? 1 : 0.4 }}>
                <span style={s.badgeEmoji}>{b.emoji}</span>
                <div>
                  <div style={s.badgeLabel}>{b.label}</div>
                  <div style={s.badgeDesc}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* En cours */}
        {inProgress.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>
              <BookOpen size={16} weight="fill" color="var(--accent-text)" />
              Formations en cours <span style={s.sectionCount}>{inProgress.length}</span>
            </h2>
            <div style={s.formationsList}>
              {inProgress.map(uf => {
                const f = formationsById[uf.formation_id]
                if (!f) return null
                return (
                  <Link key={uf.formation_id} href={`/dashboard/formations/${f.slug}`} style={s.formationRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.formationTitle}>{f.title}</div>
                      <div style={s.formationProgressBar}>
                        <div style={{ ...s.formationProgressFill, width: `${uf.progress}%` }} />
                      </div>
                      <div style={s.formationMeta}>{uf.progress}% · {(uf.completed_lessons as number[] | null)?.length ?? 0} / {f.lessons_count} leçons</div>
                    </div>
                    <ArrowRight size={14} weight="bold" color="var(--text-muted)" />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Terminées */}
        {completed.length > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>
              <Trophy size={16} weight="fill" color="#10b981" />
              Formations terminées <span style={s.sectionCount}>{completed.length}</span>
            </h2>
            <div style={s.formationsList}>
              {completed.map(uf => {
                const f = formationsById[uf.formation_id]
                if (!f) return null
                return (
                  <Link key={uf.formation_id} href={`/dashboard/formations/${f.slug}`} style={{ ...s.formationRow, borderLeft: '3px solid #10b981' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.formationTitle}>{f.title}</div>
                      <div style={{ ...s.formationMeta, color: '#10b981', fontWeight: 600 }}>✓ Terminée à 100%</div>
                    </div>
                    <ArrowRight size={14} weight="bold" color="var(--text-muted)" />
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,3vw,44px)', width: '100%', maxWidth: '900px' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', marginBottom: '20px' },
  intro: { marginBottom: '24px' },
  title: { fontFamily: 'var(--font-fraunces), serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' },
  desc: { fontSize: '14px', color: 'var(--text-2)', maxWidth: '520px', lineHeight: 1.6 },

  niveauCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
    padding: '20px 24px',
    border: '1px solid',
    borderRadius: '16px', marginBottom: '16px',
  },
  niveauLabel: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' },
  niveauValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '28px', fontWeight: 500, lineHeight: 1.1, marginTop: '4px' },
  niveauDesc: { fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px' },
  statCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: '12px' },
  statIcon: { width: '32px', height: '32px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontFamily: 'var(--font-fraunces), serif', fontSize: '20px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.1 },
  statLabel: { fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '2px' },

  section: { marginBottom: '28px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-fraunces), serif', fontSize: '17px', fontWeight: 500, color: 'var(--text)', margin: '0 0 12px' },
  sectionCount: { fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' },

  badgesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' },
  badgeCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' },
  badgeEmoji: { fontSize: '26px', flexShrink: 0 },
  badgeLabel: { fontSize: '13px', fontWeight: 600, color: 'var(--text)' },
  badgeDesc: { fontSize: '11.5px', fontWeight: 300, color: 'var(--text-muted)', marginTop: '2px' },

  formationsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  formationRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', textDecoration: 'none', color: 'var(--text-2)' },
  formationTitle: { fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' },
  formationProgressBar: { height: '5px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' },
  formationProgressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent-text), #34D399)', borderRadius: '3px' },
  formationMeta: { fontSize: '11px', color: 'var(--text-muted)' },
}
