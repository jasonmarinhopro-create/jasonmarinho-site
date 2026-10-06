import { describe, it, expect } from 'vitest'
import { isDemoFiche, splitDemo } from './demo'

describe("fiches d'exemple", () => {
  const admins = new Set(['jason'])
  it('une fiche rattachée à un compte admin est un exemple', () => {
    expect(isDemoFiche({ user_id: 'jason' }, admins)).toBe(true)
    expect(isDemoFiche({ user_id: 'pro' }, admins)).toBe(false)
    expect(isDemoFiche({ user_id: null }, admins)).toBe(false)
    expect(isDemoFiche({}, admins)).toBe(false)
  })
  it('sépare les vraies fiches des exemples', () => {
    const { real, demo } = splitDemo([{ id: 1, user_id: 'jason' }, { id: 2, user_id: 'pro' }, { id: 3, user_id: null }], admins)
    expect(real.map(r => r.id)).toEqual([2, 3])
    expect(demo.map(r => r.id)).toEqual([1])
  })
})
