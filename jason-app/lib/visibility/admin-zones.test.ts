import { describe, it, expect } from 'vitest'
import { groupZones } from './admin-zones'
import type { CityItem } from './admin-rules'

const city = (slug: string, name: string, clicks: number, visitors = 0): CityItem => ({
  slug, name, clicks, impressions: clicks * 10, best: null, delta: null, pros: { photographes: 0, menage: 0, depannage: 0 },
  themes: [{ theme: 'menage', label: 'Ménage', path: `/menage-lcd-${slug}`, clicks, impressions: clicks * 10, place: null, queries: [], visitors, pros: null, demandes: null }],
})

describe('départements et régions de l’admin', () => {
  const cities = [city('rennes', 'Rennes', 5, 3), city('saint-malo', 'Saint-Malo', 2, 1), city('lyon', 'Lyon', 9, 4)]
  const pros = [
    { kind: 'menage' as const, ville: 'Rennes', demandes: 2 },
    { kind: 'photographe' as const, ville: 'Vitré' },
    { kind: 'depannage' as const, ville: '29200 Brest' },
    { kind: 'menage' as const, ville: 'Inconnuville' },
  ]

  it('additionne les villes et range les pros, même sans page', () => {
    const regions = groupZones(cities, pros, 'region')
    const bzh = regions.find(r => r.nom === 'Bretagne')!
    expect(bzh.villes.map(v => v.slug)).toEqual(['rennes', 'saint-malo'])
    expect(bzh).toMatchObject({ clicks: 7, visitors: 4, demandes: 2, prosHorsPages: 1 })
    expect(bzh.pros).toEqual({ photographes: 1, menage: 1, depannage: 1 })
    expect(regions[0].nom).toBe('Auvergne-Rhône-Alpes')
  })

  it('département sans page : présent grâce à ses pros', () => {
    const deps = groupZones(cities, pros, 'departement')
    const finistere = deps.find(d => d.code === '29')!
    expect(finistere).toMatchObject({ nom: 'Finistère', regionNom: 'Bretagne', villes: [], prosHorsPages: 0 })
    expect(finistere.pros.depannage).toBe(1)
    expect(deps.find(d => d.code === '35')?.villes.map(v => v.slug)).toEqual(['rennes', 'saint-malo'])
  })
})
