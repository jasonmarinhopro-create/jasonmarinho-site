import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/supabase/service', () => ({ getServiceClient: () => ({}) }))

import { parseAnnonceAnalysesStats } from './annonce-analyses'

describe('compteur des analyses d’annonce', () => {
  it('lit la réponse de la base', () => {
    expect(parseAnnonceAnalysesStats({ total: 42, jours7: 5, jours30: 20, jours30_avant: 12, note_moyenne30: 71, partielles30: 2, derniere: '2026-11-15T14:00:00Z' }))
      .toEqual({ total: 42, jours7: 5, jours30: 20, jours30Avant: 12, noteMoyenne30: 71, partielles30: 2, derniere: '2026-11-15T14:00:00Z' })
  })
  it('table vide : zéros, pas de note moyenne', () => {
    expect(parseAnnonceAnalysesStats({ total: 0, jours7: 0, jours30: 0, jours30_avant: 0, note_moyenne30: null, partielles30: 0, derniere: null }))
      .toEqual({ total: 0, jours7: 0, jours30: 0, jours30Avant: 0, noteMoyenne30: null, partielles30: 0, derniere: null })
  })
  it('réponse inattendue : null', () => {
    expect(parseAnnonceAnalysesStats(null)).toBeNull()
    expect(parseAnnonceAnalysesStats('x')).toBeNull()
    expect(parseAnnonceAnalysesStats({ total: 'beaucoup' })).toBeNull()
    expect(parseAnnonceAnalysesStats({ total: 3, jours7: -1, jours30: 2 })).toBeNull()
  })
})
