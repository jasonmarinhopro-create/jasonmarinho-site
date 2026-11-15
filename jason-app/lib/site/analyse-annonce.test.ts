import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

// Le moteur vit à la racine du site statique (/analyse-annonce-regles.js),
// chargé tel quel par la page /services/analyse-annonce-airbnb.
const require = createRequire(import.meta.url)
const { analyser, EQUIPEMENTS } = require('../../../analyse-annonce-regles.js') as {
  analyser: (input: Record<string, unknown>) => {
    score: number
    verdict: string
    sections: Array<{ id: string; score: number; max: number }>
    conseils: Array<{ section: string; perte: number; titre: string; texte: string }>
    forts: string[]
  }
  EQUIPEMENTS: Array<{ id: string; label: string }>
}

const complete = {
  titre: 'Appartement vue mer, terrasse et parking',
  description: [
    'Vue mer depuis la terrasse de cet appartement refait en 2025, à 5 min à pied de la plage.',
    'Deux chambres avec lits 160 cm, un canapé dans le salon. Cuisine équipée : four, plaques, lave-vaisselle et cafetière.',
    'Le quartier est calme, avec commerces et restaurants à proximité. La gare est à 10 min en bus.',
    'Arrivée autonome avec boîte à clés. Idéal pour un couple, une famille avec enfants ou du télétravail.',
  ].join('\n\n'),
  photos: 24,
  photosToutesPieces: true,
  photosLegendes: true,
  equipements: EQUIPEMENTS.map(e => e.id),
  note: 4.93,
  avis: 31,
  reservationInstantanee: true,
  reductionSejourLong: true,
}

describe('analyse d’une annonce Airbnb', () => {
  it('donne 100 à une annonce complète', () => {
    const r = analyser(complete)
    expect(r.score).toBe(100)
    expect(r.verdict).toBe('Annonce solide')
    expect(r.conseils).toHaveLength(0)
  })

  it('donne 0 points au titre et à la description vides, sans planter', () => {
    const r = analyser({})
    const parId = Object.fromEntries(r.sections.map(s => [s.id, s.score]))
    expect(parId.titre).toBe(0)
    expect(parId.description).toBe(0)
    expect(r.score).toBeLessThan(10)
    expect(r.verdict).toBe('Annonce à retravailler')
  })

  it('le total des barèmes fait 100', () => {
    expect(analyser({}).sections.reduce((s, x) => s + x.max, 0)).toBe(100)
  })

  it('signale un titre de plus de 50 caractères', () => {
    const r = analyser({ ...complete, titre: 'Appartement vue mer avec grande terrasse, parking privé et climatisation' })
    expect(r.conseils.some(c => c.titre.includes('50 caractères'))).toBe(true)
    expect(r.score).toBeLessThan(100)
  })

  it('signale les majuscules et les adjectifs vagues', () => {
    const r = analyser({ ...complete, titre: 'MAGNIFIQUE APPARTEMENT VUE MER !!!' })
    expect(r.conseils.some(c => c.titre.includes('majuscules'))).toBe(true)
    expect(r.conseils.some(c => c.titre.includes('adjectifs vagues'))).toBe(true)
  })

  it('liste les équipements non cochés en un seul conseil', () => {
    const r = analyser({ ...complete, equipements: ['wifi', 'cuisine'] })
    const eq = r.conseils.filter(c => c.section === 'equipements')
    expect(eq).toHaveLength(1)
    expect(eq[0].perte).toBe(16)
    expect(eq[0].titre).toContain('parking')
  })

  it('accepte une note saisie avec une virgule', () => {
    const r = analyser({ ...complete, note: '4,6', avis: '3' })
    expect(r.conseils.some(c => c.titre === 'Remonte ta note')).toBe(true)
    expect(r.conseils.some(c => c.titre === 'Dépasse les 5 avis')).toBe(true)
  })

  it('classe les conseils du plus coûteux au moins coûteux', () => {
    const r = analyser({ titre: 'Studio', description: 'Petit studio.', photos: 3 })
    const pertes = r.conseils.map(c => c.perte)
    expect(pertes).toEqual([...pertes].sort((a, b) => b - a))
  })

  it('n’écrit ni tiret cadratin ni promesse sur l’algorithme', () => {
    const r = analyser({ titre: 'x', description: 'y', photos: 1, note: 4.2, avis: 2 })
    const tout = r.conseils.map(c => c.titre + ' ' + c.texte).join(' ')
    expect(tout).not.toMatch(/—/)
    expect(tout.toLowerCase()).not.toContain('algorithme')
  })
})
