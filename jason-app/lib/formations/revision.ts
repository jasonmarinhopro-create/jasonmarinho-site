// Révision à 7 jours (23/11/2026, docs/claude/formations.md) : les questions
// auxquelles le membre a répondu il y a au moins 7 jours, pas encore revues,
// reposées sur l'Accueil. Calcul pur (test à côté).
import { parseLesson } from './blocks'

export const REVISION_DELAY_DAYS = 7
export const REVISION_MAX = 3

export interface AnswerRow { formation_id: string; lesson_id: number; question: number; answered_at: string }
export interface RevisionQuestion {
  formationId: string
  slug: string
  formationTitle: string
  lessonId: number
  question: number
  text: string
  options: Array<{ text: string; correct: boolean }>
  explanation: string
}

type Content = { title: string; modules: Array<{ lessons: Array<{ id: number; content: string }> }> }

/** Questions à revoir : les plus anciennes d'abord, au plus une par leçon. */
export function pickRevision(
  rows: AnswerRow[],
  formations: Map<string, { slug: string; content: Content }>,
  now: Date,
  max = REVISION_MAX,
): RevisionQuestion[] {
  const limit = now.getTime() - REVISION_DELAY_DAYS * 24 * 3600 * 1000
  const out: RevisionQuestion[] = []
  const seenLessons = new Set<string>()
  const sorted = [...rows].sort((a, b) => a.answered_at.localeCompare(b.answered_at))
  for (const r of sorted) {
    if (out.length >= max) break
    if (new Date(r.answered_at).getTime() > limit) continue
    const key = `${r.formation_id}:${r.lesson_id}`
    if (seenLessons.has(key)) continue
    const f = formations.get(r.formation_id)
    if (!f) continue
    const lesson = f.content.modules.flatMap(m => m.lessons).find(l => l.id === r.lesson_id)
    if (!lesson) continue
    const q = parseLesson(lesson.content).find(b => b.type === 'quiz' && b.index === r.question)
    if (!q || q.type !== 'quiz') continue
    seenLessons.add(key)
    out.push({
      formationId: r.formation_id, slug: f.slug, formationTitle: f.content.title,
      lessonId: r.lesson_id, question: r.question, text: q.question, options: q.options, explanation: q.explanation,
    })
  }
  return out
}

/** Début de la semaine (lundi 0 h, heure de Paris), en ISO UTC. */
export function weekStartParis(now: Date): string {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', hourCycle: 'h23' })
  const p = Object.fromEntries(f.formatToParts(now).map(x => [x.type, x.value]))
  const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday)
  const day = new Date(Date.UTC(+p.year, +p.month - 1, +p.day - wd))
  // Minuit à Paris = 23 h ou 22 h UTC la veille selon l'heure d'été
  const probe = new Date(day.getTime() + 12 * 3600 * 1000)
  const offH = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hourCycle: 'h23' }).format(probe) - 12
  return new Date(day.getTime() - offH * 3600 * 1000).toISOString()
}

export const WEEKLY_GOAL = 2
