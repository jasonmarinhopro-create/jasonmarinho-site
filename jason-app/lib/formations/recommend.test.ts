import { describe, expect, it } from 'vitest'
import { recommendFormations, type RecommendInput } from './recommend'

const ALL = new Set([
  'optimiser-annonce-airbnb', 'photographie-lcd-smartphone', 'mettre-le-bon-prix-lcd',
  'fiscalite-reglementation-lcd-france-2026', 'declarer-lmnp-seul-decla-fr', 'annonce-directe',
  'google-my-business-lcd', 'lcd-basse-saison', 'ecrire-avis-repondre-voyageurs',
])
const base: RecommendInput = { countries: [], logementsCount: 1, hasContracts: true, month: 7, startedSlugs: new Set(), availableSlugs: ALL }

describe('recommendFormations', () => {
  it('oriente un nouvel hôte sans logement vers la création d’annonce', () => {
    expect(recommendFormations({ ...base, logementsCount: 0 }).map(r => r.slug))
      .toEqual(['optimiser-annonce-airbnb', 'photographie-lcd-smartphone', 'mettre-le-bon-prix-lcd'])
  })

  it('propose la fiscalité française seulement pour un logement en France', () => {
    expect(recommendFormations({ ...base, countries: ['PT'] }).map(r => r.slug)).not.toContain('fiscalite-reglementation-lcd-france-2026')
    expect(recommendFormations({ ...base, countries: ['FR'] })[0].slug).toBe('fiscalite-reglementation-lcd-france-2026')
  })

  it('exclut les formations commencées et limite à 3', () => {
    const r = recommendFormations({ ...base, hasContracts: false, month: 11, startedSlugs: new Set(['annonce-directe']) })
    expect(r.map(x => x.slug)).toEqual(['google-my-business-lcd', 'lcd-basse-saison', 'mettre-le-bon-prix-lcd'])
  })
})
