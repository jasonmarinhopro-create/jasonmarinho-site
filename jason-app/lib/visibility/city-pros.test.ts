import { describe, it, expect } from 'vitest'
import { buildCityPros } from './city-pros'
import { CITY_PAGE_SLUGS } from './city-page'

const q = (query: string, place: number, impressions: number) => ({ query, clicks: 0, impressions, place, prevPlace: null, delta: null, isNew: false })

describe('pages pros par ville', () => {
  it('Google, visites, fiches ouvertes depuis la page et pros de la ville', () => {
    const d = buildCityPros({
      pages: new Map([
        ['/photographe-lcd-lyon', { clicks: 1, impressions: 30, pagePlace: 8, prevPagePlace: 11, queries: [q('photographe airbnb lyon', 8, 25)] }],
        ['/photographe-lcd-nice', { clicks: 0, impressions: 12, pagePlace: 24, prevPagePlace: null, queries: [] }],
        ['/menage-lcd-lyon', { clicks: 2, impressions: 40, pagePlace: 5, prevPagePlace: 5, queries: [q('menage airbnb lyon', 5, 40)] }],
      ]),
      visits: [
        { session_id: 'a', path: '/photographe-lcd-lyon', referrer: 'https://www.google.fr/' },
        { session_id: 'a', path: '/annuaires/photographes/jean', referrer: 'https://jasonmarinho.com/photographe-lcd-lyon' },
        { session_id: 'b', path: '/photographe-lcd-lyon', referrer: null },
        { session_id: 'c', path: '/annuaires/menage/x', referrer: 'https://jasonmarinho.com/photographe-lcd-lyon' },
      ],
      prevVisits: [{ session_id: 'z', path: '/photographe-lcd-lyon', referrer: null }],
      pros: {
        photographe: [
          { name: 'Jean', ville: 'Lyon 6e', slug: 'jean', online: true, excluded: false },
          { name: 'Refusé', ville: 'Lyon', slug: null, online: false, excluded: true },
          { name: 'Vendéen', ville: 'La Roche-sur-Yon', zone: "Vendée, Les Sables-d'Olonne", slug: 'v', online: true, excluded: false },
        ],
        menage: [],
      },
    })
    expect(d.photographe.items).toHaveLength(CITY_PAGE_SLUGS.length)
    expect(d.photographe.items.find(c => c.slug === 'les-sables-d-olonne')?.pros.map(p => p.name)).toEqual(['Vendéen'])
    const lyon = d.photographe.items.find(c => c.slug === 'lyon')!
    expect(lyon).toMatchObject({ label: 'Lyon', clicks: 1, impressions: 30, pagePlace: 8, delta: 3, visitors: 2, prevVisitors: 1, toFiches: 1 })
    expect(lyon.main?.query).toBe('photographe airbnb lyon')
    expect(lyon.pros).toEqual([{ name: 'Jean', slug: 'jean', online: true }])
    expect(d.photographe).toMatchObject({ clicks: 1, impressions: 42, visitors: 2, toFiches: 1, firstPage: 1, toRecruit: 1, withPro: 2 })
    expect(d.menage).toMatchObject({ clicks: 2, impressions: 40, firstPage: 1, toRecruit: 1, withPro: 0 })
  })
})
