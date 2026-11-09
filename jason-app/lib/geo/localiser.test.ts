import { describe, it, expect } from 'vitest'
import { localiser, depOfCodePostal, normGeo, nomRegion, regionDuDepartement } from './localiser'

describe('localiser une ville saisie', () => {
  it('ville du site, avec ou sans précision', () => {
    expect(localiser('Lyon')).toMatchObject({ departement: '69', regionNom: 'Auvergne-Rhône-Alpes', villeSlug: 'lyon', via: 'ville-du-site' })
    expect(localiser('Lyon 6e')?.villeSlug).toBe('lyon')
    expect(localiser('La Rochelle')).toMatchObject({ departement: '17', villeSlug: 'la-rochelle' })
  })

  it('code postal, Corse et outre-mer compris', () => {
    expect(depOfCodePostal('33000')).toBe('33')
    expect(depOfCodePostal('20000')).toBe('2A')
    expect(depOfCodePostal('20200')).toBe('2B')
    expect(depOfCodePostal('97400')).toBe('974')
    expect(localiser('33700 Mérignac')).toMatchObject({ departement: '33', via: 'code-postal' })
  })

  it('commune sans page, article et noms IGN', () => {
    expect(localiser('Pessac')).toMatchObject({ departement: '33', regionNom: 'Nouvelle-Aquitaine', villeSlug: null, via: 'commune' })
    // Mérignac existe en Charente, Charente-Maritime et Gironde : rien sans code postal
    expect(localiser('Mérignac')).toBeNull()
    expect(localiser('Villeurbanne')?.departement).toBe('69')
    expect(localiser('Le Havre')?.departement).toBe('76')
    expect(localiser("Saint-Jean-de-Luz")?.departement).toBe('64')
  })

  it('commune présente dans plusieurs départements : rien de sûr sans code postal', () => {
    expect(localiser('Saint-Denis')).toBeNull()
    expect(localiser('93200 Saint-Denis')?.departement).toBe('93')
  })

  it('département et région', () => {
    expect(localiser('Gironde')).toMatchObject({ departement: '33', via: 'departement' })
    expect(localiser('Bretagne')).toMatchObject({ departement: null, regionNom: 'Bretagne', via: 'region' })
    expect(localiser('PACA')?.regionNom).toBe("Provence-Alpes-Côte d'Azur")
    expect(localiser('2A')?.departementNom).toBe('Corse-du-Sud')
  })

  it('rien pour un texte vide ou inconnu', () => {
    expect(localiser('')).toBeNull()
    expect(localiser(null)).toBeNull()
    expect(localiser('Montréal')).toBeNull()
  })

  it('outils', () => {
    expect(normGeo("L'Isle-sur-la-Sorgue")).toBe('isle sur la sorgue')
    expect(nomRegion('53')).toBe('Bretagne')
    expect(regionDuDepartement('35')).toBe('53')
  })
})
