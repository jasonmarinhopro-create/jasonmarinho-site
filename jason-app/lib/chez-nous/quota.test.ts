import { describe, it, expect } from 'vitest'
import { monthStartIso, questionsLeft, FREE_MONTHLY_QUESTIONS } from './quota'

describe('questionsLeft', () => {
  it('limite la formule gratuite à 2 questions par mois', () => {
    expect(FREE_MONTHLY_QUESTIONS).toBe(2)
    expect(questionsLeft('decouverte', 0)).toBe(2)
    expect(questionsLeft('decouverte', 1)).toBe(1)
    expect(questionsLeft('decouverte', 2)).toBe(0)
    expect(questionsLeft('decouverte', 5)).toBe(0)
  })
  it('illimité en Standard et Driing', () => {
    expect(questionsLeft('standard', 40)).toBeNull()
    expect(questionsLeft('driing', 40)).toBeNull()
  })
})

describe('monthStartIso', () => {
  it('minuit le 1er, heure de Paris (été : UTC+2)', () => {
    expect(monthStartIso(new Date('2026-09-27T12:00:00Z'))).toBe('2026-08-31T22:00:00.000Z')
  })
  it('minuit le 1er, heure de Paris (hiver : UTC+1)', () => {
    expect(monthStartIso(new Date('2026-12-15T12:00:00Z'))).toBe('2026-11-30T23:00:00.000Z')
  })
  it('le 1er à 0 h 30 à Paris compte déjà pour le nouveau mois', () => {
    // 30 septembre 22:30 UTC = 1er octobre 00:30 à Paris
    expect(monthStartIso(new Date('2026-09-30T22:30:00Z'))).toBe('2026-09-30T22:00:00.000Z')
  })
})
