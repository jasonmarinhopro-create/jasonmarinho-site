import { describe, it, expect } from 'vitest'
import { zoneDeRecherche } from './zone'
import type { CityFull } from './load'

const full = (slug: string, photographe: number, menage: number): CityFull =>
  ({ slug, label: slug, pros: { photographe, menage, depannage: 0 }, pages: {} as CityFull['pages'] })

describe('/chiffres : zone d’une saisie sans page', () => {
  const cities = { bordeaux: full('bordeaux', 2, 1), arcachon: full('arcachon', 0, 1), rennes: full('rennes', 1, 0) }

  it('commune sans page : les villes de son département', () => {
    const z = zoneDeRecherche('Pessac', cities)!
    expect(z).toMatchObject({ via: 'commune', departementNom: 'Gironde', portee: 'departement', pros: 4 })
    expect(z.villes.map(v => v.slug)).toEqual(['bordeaux', 'arcachon'])
  })

  it('département sans ville du site : les villes de la région', () => {
    const z = zoneDeRecherche('Haute-Vienne', cities)!
    expect(z).toMatchObject({ via: 'departement', departementNom: 'Haute-Vienne', regionNom: 'Nouvelle-Aquitaine', portee: 'region' })
    expect(z.villes.map(v => v.slug)).toContain('bordeaux')
  })

  it('région', () => {
    const z = zoneDeRecherche('Bretagne', cities)!
    expect(z).toMatchObject({ via: 'region', portee: 'region' })
    expect(z.villes[0].slug).toBe('rennes')
  })

  it('ville du site ou saisie inconnue : rien (la carte de la ville ou la demande de page s’affichent)', () => {
    expect(zoneDeRecherche('Lyon', cities)).toBeNull()
    expect(zoneDeRecherche('Montréal', cities)).toBeNull()
  })
})
