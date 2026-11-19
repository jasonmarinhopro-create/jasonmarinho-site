import { describe, it, expect } from 'vitest'
import { regrouper, demandeStories, aAnnoncer, demandeSlug } from '../../../scripts/social/demandes.mjs'
import { checkStories } from '../../../scripts/social/spec.mjs'

// Données fictives : jamais de vraie demande dans les tests (dépôt public)
const row = (o: Record<string, unknown>) => ({
  id: 'a1b2c3d4-0000-0000-0000-000000000000', created_at: '2026-11-19T09:00:00Z', groupe: null,
  metier: 'photographe', ville: 'annecy', logement: 'T2, 45 m²', quand: 'Dans les 2 semaines',
  frequence: 'Photos du logement', etablissement: null, status: 'envoyee',
  sent_to: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }], ...o,
})

describe('stories « Nouvelle demande »', () => {
  it('une série valide, publiée tout de suite, sans donnée personnelle', () => {
    const [g] = regrouper([row({ nom: 'Paul', email: 'p@x.fr', telephone: '0600000000', message: 'Code 1234', budget: '300 €' })])
    const s = demandeStories(g)
    expect(s.maintenant).toBe(true)
    expect(s.slug).toBe('demande-a1b2c3d4')
    expect(checkStories(s)).toEqual([])
    const txt = JSON.stringify(s)
    for (const x of ['Paul', 'p@x.fr', '0600000000', '1234', '300']) expect(txt).not.toContain(x)
    expect(txt).not.toMatch(/—/)
    expect(s.frames[0].titre).toBe('Un *photographe* recherché à *Annecy*')
    expect(txt).toContain('3 photographes')
  })
  it('ménage au féminin, plusieurs villes regroupées, pas de pro dans le secteur', () => {
    const g = regrouper([
      row({ id: 'b1', groupe: 'g-1', metier: 'menage', ville: 'saint-malo', status: 'sans_pro', sent_to: [] }),
      row({ id: 'b2', groupe: 'g-1', metier: 'menage', ville: 'dinard', status: 'sans_pro', sent_to: [] }),
    ])
    expect(g).toHaveLength(1)
    const s = demandeStories(g[0])
    expect(s.frames[0].titre).toBe('Une *équipe de ménage* recherchée à *Saint-Malo et Dinard*')
    expect(s.frames.some((f: { titre?: string }) => f.titre === 'Pas encore d’équipes de ménage *dans le secteur*')).toBe(true)
    expect(checkStories(s)).toEqual([])
  })
  it('ni astérisque ni tiret cadratin repris du texte saisi', () => {
    const [g] = regrouper([row({ logement: 'T3 *vue* — lac', quand: 'Vite' })])
    const txt = JSON.stringify(demandeStories(g))
    expect(txt).not.toContain('—')
    expect(txt).toContain('T3 vue , lac')
  })
  it('anti-doublon, demandes closes écartées, plafond du jour', () => {
    const g = regrouper([row({ id: 'c1' }), row({ id: 'c2' }), row({ id: 'c3', status: 'close' }), row({ id: 'c4', ville: '' })])
    expect(aAnnoncer(g, new Set([demandeSlug('c1')]), 4).map((x: { key: string }) => x.key)).toEqual(['c2'])
    expect(aAnnoncer(g, new Set(), 1)).toHaveLength(1)
    expect(aAnnoncer(g, new Set(), -2)).toHaveLength(0)
  })
})
