import { describe, it, expect } from 'vitest'
import { cityRequestKey, cityRequestTally } from './rules'

describe('demandes de page de ville', () => {
  it('même clé pour les écritures d’une même ville', () => {
    expect(cityRequestKey('Québec')).toBe('quebec')
    expect(cityRequestKey('  QUEBEC ')).toBe('quebec')
    expect(cityRequestKey('Ville de Québec')).toBe('quebec')
    expect(cityRequestKey("Les Sables-d'Olonne")).toBe('les sables d olonne')
  })
  it('compte par profil', () => {
    const t = cityRequestTally([
      { metier: 'photographe', created_at: '2026-10-17T20:33:00Z' },
      { metier: 'hote', created_at: '2026-10-02T08:00:00Z' },
    ])
    expect(t).toEqual({ total: 2, parMetier: { photographe: 1, menage: 0, hote: 1 }, premiere: '2026-10-02T08:00:00Z' })
  })
})
