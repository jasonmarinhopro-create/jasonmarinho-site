import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CITY_ALIASES, CITY_PAGE_SLUGS, citySlugOf, cityPagePath, cityLabel, internalReferrerPath, slugifyCity } from './city-page'

const SITE = path.resolve(__dirname, '../../..')

describe('page de ville des pros', () => {
  it('la liste correspond aux pages du site statique', () => {
    for (const prefix of ['photographe-lcd-', 'menage-lcd-']) {
      const dirs = fs.readdirSync(SITE).filter(d => d.startsWith(prefix)).map(d => d.slice(prefix.length)).sort()
      expect(dirs).toEqual([...CITY_PAGE_SLUGS].sort())
    }
  })

  it('chaque autre nom mène à une page existante', () => {
    for (const target of Object.values(CITY_ALIASES)) expect(CITY_PAGE_SLUGS).toContain(target)
  })

  it('retrouve la page depuis la ville saisie', () => {
    expect(slugifyCity('Saint-Malo')).toBe('saint-malo')
    expect(citySlugOf('Lyon 6e')).toBe('lyon')
    expect(citySlugOf('LYON')).toBe('lyon')
    expect(citySlugOf('Paris 15')).toBe('paris')
    expect(citySlugOf('St Malo')).toBe('saint-malo')
    expect(citySlugOf('Clermont Ferrand')).toBe('clermont-ferrand')
    expect(citySlugOf('La Rochelle')).toBe('la-rochelle')
    expect(citySlugOf('Nîmes')).toBe('nimes')
    expect(citySlugOf('Villeurbanne')).toBeNull()
    expect(citySlugOf('Lyonnais')).toBeNull()
    expect(citySlugOf(null)).toBeNull()
    expect(citySlugOf('75015 Paris')).toBe('paris')
    expect(citySlugOf("Les Sables-d'Olonne")).toBe('les-sables-d-olonne')
    expect(citySlugOf("Sables d'Olonne")).toBe('les-sables-d-olonne')
    expect(citySlugOf('Vendée')).toBe('les-sables-d-olonne')
    expect(citySlugOf("Vendée et Sables d'Olonne")).toBe('les-sables-d-olonne')
    expect(citySlugOf('La Roche-sur-Yon', "Vendée, Les Sables-d'Olonne")).toBe('les-sables-d-olonne')
    expect(citySlugOf('Lyon', 'Vendée')).toBe('lyon')
    expect(citySlugOf('Cagnes-sur-Mer près de Nice')).toBe('nice')
    expect(citySlugOf('Région parisienne')).toBeNull()
  })

  it('chemins, noms et référents', () => {
    expect(cityPagePath('photographe', 'lyon')).toBe('/photographe-lcd-lyon')
    expect(cityPagePath('menage', 'saint-malo')).toBe('/menage-lcd-saint-malo')
    expect(cityLabel('saint-malo')).toBe('Saint-Malo')
    expect(cityLabel('la-rochelle')).toBe('La Rochelle')
    expect(cityLabel('lyon')).toBe('Lyon')
    expect(cityLabel('les-sables-d-olonne')).toBe("Les Sables-d'Olonne")
    expect(internalReferrerPath('https://jasonmarinho.com/photographe-lcd-lyon?x=1')).toBe('/photographe-lcd-lyon')
    expect(internalReferrerPath('https://www.google.fr/')).toBeNull()
    expect(internalReferrerPath(null)).toBeNull()
  })
})
