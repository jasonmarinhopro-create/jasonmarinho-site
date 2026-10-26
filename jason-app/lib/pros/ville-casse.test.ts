import { describe, it, expect } from 'vitest'
import { villeCasse, cleanVilles } from './fiche-vitrine'

describe('villeCasse', () => {
  it('remet en forme une saisie toute en majuscules ou en minuscules', () => {
    expect(villeCasse('LEVALLOIS')).toBe('Levallois')
    expect(villeCasse('NEUILLY-SUR-SEINE')).toBe('Neuilly-sur-Seine')
    expect(villeCasse('saint-étienne')).toBe('Saint-Étienne')
    expect(villeCasse("L'ISLE-ADAM")).toBe("L'Isle-Adam")
    expect(villeCasse('les sables-d’olonne')).toBe('Les Sables-d’Olonne')
  })
  it('garde une casse mixte telle quelle', () => {
    expect(villeCasse('Boulogne-Billancourt')).toBe('Boulogne-Billancourt')
    expect(villeCasse('La Baule-Escoublac')).toBe('La Baule-Escoublac')
  })
  it('s’applique à l’enregistrement des villes', () => {
    expect(cleanVilles(['Paris', 'LEVALLOIS'])).toEqual(['Paris', 'Levallois'])
  })
})

describe('même règle à l’inscription (site)', () => {
  it('pro-signup-extras.cjs donne le même résultat', async () => {
    const { createRequire } = await import('module')
    const extras = createRequire(import.meta.url)('../../../scripts/lib/pro-signup-extras.cjs')
    for (const v of ['LEVALLOIS', 'NEUILLY-SUR-SEINE', "L'ISLE-ADAM", 'les sables-d’olonne', 'Boulogne-Billancourt']) {
      expect(extras.villeCasse(v)).toBe(villeCasse(v))
    }
    expect(extras.cleanVilles(['LEVALLOIS'], 'Paris')).toEqual(['Levallois'])
  })
})
