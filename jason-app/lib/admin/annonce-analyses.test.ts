import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/supabase/service', () => ({ getServiceClient: () => ({}) }))

import { parseAnnonceAnalysesStats, parseAnnonceAnalyses } from './annonce-analyses'

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

describe('dernières analyses d’annonce', () => {
  it('refait le lien à partir du numéro et garde les sous-notes', () => {
    expect(parseAnnonceAnalyses([{ created_at: '2026-11-15T14:38:45Z', score: 83, complet: true, annonce_id: '1495606164171440082', sections: [{ id: 'titre', score: 20, max: 20 }, { id: 'photos', score: 17, max: 25 }, { cassé: true }] }]))
      .toEqual([{ date: '2026-11-15T14:38:45Z', score: 83, complet: true, lien: 'https://www.airbnb.fr/rooms/1495606164171440082', sections: [{ id: 'titre', score: 20, max: 20 }, { id: 'photos', score: 17, max: 25 }] }])
  })
  it('ligne d’avant la migration : pas de lien, pas de sous-notes', () => {
    expect(parseAnnonceAnalyses([{ created_at: '2026-11-15T14:38:45Z', score: 83, complet: true, annonce_id: null, sections: null }]))
      .toEqual([{ date: '2026-11-15T14:38:45Z', score: 83, complet: true, lien: null, sections: [] }])
  })
  it('refuse un numéro qui n’en est pas un et ignore les lignes illisibles', () => {
    expect(parseAnnonceAnalyses([{ created_at: '2026-11-15T14:00:00Z', score: 50, annonce_id: 'https://evil.test/x' }, null, { score: 2 }, 'x']))
      .toEqual([{ date: '2026-11-15T14:00:00Z', score: 50, complet: true, lien: null, sections: [] }])
    expect(parseAnnonceAnalyses(null)).toEqual([])
  })
})
