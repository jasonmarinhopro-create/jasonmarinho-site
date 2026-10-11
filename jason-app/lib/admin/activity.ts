// Dernière visite et dernière action d'un membre (11/10/2026, demande de
// Jason : « la dernière fois que la personne s'est connectée et sa dernière
// action », dans Membres). Pur et testé (activity.test.ts).

export type ActivityKind =
  | 'logement' | 'calendrier' | 'sejour' | 'voyageur' | 'contrat' | 'revenu'
  | 'evenement' | 'question' | 'reponse' | 'formation' | 'audit'

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  logement: 'A ajouté un logement',
  calendrier: 'A connecté un calendrier',
  sejour: 'A enregistré une réservation',
  voyageur: 'A ajouté un voyageur',
  contrat: 'A créé un contrat',
  revenu: 'A saisi un revenu',
  evenement: 'A ajouté un événement au calendrier',
  question: 'A posé une question',
  reponse: 'A répondu à une question',
  formation: 'A commencé une formation',
  audit: 'A fait l’audit de sa fiche Google',
}

export interface ActivityRow { userId: string; at: string; kind: ActivityKind }
export interface MemberActivity {
  /** Dernière visite connue : la plus récente entre la visite notée par l'app et la dernière connexion */
  lastSeenAt: string | null
  lastAction: { at: string; kind: ActivityKind; label: string } | null
}

const later = (a: string | null | undefined, b: string | null | undefined) => {
  if (!a) return b ?? null
  if (!b) return a
  return Date.parse(a) >= Date.parse(b) ? a : b
}

export function buildMemberActivity(input: {
  rows: ActivityRow[]
  seen: Map<string, string | null>
  signIns: Map<string, string | null>
}): Map<string, MemberActivity> {
  const out = new Map<string, MemberActivity>()
  const get = (id: string) => {
    let m = out.get(id)
    if (!m) { m = { lastSeenAt: null, lastAction: null }; out.set(id, m) }
    return m
  }
  for (const [id, at] of input.seen) get(id).lastSeenAt = later(get(id).lastSeenAt, at)
  for (const [id, at] of input.signIns) get(id).lastSeenAt = later(get(id).lastSeenAt, at)
  for (const r of input.rows) {
    if (!r.userId || !r.at || Number.isNaN(Date.parse(r.at))) continue
    const m = get(r.userId)
    if (!m.lastAction || Date.parse(r.at) > Date.parse(m.lastAction.at)) {
      m.lastAction = { at: r.at, kind: r.kind, label: ACTIVITY_LABELS[r.kind] }
    }
    // Une action prouve une visite : la dernière visite n'est jamais plus ancienne
    m.lastSeenAt = later(m.lastSeenAt, r.at)
  }
  return out
}

/** « aujourd'hui », « hier », « il y a 5 jours », « il y a 3 mois » (jours à l'heure de Paris) */
export function sinceLabel(iso: string | null, now: Date): string {
  if (!iso) return 'Jamais'
  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const days = Math.round((Date.parse(day(now)) - Date.parse(day(new Date(iso)))) / 86_400_000)
  if (days <= 0) return 'Aujourd’hui'
  if (days === 1) return 'Hier'
  if (days < 30) return `Il y a ${days} jours`
  const months = Math.round(days / 30.4)
  if (months < 12) return `Il y a ${months} mois`
  const years = Math.round(days / 365)
  return `Il y a ${years} an${years > 1 ? 's' : ''}`
}

/** Pastille d'activité : actif (7 jours), à relancer (8 à 30 jours), endormi (au-delà ou jamais) */
export function activityLevel(iso: string | null, now: Date): 'actif' | 'tiede' | 'endormi' {
  if (!iso) return 'endormi'
  const days = (now.getTime() - Date.parse(iso)) / 86_400_000
  if (days <= 7) return 'actif'
  if (days <= 30) return 'tiede'
  return 'endormi'
}
