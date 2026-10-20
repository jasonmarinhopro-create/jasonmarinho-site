import { describe, it, expect } from 'vitest'
import { pickCustomer } from './customer-pick'

describe('client Stripe à réutiliser', () => {
  it('aucun : on en crée un', () => expect(pickCustomer([])).toBeUndefined())
  it('carte enregistrée d’abord, sinon le plus ancien', () => {
    expect(pickCustomer([{ id: 'b', created: 2, hasPaymentMethod: false }, { id: 'a', created: 1, hasPaymentMethod: false }])).toBe('a')
    expect(pickCustomer([{ id: 'a', created: 1, hasPaymentMethod: false }, { id: 'c', created: 3, hasPaymentMethod: true }])).toBe('c')
  })
  it('doublons de la double recherche ignorés', () => {
    expect(pickCustomer([{ id: 'a', created: 1, hasPaymentMethod: false }, { id: 'a', created: 1, hasPaymentMethod: false }])).toBe('a')
  })
})
