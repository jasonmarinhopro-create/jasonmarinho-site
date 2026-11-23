import { describe, it, expect } from 'vitest'
import { ordonnerVerification, prioriteVerification, type EtatConnu } from './check-order'

const etat = (last: string | null, indexed: boolean | null, error: string | null = null): EtatConnu => ({ last_checked_at: last, indexed, error })

describe('ordre de la vérification d’indexation', () => {
  it('classe les pages par priorité', () => {
    expect(prioriteVerification(undefined)).toBe(0)
    expect(prioriteVerification(etat(null, null))).toBe(0)
    expect(prioriteVerification(etat('2026-11-01', true, 'Délai dépassé'))).toBe(0)
    expect(prioriteVerification(etat('2026-11-22', false))).toBe(1)
    expect(prioriteVerification(etat('2026-10-01', true))).toBe(2)
  })

  it('passe une page non indexée vérifiée hier avant une page indexée vérifiée il y a un mois', () => {
    const byUrl = new Map<string, EtatConnu>([
      ['a', etat('2026-10-01', true)],
      ['b', etat('2026-11-22', false)],
      ['c', etat('2026-11-10', false)],
      ['e', etat('2026-11-20', true, 'HTTP 500')],
    ])
    const ordre = ordonnerVerification([{ url: 'a' }, { url: 'b' }, { url: 'c' }, { url: 'd' }, { url: 'e' }], byUrl).map(e => e.url)
    expect(ordre).toEqual(['d', 'e', 'c', 'b', 'a'])
  })
})
