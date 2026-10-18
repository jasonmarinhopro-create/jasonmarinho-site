import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { suggestList, matchParts, cityKey } from './suggest'
import { CITY_REGIONS } from './suggest-regions'
import { CITY_PAGE_SLUGS } from '@/lib/visibility/city-page'

const VILLES = ['Lyon', 'Saint-Malo', 'Saint-Tropez', 'Sarlat', 'Nice', 'Nîmes', 'Chamonix', 'Paris', "Les Sables-d'Olonne"]

describe('suggestList', () => {
  it('sans texte : les villes les plus demandées', () => {
    const r = suggestList(VILLES, '', { city: true })
    expect(r.items).toEqual(['Paris', 'Lyon', 'Nice', 'Saint-Malo'])
    expect(r.heading).toBe('Les plus demandées')
    expect(r.free).toBeNull()
  })
  it('début de nom d’abord, sans accents, puis « Utiliser »', () => {
    const r = suggestList(VILLES, 'ni', { city: true })
    expect(r.items).toEqual(['Nice', 'Nîmes', 'Chamonix'])
    expect(r.free).toBe('ni')
    expect(suggestList(VILLES, 'Nice', { city: true }).free).toBeNull()
    expect(suggestList(VILLES, 'Roubaix', { city: true })).toMatchObject({ items: [], heading: 'Pas encore de page pour cette ville', free: 'Roubaix' })
    expect(suggestList(VILLES, 'Roubaix', { city: true, strict: true }).free).toBeNull()
  })
  it('souligne le texte tapé, accents compris', () => {
    expect(matchParts('Nîmes', 'nim')).toEqual(['', 'Nîm', 'es'])
    expect(matchParts('Chamonix', 'ni')).toEqual(['Chamo', 'ni', 'x'])
    expect(cityKey("Les Sables-d'Olonne")).toBe('les-sables-d-olonne')
  })
})

describe('régions des villes', () => {
  it('chaque ville qui a ses pages a sa région, comme sur le site', () => {
    for (const s of CITY_PAGE_SLUGS) expect(CITY_REGIONS[s], s).toBeTruthy()
    const site = readFileSync(new URL('../../../suggestions.js', import.meta.url), 'utf8').match(/\/\*REGIONS:START\*\/(.*?)\/\*REGIONS:END\*\//)
    expect(site && JSON.parse(site[1])).toEqual(CITY_REGIONS)
  })
})
