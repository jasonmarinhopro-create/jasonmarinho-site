import { describe, it, expect } from 'vitest'
import { PAYMENT_FEES, PAYMENT_FEES_LABEL, paymentFee } from './payment-fees'

// Doit rester identique à la règle active dans Stripe (Connect → Tarification)
describe('frais de paiement en ligne', () => {
  it('reprend la règle Stripe : 2 % + 0,30 €', () => {
    expect(PAYMENT_FEES.pct).toBe(2)
    expect(PAYMENT_FEES.fixed).toBe(0.3)
    expect(PAYMENT_FEES.ukCard).toBe(1)
    expect(PAYMENT_FEES.nonEuropeCard).toBe(1.75)
    expect(PAYMENT_FEES.currencyConversion).toBe(2)
  })
  it('affiche le libellé en français', () => {
    expect(PAYMENT_FEES_LABEL).toBe('2 % + 0,30 €')
  })
  it('calcule les exemples donnés dans l\'aide et à Jason', () => {
    expect(paymentFee(350)).toBe(7.3)
    expect(paymentFee(312.4)).toBe(6.55)
    expect(paymentFee(500)).toBe(10.3)
  })
  it('couvre au moins les frais de Stripe d\'une carte européenne + le virement', () => {
    for (const amount of [20, 80, 156.2, 312.4, 1000, 4500]) {
      const stripeCost = amount * 0.015 + 0.25 + amount * 0.0025 + 0.1
      expect(paymentFee(amount)).toBeGreaterThanOrEqual(Math.round(stripeCost * 100) / 100 - 0.01)
    }
  })
})
