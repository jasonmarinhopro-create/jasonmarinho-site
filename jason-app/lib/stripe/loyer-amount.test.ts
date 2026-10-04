import { describe, it, expect } from 'vitest'
import { loyerChargeCents } from './loyer-amount'

describe('loyerChargeCents', () => {
  it("n'encaisse que l'acompte", () => {
    expect(loyerChargeCents(480, 50)).toBe(24000)
    expect(loyerChargeCents(480, 100)).toBe(48000)
  })
  it('arrondit au centime', () => {
    expect(loyerChargeCents(333.33, 50)).toBe(16667)
  })
  it('retombe sur 100 % si le pourcentage est invalide', () => {
    expect(loyerChargeCents(200, NaN)).toBe(20000)
    expect(loyerChargeCents(200, 0)).toBe(20000)
  })
})
