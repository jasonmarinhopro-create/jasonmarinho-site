// Stories « Nouvelle demande » à l'heure (28/11/2026, accord de Jason) : les
// passages planifiés de GitHub partent avec des heures de retard, et le
// passage horaire des demandes ne tournait presque jamais. À chaque demande
// d'hôte, l'app lance elle-même le workflow « Réseaux sociaux » (tâche
// « demandes ») par l'API GitHub, avec un jeton qui n'a que ce droit
// (GITHUB_DISPATCH_TOKEN, Vercel). Sans jeton : rien, le passage horaire reste.
// La nuit (21 h à 8 h, Paris) : rien non plus, pas de story à 3 h du matin ;
// le passage horaire du matin prend le relais.
import { logger } from '@/lib/logger'

const log = logger('social-dispatch-demandes')
const REPO = 'jasonmarinhopro-create/jasonmarinho-site'
const WORKFLOW = 'reseaux-sociaux.yml'

/** Heure de Paris (0 à 23). */
export function heureParis(now: Date): number {
  const part = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now).find(p => p.type === 'hour')
  return Number(part?.value ?? 0)
}

/** Annonce tout de suite seulement de 8 h à 21 h (Paris). */
export function annonceImmediate(now: Date): boolean {
  const h = heureParis(now)
  return h >= 8 && h < 21
}

/** Lance la tâche « demandes » du workflow. Ne lève jamais : la demande de l'hôte passe avant tout. */
export async function lancerStoriesDemandes(now = new Date()): Promise<'lance' | 'sans-jeton' | 'nuit' | 'echec'> {
  const token = process.env.GITHUB_DISPATCH_TOKEN
  if (!token) return 'sans-jeton'
  if (!annonceImmediate(now)) return 'nuit'
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'main', inputs: { taches: 'demandes' } }),
    })
    if (res.status === 204) return 'lance'
    log.warn('lancement du workflow refusé', { status: res.status })
    return 'echec'
  } catch (err) {
    log.warn('lancement du workflow impossible', { err: err instanceof Error ? err.message : String(err) })
    return 'echec'
  }
}
