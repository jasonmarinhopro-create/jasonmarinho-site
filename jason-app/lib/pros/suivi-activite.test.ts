import { describe, it, expect } from 'vitest'
import { buildSuivi, estTrouverUnPro } from './suivi-activite'

const now = new Date('2026-11-17T10:00:00Z')

describe('estTrouverUnPro', () => {
  it('reconnaît les demandes de la page Trouver un pro', () => {
    expect(estTrouverUnPro('https://jasonmarinho.com/trouver-un-pro#demande-abc')).toBe(true)
    expect(estTrouverUnPro('/trouver-un-pro?metier=menage')).toBe(true)
    expect(estTrouverUnPro('https://jasonmarinho.com/annuaires/photographes/x')).toBe(false)
    expect(estTrouverUnPro('https://jasonmarinho.com/trouver-un-professionnel')).toBe(false)
    expect(estTrouverUnPro(null)).toBe(false)
  })
})

describe('buildSuivi', () => {
  it('compte sans rien lire du contenu', () => {
    const s = buildSuivi([
      { created_at: '2026-11-15T10:00:00Z', status: 'nouvelle', source_url: 'https://jasonmarinho.com/trouver-un-pro#demande-1' },
      { created_at: '2026-11-01T10:00:00Z', status: 'nouvelle', source_url: 'https://jasonmarinho.com/annuaires/photographes/a' },
      { created_at: '2026-09-20T10:00:00Z', status: 'gagnee', source_url: null },
      { created_at: '2026-03-01T10:00:00Z', status: 'bizarre', source_url: null },
    ], [{ statut: 'client' }, { statut: 'client' }, { statut: null }], now)
    expect(s.total).toBe(4)
    expect(s.derniers30).toBe(2)
    expect(s.trouverUnPro).toBe(1)
    expect(s.directes).toBe(3)
    expect(s.parStatut.nouvelle).toBe(3)
    expect(s.parStatut.gagnee).toBe(1)
    expect(s.tauxTraite).toBe(25)
    expect(s.enAttente).toBe(3)
    expect(s.plusVieilleAttenteJours).toBe(261)
    expect(s.derniere).toBe('2026-11-15T10:00:00.000Z')
    expect(s.parMois.map(m => m.mois)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])
    expect(s.parMois.at(-1)!.n).toBe(2)
    expect(s.parMois.find(m => m.mois === '2026-09')!.n).toBe(1)
    expect(s.clients).toBe(3)
    expect(s.clientsParStatut).toEqual([{ statut: 'client', n: 2 }, { statut: 'sans statut', n: 1 }])
  })

  it('sans demande', () => {
    const s = buildSuivi([], [], now)
    expect(s.total).toBe(0)
    expect(s.tauxTraite).toBeNull()
    expect(s.plusVieilleAttenteJours).toBeNull()
    expect(s.derniere).toBeNull()
    expect(s.parMois).toHaveLength(6)
  })
})
