import 'server-only'

/** Secret qui signe les liens de désinscription des membres (déjà présent dans Vercel pour les crons). */
export function memberMailSecret(): string {
  return process.env.CRON_SECRET || process.env.SOCIAL_CRON_SECRET || ''
}
