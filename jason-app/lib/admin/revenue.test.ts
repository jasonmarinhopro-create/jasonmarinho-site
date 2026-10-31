import { describe, it, expect } from 'vitest'
import { computeRevenue, proSpacesByUser, hostAnnualPrice } from './revenue'
import { STRIPE_PLANS } from '@/lib/constants/stripe-plans'

describe('computeRevenue', () => {
  it('additionne Standard et fiches pros payées', () => {
    const r = computeRevenue({
      standardMembers: 3,
      photographers: [
        { user_id: 'a', tier: 'fondateur', status: 'active', stripe_subscription_status: 'active' },
        { user_id: 'b', tier: 'standard', status: 'pending', stripe_subscription_status: null },
      ],
      cleaners: [{ user_id: 'c', tier: 'standard', status: 'active', stripe_subscription_status: 'trialing' }],
    })
    expect(r.paidPhotographers).toBe(1)
    expect(r.paidCleaners).toBe(1)
    expect(r.subscriptions).toBe(5)
    expect(r.annual).toBeCloseTo(3 * 19.98 + 39.98 + 79.98, 5)
    expect(r.monthly).toBeCloseTo(r.annual / 12, 5)
  })
  it('prix réel de chaque abonnement Standard', () => {
    expect(hostAnnualPrice(STRIPE_PLANS.STANDARD_PUBLIC_YEARLY)).toBe(38.98)
    expect(hostAnnualPrice(STRIPE_PLANS.STANDARD_FOUNDING_YEARLY)).toBe(19.98)
    expect(hostAnnualPrice(null)).toBe(19.98)
    const r = computeRevenue({ standardMembers: 0, standardPriceIds: [STRIPE_PLANS.STANDARD_FOUNDING_YEARLY, STRIPE_PLANS.STANDARD_PUBLIC_YEARLY], photographers: [], cleaners: [] })
    expect(r.subscriptions).toBe(2)
    expect(r.annual).toBeCloseTo(19.98 + 38.98, 5)
  })
  it('compte les fiches dépannage payées (3e annuaire)', () => {
    const r = computeRevenue({
      standardMembers: 0, photographers: [], cleaners: [],
      depannage: [
        { user_id: 'd', tier: 'fondateur', status: 'active', stripe_subscription_status: 'active' },
        { user_id: 'e', tier: 'standard', status: 'pending_payment', stripe_subscription_status: 'incomplete' },
      ],
    })
    expect(r.paidDepannage).toBe(1)
    expect(r.depAnnual).toBeCloseTo(39.98, 5)
    expect(r.subscriptions).toBe(1)
    expect(proSpacesByUser([], [], [{ user_id: 'd', tier: 'fondateur', status: 'active', stripe_subscription_status: 'active' }]).get('d')?.[0].kind).toBe('depannage')
  })
  it('ignore les abonnements annulés', () => {
    const r = computeRevenue({ standardMembers: 0, photographers: [{ user_id: 'a', tier: 'fondateur', status: 'cancelled', stripe_subscription_status: 'canceled' }], cleaners: [] })
    expect(r.annual).toBe(0)
  })
})

describe('proSpacesByUser', () => {
  it('regroupe les fiches par compte', () => {
    const m = proSpacesByUser(
      [{ user_id: 'u', tier: 'fondateur', status: 'active', stripe_subscription_status: 'active' }],
      [{ user_id: 'u', tier: 'standard', status: 'pending', stripe_subscription_status: null }, { user_id: null, tier: null, status: null, stripe_subscription_status: null }],
    )
    expect(m.get('u')).toEqual([
      { kind: 'photographe', tier: 'fondateur', paid: true, status: 'active' },
      { kind: 'menage', tier: 'standard', paid: false, status: 'pending' },
    ])
    expect(m.size).toBe(1)
  })
})
