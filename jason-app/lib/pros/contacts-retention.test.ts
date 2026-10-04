import { describe, it, expect } from 'vitest'
import { proContactsCutoff } from './contacts-retention'

describe('conservation des demandes aux pros (3 ans)', () => {
  it('supprime ce qui a plus de 3 ans', () => {
    expect(proContactsCutoff(new Date('2026-10-04T07:00:00Z'))).toBe('2023-10-04T07:00:00.000Z')
  })
  it('gère le 29 février', () => {
    expect(proContactsCutoff(new Date('2028-02-29T00:00:00Z')).slice(0, 10)).toBe('2025-03-01')
  })
})
