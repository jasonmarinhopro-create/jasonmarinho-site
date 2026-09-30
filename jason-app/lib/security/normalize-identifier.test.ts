import { describe, it, expect } from 'vitest'
import { normalizePhone } from './normalize-identifier'

describe('normalizePhone', () => {
  it('garde le + malgré les caractères invisibles d\'un copier-coller', () => {
    expect(normalizePhone('‪+34 687 50 01 52‬')).toBe('+34687500152')
  })
  it('convertit 06 et 0033 en +33', () => {
    expect(normalizePhone('06 30 21 25 92')).toBe('+33630212592')
    expect(normalizePhone('0033 6 30 21 25 92')).toBe('+33630212592')
  })
})
