// Tableau « Où en sont tes membres » de la Vue d'ensemble admin (19/11/2026,
// maquette validée par Jason). Calcul pur (testé) : comptes admin exclus,
// chaque étape compte les membres qui l'ont atteinte au moins une fois.

export interface ActivationInput {
  profiles: Array<{ id: string; role: string | null; plan: string | null; created_at: string | null; last_seen_at: string | null; stripe_onboarding_complete: boolean | null }>
  logementUsers: Array<string | null>
  icalUsers: Array<string | null>
  contractUsers: Array<string | null>
  now: Date
}

export interface Activation {
  inscrits: number
  logement: number
  calendrier: number
  contrat: number
  stripe: number
  standard: number
  driing: number
  actifs30: number
  actifs7: number
  inscrits30: number
  sansLogement: number
  sansLogement30: number
}

const DAY = 86_400_000

export function computeActivation(i: ActivationInput): Activation {
  const members = i.profiles.filter(p => p.role !== 'admin')
  const ids = new Set(members.map(m => m.id))
  const has = (list: Array<string | null>) => {
    const set = new Set(list.filter((u): u is string => !!u && ids.has(u)))
    return set
  }
  const withLogement = has(i.logementUsers)
  const since = (iso: string | null, days: number) => !!iso && i.now.getTime() - new Date(iso).getTime() <= days * DAY
  const noLogement = members.filter(m => !withLogement.has(m.id))
  return {
    inscrits: members.length,
    logement: withLogement.size,
    calendrier: has(i.icalUsers).size,
    contrat: has(i.contractUsers).size,
    stripe: members.filter(m => m.stripe_onboarding_complete).length,
    standard: members.filter(m => m.plan === 'standard').length,
    driing: members.filter(m => m.plan === 'driing').length,
    actifs30: members.filter(m => since(m.last_seen_at, 30)).length,
    actifs7: members.filter(m => since(m.last_seen_at, 7)).length,
    inscrits30: members.filter(m => since(m.created_at, 30)).length,
    sansLogement: noLogement.length,
    sansLogement30: noLogement.filter(m => since(m.created_at, 30)).length,
  }
}

/** Part en pourcentage arrondi (0 si aucun inscrit) */
export function part(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0
}
