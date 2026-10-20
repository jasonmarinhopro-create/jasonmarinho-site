import { describe, it, expect } from 'vitest'
import { isUnpaidFiche, subscriptionAction } from './paid'

describe('fiche pro payée ou non', () => {
  it('attente de paiement', () => {
    expect(isUnpaidFiche({ status: 'pending_payment', stripe_subscription_status: null })).toBe(true)
    expect(isUnpaidFiche({ status: 'pending_payment', stripe_subscription_status: 'incomplete' })).toBe(true)
    expect(isUnpaidFiche({ status: 'active', stripe_subscription_status: 'incomplete' })).toBe(true)
    expect(isUnpaidFiche({ status: 'active', stripe_subscription_status: 'incomplete_expired' })).toBe(true)
  })
  it('payée ou déjà payée une fois : jamais supprimable comme une inscription abandonnée', () => {
    expect(isUnpaidFiche({ status: 'active', stripe_subscription_status: 'active' })).toBe(false)
    expect(isUnpaidFiche({ status: 'active', stripe_subscription_status: 'past_due' })).toBe(false)
    expect(isUnpaidFiche({ status: 'active', stripe_subscription_status: null })).toBe(false)
    expect(isUnpaidFiche({ status: 'hidden', stripe_subscription_status: 'incomplete' })).toBe(false)
  })
  it('activation seulement une fois payé', () => {
    expect(subscriptionAction('pending_payment', 'incomplete')).toBe('ignorer')
    expect(subscriptionAction('pending_payment', 'active')).toBe('activer')
    expect(subscriptionAction('approved_pending_payment', 'trialing')).toBe('activer')
    expect(subscriptionAction('active', 'incomplete')).toBe('remettre_en_attente')
    expect(subscriptionAction('active', 'past_due')).toBe('suivre')
    expect(subscriptionAction('hidden', 'active')).toBe('ignorer')
  })
})
