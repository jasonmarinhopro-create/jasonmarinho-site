// Progression dans une formation : calculs purs (test à côté).

export interface LessonRef { moduleId: number; lessonId: number; title: string }

export function flatLessons(modules: Array<{ id: number; lessons: Array<{ id: number; title: string }> }>): LessonRef[] {
  return modules.flatMap(m => m.lessons.map(l => ({ moduleId: m.id, lessonId: l.id, title: l.title })))
}

/** Première leçon pas encore terminée (reprise), ou null si tout est fait. */
export function firstIncomplete(all: LessonRef[], completed: number[]): LessonRef | null {
  const done = new Set(completed)
  return all.find(l => !done.has(l.lessonId)) ?? null
}

/** Leçon demandée dans l'adresse (?lecon=12), si elle existe. */
export function lessonFromParam(all: LessonRef[], param: string | null): LessonRef | null {
  if (!param || !/^\d+$/.test(param)) return null
  const id = Number(param)
  return all.find(l => l.lessonId === id) ?? null
}

export function percent(completed: number[], total: number): number {
  if (total <= 0) return 0
  const n = new Set(completed).size
  return Math.min(100, Math.round((n / total) * 100))
}

/** Score aux questions : 1re réponse de chaque question. */
export function quizScore(answers: Array<{ correct: boolean }>): { good: number; total: number } {
  return { good: answers.filter(a => a.correct).length, total: answers.length }
}
