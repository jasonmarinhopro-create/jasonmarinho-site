import { describe, it, expect } from 'vitest'
import { hasStandardAccess, CONTRACTS_STANDARD_ONLY_MESSAGE } from './access'

describe('hasStandardAccess', () => {
  it('Standard, Driing et admin y ont droit', () => {
    expect(hasStandardAccess('standard')).toBe(true)
    expect(hasStandardAccess('driing')).toBe(true)
    expect(hasStandardAccess('decouverte', 'admin')).toBe(true)
    expect(hasStandardAccess('decouverte', 'user', 'confirmed')).toBe(true)
  })
  it('Découverte ou plan inconnu : non', () => {
    expect(hasStandardAccess('decouverte')).toBe(false)
    expect(hasStandardAccess(null)).toBe(false)
    expect(hasStandardAccess(undefined, 'user')).toBe(false)
    expect(hasStandardAccess('decouverte', 'user', 'pending')).toBe(false)
  })
  it('message sans tiret cadratin', () => {
    expect(CONTRACTS_STANDARD_ONLY_MESSAGE).not.toContain('—')
  })
})
