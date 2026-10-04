// Revenus et comptes de la Vue d'ensemble admin (04/10/2026). Avant, seul
// l'abonnement Standard des hôtes comptait : les fiches photographes et
// ménage payées n'apparaissaient nulle part, et un photographe sans
// abonnement hôte était affiché « Découverte ».

export const PRICES = {
  standard: 19.98,         // € TTC / an, abonnement hôte
  proFondateur: 39.98,     // € TTC / an à vie, 20 premiers de chaque annuaire
  proStandard: 79.98,      // € TTC / an
} as const

const PAID = new Set(['active', 'trialing', 'past_due'])

export interface ProRow {
  user_id: string | null
  tier: string | null
  status: string | null
  stripe_subscription_status: string | null
}

export const isPaidPro = (r: Pick<ProRow, 'stripe_subscription_status'>) => PAID.has(r.stripe_subscription_status ?? '')

export const proAnnualPrice = (tier: string | null) => tier === 'fondateur' ? PRICES.proFondateur : PRICES.proStandard

export function computeRevenue({ standardMembers, photographers, cleaners }: {
  standardMembers: number
  photographers: ProRow[]
  cleaners: ProRow[]
}) {
  const paidPh = photographers.filter(isPaidPro)
  const paidCl = cleaners.filter(isPaidPro)
  const hostAnnual = standardMembers * PRICES.standard
  const photoAnnual = paidPh.reduce((n, r) => n + proAnnualPrice(r.tier), 0)
  const cleanAnnual = paidCl.reduce((n, r) => n + proAnnualPrice(r.tier), 0)
  const annual = hostAnnual + photoAnnual + cleanAnnual
  const subscriptions = standardMembers + paidPh.length + paidCl.length
  return {
    annual,
    monthly: annual / 12,
    hostAnnual, photoAnnual, cleanAnnual,
    paidPhotographers: paidPh.length,
    paidCleaners: paidCl.length,
    subscriptions,
  }
}

/** Espaces pros d'un compte, pour les listes de membres */
export function proSpacesByUser(photographers: ProRow[], cleaners: ProRow[]) {
  const map = new Map<string, Array<{ kind: 'photographe' | 'menage'; tier: string | null; paid: boolean; status: string | null }>>()
  const add = (r: ProRow, kind: 'photographe' | 'menage') => {
    if (!r.user_id) return
    const list = map.get(r.user_id) ?? []
    list.push({ kind, tier: r.tier, paid: isPaidPro(r), status: r.status })
    map.set(r.user_id, list)
  }
  photographers.forEach(r => add(r, 'photographe'))
  cleaners.forEach(r => add(r, 'menage'))
  return map
}
