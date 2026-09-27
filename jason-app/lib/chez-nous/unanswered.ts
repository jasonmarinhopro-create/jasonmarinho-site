// Questions & réponses (ex-forum Entre Hôtes, sept. 2026) : la page promet
// « réponse sous 48 h, par Jason ou un hôte ». Pour tenir la promesse, Jason
// reçoit un email à chaque nouvelle question (createPost) et un rappel
// quotidien des questions restées sans réponse (cron notifications-engine).

import { CATEGORIES, isValidCategory } from './categories'

export const ANSWER_PROMISE_HOURS = 48
/** Rappel dès 24 h sans réponse : il reste 24 h pour tenir les 48 h promises */
export const REMIND_AFTER_HOURS = 24
/** Au-delà, la question n'est plus rappelée (vieux sujets, fils de discussion) */
export const REMIND_MAX_DAYS = 14

export type QuestionRow = {
  id: string
  author_id: string
  title: string
  category: string
  reply_count: number
  created_at: string
}

/** Questions à relancer : sans réponse depuis 24 h (et moins de 14 jours), hors posts des admins. */
export function unansweredQuestions(posts: QuestionRow[], adminIds: Set<string>, now: Date = new Date()): QuestionRow[] {
  const hour = 3600_000
  return posts
    .filter(p => p.reply_count === 0 && !adminIds.has(p.author_id))
    .filter(p => {
      const age = now.getTime() - new Date(p.created_at).getTime()
      return age >= REMIND_AFTER_HOURS * hour && age <= REMIND_MAX_DAYS * 24 * hour
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

function categoryLabel(c: string): string {
  return isValidCategory(c) ? CATEGORIES[c].label : c
}

/** Heures restantes avant de dépasser la promesse (négatif = en retard). */
export function hoursLeft(createdAt: string, now: Date = new Date()): number {
  return Math.round(ANSWER_PROMISE_HOURS - (now.getTime() - new Date(createdAt).getTime()) / 3600_000)
}

export function newQuestionEmail(opts: {
  authorName: string
  title: string
  body: string
  category: string
  postUrl: string
}): { subject: string; text: string } {
  const excerpt = opts.body.length > 600 ? `${opts.body.slice(0, 600)}…` : opts.body
  return {
    subject: `Nouvelle question : ${opts.title}`.slice(0, 150),
    text: [
      `${opts.authorName} a posé une question (${categoryLabel(opts.category)}).`,
      '',
      opts.title,
      '',
      excerpt,
      '',
      `Répondre (promesse : sous ${ANSWER_PROMISE_HOURS} h) : ${opts.postUrl}`,
    ].join('\n'),
  }
}

export function unansweredDigestEmail(questions: QuestionRow[], appUrl: string, now: Date = new Date()): { subject: string; text: string } {
  const n = questions.length
  const lines = questions.map(q => {
    const left = hoursLeft(q.created_at, now)
    const when = left > 0 ? `il reste ${left} h` : `en retard de ${-left} h`
    return `- ${q.title} (${categoryLabel(q.category)}, ${when})\n  ${appUrl}/dashboard/chez-nous/${q.id}`
  })
  return {
    subject: `${n} question${n > 1 ? 's' : ''} sans réponse`,
    text: [
      `${n} question${n > 1 ? 's attendent' : ' attend'} une réponse depuis plus de ${REMIND_AFTER_HOURS} h :`,
      '',
      ...lines,
      '',
      `Si tu ne connais pas la réponse, mentionne un hôte qui connaît le sujet avec @pseudo.`,
    ].join('\n'),
  }
}
