import { describe, it, expect } from 'vitest'
import { isNouvelleFormation, derniereNouvelleFormationAt } from './nouveau'

const now = new Date('2026-10-26T12:00:00Z')

describe('isNouvelleFormation', () => {
  it('nouvelle pendant 45 jours', () => {
    expect(isNouvelleFormation('2026-10-26T08:00:00Z', now)).toBe(true)
    expect(isNouvelleFormation('2026-09-12T13:00:00Z', now)).toBe(true)
    expect(isNouvelleFormation('2026-09-11T11:00:00Z', now)).toBe(false)
  })
  it('ignore les dates absentes, invalides ou futures', () => {
    expect(isNouvelleFormation(null, now)).toBe(false)
    expect(isNouvelleFormation('pas une date', now)).toBe(false)
    expect(isNouvelleFormation('2026-11-01T00:00:00Z', now)).toBe(false)
  })
})

describe('derniereNouvelleFormationAt', () => {
  it('rend la plus récente des nouvelles, sinon null', () => {
    expect(derniereNouvelleFormationAt([{ created_at: '2026-10-01T00:00:00Z' }, { created_at: '2026-10-20T00:00:00Z' }, { created_at: '2026-01-01T00:00:00Z' }], now)).toBe('2026-10-20T00:00:00Z')
    expect(derniereNouvelleFormationAt([{ created_at: '2026-01-01T00:00:00Z' }, { created_at: null }], now)).toBeNull()
  })
})
