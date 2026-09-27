// Questions & réponses : plafond de questions pour la formule gratuite
// (décision de Jason, sept. 2026). Chaque question engage une réponse de
// Jason sous 48 h : la formule Découverte en pose 2 par mois calendaire,
// Standard et Driing sont illimités. Les réponses ne sont jamais limitées.

export const FREE_MONTHLY_QUESTIONS = 2

export type Plan = 'decouverte' | 'standard' | 'driing'

/** 1er jour du mois courant à 00:00, heure de Paris, en ISO UTC. */
export function monthStartIso(now: Date = new Date()): string {
  // Date du jour à Paris (le compteur repart le 1er à minuit, heure française)
  const [y, m] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit' })
    .format(now).split('-').map(Number)
  // Minuit à Paris = 22 h ou 23 h UTC la veille : on calcule le décalage réel du 1er du mois
  const utcMidnight = Date.UTC(y, m - 1, 1)
  const parisHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hourCycle: 'h23' })
    .format(new Date(utcMidnight)))
  return new Date(utcMidnight - parisHour * 3600_000).toISOString()
}

/** Questions restantes ce mois-ci, ou null si illimité. */
export function questionsLeft(plan: Plan, askedThisMonth: number): number | null {
  if (plan !== 'decouverte') return null
  return Math.max(0, FREE_MONTHLY_QUESTIONS - askedThisMonth)
}

export const QUOTA_REACHED_MESSAGE =
  `Tu as posé tes ${FREE_MONTHLY_QUESTIONS} questions du mois avec la formule gratuite. Le compteur repart le 1er du mois, ou passe en Standard pour poser tes questions sans limite.`
