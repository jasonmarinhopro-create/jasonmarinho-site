import { describe, it, expect } from 'vitest'
import { computeRevenue, proSpacesByUser } from './revenue'

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
