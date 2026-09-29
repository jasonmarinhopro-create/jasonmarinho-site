import 'server-only'

// Suite d'un passage de prospection à court de temps. Le cron Vercel ne
// tourne qu'une fois par jour (Hobby) et une fonction s'arrête à 60 s : avec
// ~7 s entre deux e-mails (limite de débit de la boîte), un passage n'envoie
// que 5 ou 6 e-mails. Le passage relance donc la route du cron, qui continue
// seule (Vercel n'interrompt pas une fonction quand l'appelant raccroche).

/** Nombre maximal de relances par jour : 25 × ~5 e-mails couvrent un plafond de 100. */
export const MAX_OUTREACH_HOPS = 25

export async function relaunchOutreach(hop: number, force: boolean): Promise<boolean> {
  if (hop > MAX_OUTREACH_HOPS) return false
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  if (!base) return false
  const secret = process.env.CRON_SECRET
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3_000)
  try {
    await fetch(`${base}/api/cron/outreach?hop=${hop}${force ? '&force=1' : ''}`, {
      headers: secret ? { authorization: `Bearer ${secret}` } : {},
      signal: ctrl.signal,
      cache: 'no-store',
    })
  } catch {
    // Abandon volontaire après 3 s : la requête est partie, le passage suivant tourne seul
  } finally {
    clearTimeout(timer)
  }
  return true
}
