import { describe, it, expect } from 'vitest'
import { holdCutoff, founderSeatFilter, holdsSeat, tierFor, canResumePayment } from './founder-seats'

const NOW = new Date('2026-10-14T10:00:00.123Z')

describe('places Fondateur', () => {
  it('coupe 7 jours avant, sans millisecondes', () => {
    expect(holdCutoff(NOW)).toBe('2026-10-07T10:00:00Z')
    expect(founderSeatFilter(NOW)).toBe(
      'status.in.(active,approved_pending_payment),and(status.eq.pending_payment,created_at.gte.2026-10-07T10:00:00Z)',
    )
  })

  it('une fiche payée garde sa place, un paiement abandonné la rend après 7 jours', () => {
    expect(holdsSeat({ status: 'active', created_at: '2026-01-01T00:00:00Z' }, NOW)).toBe(true)
    expect(holdsSeat({ status: 'approved_pending_payment', created_at: '2026-01-01T00:00:00Z' }, NOW)).toBe(true)
    expect(holdsSeat({ status: 'pending_payment', created_at: '2026-10-10T00:00:00Z' }, NOW)).toBe(true)
    expect(holdsSeat({ status: 'pending_payment', created_at: '2026-10-01T00:00:00Z' }, NOW)).toBe(false)
    expect(holdsSeat({ status: 'canceled', created_at: '2026-10-13T00:00:00Z' }, NOW)).toBe(false)
  })

  it('palier selon les places prises par les autres', () => {
    expect(tierFor(19)).toBe('fondateur')
    expect(tierFor(20)).toBe('standard')
  })

  it('reprise du paiement seulement pour une fiche qui attend et sans abonnement en cours', () => {
    expect(canResumePayment({ status: 'pending_payment', stripe_subscription_status: null })).toBe(true)
    expect(canResumePayment({ status: 'pending_payment', stripe_subscription_status: 'incomplete_expired' })).toBe(true)
    expect(canResumePayment({ status: 'pending_payment', stripe_subscription_status: 'active' })).toBe(false)
    expect(canResumePayment({ status: 'active', stripe_subscription_status: null })).toBe(false)
  })
})
