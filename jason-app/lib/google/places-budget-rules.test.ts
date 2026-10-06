import { describe, it, expect } from 'vitest'
import { PLACES_BUDGET, placesMonth } from './places-budget-rules'

describe('plafonds Google Places', () => {
  it('toujours sous la part gratuite', () => {
    for (const b of Object.values(PLACES_BUDGET)) {
      expect(b.cap).toBeGreaterThan(0)
      expect(b.cap).toBeLessThanOrEqual(b.free * 0.9)
    }
  })

  it('mois à l’heure du Pacifique', () => {
    expect(placesMonth(new Date('2026-10-01T05:00:00Z'))).toBe('2026-09')
    expect(placesMonth(new Date('2026-10-01T09:00:00Z'))).toBe('2026-10')
    expect(placesMonth(new Date('2026-12-31T23:00:00Z'))).toBe('2026-12')
  })
})
