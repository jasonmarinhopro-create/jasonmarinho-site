// Revenus et comptes de la Vue d'ensemble admin (04/10/2026). Avant, seul
// l'abonnement Standard des hôtes comptait : les fiches photographes et
// ménage payées n'apparaissaient nulle part, et un photographe sans
// abonnement hôte était affiché « Découverte ».

import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'

export const PRICES = {
  standard: 19.98,         // € TTC / an, abonnement hôte au tarif Fondateur
  standardPublic: 38.98,   // € TTC / an, abonnement hôte après l'offre Fondateur
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

/**
 * Prix annuel de l'abonnement Standard d'un hôte d'après son prix Stripe (20/10/2026 : tout
 * était compté à 19,98 €, même les abonnés au tarif public). Anciens prix mensuels : 1,98 € et
 * 3,98 € par mois. Prix inconnu : tarif Fondateur.
 */
export function hostAnnualPrice(priceId: string | null | undefined): number {
  switch (priceId) {
    case STRIPE_PLANS.STANDARD_PUBLIC_YEARLY: return PRICES.standardPublic
    case STRIPE_PLANS.STANDARD_PUBLIC_MONTHLY: return 3.98 * 12
    case STRIPE_PLANS.STANDARD_FOUNDING_MONTHLY: return 1.98 * 12
    default: return PRICES.standard
  }
}

export function computeRevenue({ standardMembers, standardPriceIds, photographers, cleaners, depannage = [] }: {
  standardMembers: number
  /** Prix Stripe de chaque abonné Standard, quand on les a : remplace standardMembers × 19,98 € */
  standardPriceIds?: Array<string | null>
  photographers: ProRow[]
  cleaners: ProRow[]
  /** Fiches dépannage et maintenance (3e annuaire, 31/10/2026) */
  depannage?: ProRow[]
}) {
  if (standardPriceIds) standardMembers = standardPriceIds.length
  const paidPh = photographers.filter(isPaidPro)
  const paidCl = cleaners.filter(isPaidPro)
  const paidDep = depannage.filter(isPaidPro)
  const hostAnnual = standardPriceIds ? standardPriceIds.reduce((n, id) => n + hostAnnualPrice(id), 0) : standardMembers * PRICES.standard
  const photoAnnual = paidPh.reduce((n, r) => n + proAnnualPrice(r.tier), 0)
  const cleanAnnual = paidCl.reduce((n, r) => n + proAnnualPrice(r.tier), 0)
  const depAnnual = paidDep.reduce((n, r) => n + proAnnualPrice(r.tier), 0)
  const annual = hostAnnual + photoAnnual + cleanAnnual + depAnnual
  const subscriptions = standardMembers + paidPh.length + paidCl.length + paidDep.length
  return {
    annual,
    monthly: annual / 12,
    hostAnnual, photoAnnual, cleanAnnual, depAnnual,
    paidPhotographers: paidPh.length,
    paidCleaners: paidCl.length,
    paidDepannage: paidDep.length,
    subscriptions,
  }
}

/** Espaces pros d'un compte, pour les listes de membres */
export type ProSpaceKind = 'photographe' | 'menage' | 'depannage'

export function proSpacesByUser(photographers: ProRow[], cleaners: ProRow[], depannage: ProRow[] = []) {
  const map = new Map<string, Array<{ kind: ProSpaceKind; tier: string | null; paid: boolean; status: string | null }>>()
  const add = (r: ProRow, kind: ProSpaceKind) => {
    if (!r.user_id) return
    const list = map.get(r.user_id) ?? []
    list.push({ kind, tier: r.tier, paid: isPaidPro(r), status: r.status })
    map.set(r.user_id, list)
  }
  photographers.forEach(r => add(r, 'photographe'))
  cleaners.forEach(r => add(r, 'menage'))
  depannage.forEach(r => add(r, 'depannage'))
  return map
}
