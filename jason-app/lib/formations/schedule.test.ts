import { describe, it, expect } from 'vitest'
import { actionDueDate } from './schedule'

describe('actionDueDate (heure de Paris)', () => {
  it('ce soir : 19 h, ou dans une heure si 19 h est passé', () => {
    expect(actionDueDate('ce-soir', new Date('2026-11-23T10:00:00Z')).toISOString()).toBe('2026-11-23T18:00:00.000Z')
    expect(actionDueDate('ce-soir', new Date('2026-11-23T19:30:00Z')).toISOString()).toBe('2026-11-23T20:30:00.000Z')
  })
  it('demain 9 h, été comme hiver', () => {
    expect(actionDueDate('demain', new Date('2026-11-23T23:30:00Z')).toISOString()).toBe('2026-11-25T08:00:00.000Z')
    expect(actionDueDate('demain', new Date('2026-07-01T10:00:00Z')).toISOString()).toBe('2026-07-02T07:00:00.000Z')
  })
  it('week-end : samedi 10 h, le suivant si on est déjà samedi', () => {
    expect(actionDueDate('week-end', new Date('2026-11-23T10:00:00Z')).toISOString()).toBe('2026-11-28T09:00:00.000Z')
    expect(actionDueDate('week-end', new Date('2026-11-28T10:00:00Z')).toISOString()).toBe('2026-12-05T09:00:00.000Z')
  })
})
