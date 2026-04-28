import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ProfilApprenantUI from './ProfilApprenantUI'

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

  // Stats globales
  const enrolled = ((userFormations ?? []) as Array<{ formation_id: string; progress: number; completed_lessons: number[] | null }>)
    .filter(uf => (uf.progress ?? 0) > 0)
  const completed = enrolled.filter(uf => uf.progress === 100)
  const inProgress = enrolled.filter(uf => uf.progress > 0 && uf.progress < 100)

  const totalLessonsDone = enrolled.reduce(
    (sum, uf) => sum + ((uf.completed_lessons as number[] | null)?.length ?? 0),
    0,
  )

  // Estimation : 15 min par leçon
  const totalMinutes = totalLessonsDone * 15
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMin = totalMinutes % 60

  // Streak — jours consécutifs où au moins 1 leçon a été complétée
  const streak = (() => {
    if (!completionLog || completionLog.length === 0) return 0
    const days = new Set<string>()
    completionLog.forEach((c: { completed_at: string }) => {
      days.add(new Date(c.completed_at).toISOString().slice(0, 10))
    })
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10)
      if (days.has(d)) count++
      else if (i === 0) continue
      else break
    }
    return count
  })()

  // Niveau global
  const niveau =
    totalLessonsDone === 0 ? { label: 'Nouveau', color: 'var(--text-muted)', bg: 'var(--surface)', desc: 'Commence ta première leçon !' } :
    totalLessonsDone < 10 ? { label: 'Apprenti', color: '#2563eb', bg: 'rgba(37,99,235,0.10)', desc: 'Continue, tu prends de l\'élan' } :
    totalLessonsDone < 30 ? { label: 'Praticien', color: '#15803d', bg: 'rgba(21,128,61,0.10)', desc: 'Tu maîtrises les bases' } :
    totalLessonsDone < 60 ? { label: 'Expert', color: 'var(--accent-text)', bg: 'var(--accent-bg)', desc: 'Tu deviens une référence' } :
                            { label: 'Maître', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)', desc: 'Tu connais la LCD sur le bout des doigts' }

  // Badges
  const badges = [
    { id: 'first', emoji: '🎓', label: 'Première leçon',     desc: 'Tu as commencé ton apprentissage',     unlocked: totalLessonsDone >= 1 },
    { id: 'ten',   emoji: '📚', label: '10 leçons terminées', desc: 'Tu prends de bonnes habitudes',         unlocked: totalLessonsDone >= 10 },
    { id: 'first-formation', emoji: '🏅', label: 'Première formation', desc: 'Tu as terminé une formation entière', unlocked: completed.length >= 1 },
    { id: 'three', emoji: '🥉', label: '3 formations finies',  desc: 'Tu construis ta culture LCD',           unlocked: completed.length >= 3 },
    { id: 'streak3', emoji: '🔥', label: 'Streak 3 jours',      desc: '3 jours d\'apprentissage consécutifs', unlocked: streak >= 3 },
    { id: 'streak7', emoji: '⚡', label: 'Streak 7 jours',      desc: 'Une semaine de régularité !',          unlocked: streak >= 7 },
    { id: 'fifty',  emoji: '🌟', label: '50 leçons terminées',  desc: 'Sérieusement engagé',                  unlocked: totalLessonsDone >= 50 },
    { id: 'all',    emoji: '👑', label: 'Toutes les formations',desc: 'Tu as tout terminé — bravo !',         unlocked: completed.length >= 16 },
  ]

  return (
    <>
      <Header title="Mon profil apprenant" userName={profile.full_name ?? undefined} />
      <ProfilApprenantUI
        formations={formations ?? []}
        enrolled={enrolled}
        completed={completed}
        inProgress={inProgress}
        totalLessonsDone={totalLessonsDone}
        totalHours={totalHours}
        remainingMin={remainingMin}
        streak={streak}
        niveau={niveau}
        badges={badges}
      />
    </>
  )
}
