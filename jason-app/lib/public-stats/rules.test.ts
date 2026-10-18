import { describe, expect, it } from 'vitest'
import {
  audienceOf, cityPageRanks, cityStats, countVisitors, firstPageQueries, groupByQuery, isProCityPage, monthlySeries,
  CITY_TOTALS_MIN_IMPRESSIONS, type PairRow,
} from './rules'

const row = (query: string, page: string, impressions: number, position: number, clicks = 0): PairRow =>
  ({ query, page: `https://jasonmarinho.com${page}`, impressions, position, clicks })

describe('audienceOf', () => {
  it('reconnaît les recherches de pros', () => {
    expect(audienceOf('photographe airbnb lyon')).toBe('photographe')
    expect(audienceOf('Équipe de ménage location courte durée Nice')).toBe('menage')
    expect(audienceOf('menage airbnb bordeaux')).toBe('menage')
    expect(audienceOf('taxe de séjour strasbourg')).toBe('hote')
  })
})

describe('groupByQuery', () => {
  it('place pondérée par les affichages et page la plus vue', () => {
    const [q] = groupByQuery([row('photographe lcd lyon', '/photographe-lcd-lyon', 30, 2), row('photographe lcd lyon', '/annuaires/photographes', 10, 6)])
    expect(q.place).toBe(3)
    expect(q.impressions).toBe(40)
    expect(q.page).toBe('/photographe-lcd-lyon')
  })
})

describe('firstPageQueries', () => {
  const rows = [
    row('photographe airbnb lyon', '/photographe-lcd-lyon', 30, 8.3),
    row('photographe lcd annecy', '/photographe-lcd-annecy', 4, 2.1),
    row('photographe lcd paris', '/photographe-lcd-paris', 2, 1),       // trop peu d'affichages
    row('photographe immobilier', '/photographe-lcd-paris', 50, 34),    // pas en première page
    row('menage airbnb nice', '/menage-lcd-nice', 12, 5),
    row('jason marinho', '/', 80, 1),                                   // notre nom
    row('taxe de sejour strasbourg', '/devenir-hote-airbnb-strasbourg', 300, 6),
    row('taxe de sejour arcachon', '/devenir-hote-airbnb-arcachon', 10, 4), // hôte : sous le seuil
  ]
  const r = firstPageQueries(rows)
  it('trie les pros par place, garde le seuil et écarte notre nom', () => {
    expect(r.photographe.map(q => q.q)).toEqual(['photographe lcd annecy', 'photographe airbnb lyon'])
    expect(r.menage.map(q => q.q)).toEqual(['menage airbnb nice'])
    expect(r.hote.map(q => q.q)).toEqual(['taxe de sejour strasbourg'])
  })
})

describe('cityStats', () => {
  const pairs = [row('photographe airbnb lyon', '/photographe-lcd-lyon', 30, 8.3), row('photographe lyon', '/photographe-lcd-lyon', 40, 25)]
  it('sous le seuil : pas de totaux, seulement les recherches en première page', () => {
    const s = cityStats({ impressions: 70, clicks: 0 }, pairs, 2)
    expect(s.totals).toBeNull()
    expect(s.queries.map(q => q.q)).toEqual(['photographe airbnb lyon'])
  })
  it('au-delà du seuil : totaux montrés', () => {
    const s = cityStats({ impressions: CITY_TOTALS_MIN_IMPRESSIONS, clicks: 3 }, pairs, 12)
    expect(s.totals).toEqual({ impressions: CITY_TOTALS_MIN_IMPRESSIONS, clicks: 3, visitors: 12 })
  })
})

describe('monthlySeries', () => {
  it('somme par mois et marque le mois en cours', () => {
    const s = monthlySeries([
      { date: '2026-09-29', impressions: 10, clicks: 1 },
      { date: '2026-09-30', impressions: 5, clicks: 0 },
      { date: '2026-10-01', impressions: 7, clicks: 2 },
    ], '2026-10-11')
    expect(s).toEqual([
      { month: '2026-09', impressions: 15, clicks: 1, partial: false },
      { month: '2026-10', impressions: 7, clicks: 2, partial: true },
    ])
  })
})

describe('countVisitors et pages de ville', () => {
  it('sessions distinctes, au total et par page', () => {
    const v = countVisitors([
      { session_id: 'a', path: '/photographe-lcd-lyon' }, { session_id: 'a', path: '/' },
      { session_id: 'b', path: '/photographe-lcd-lyon/' },
    ])
    expect(v.total).toBe(2)
    expect(v.byPath.get('/photographe-lcd-lyon')).toBe(2)
  })
  it('reconnaît les pages de ville des pros', () => {
    expect(isProCityPage('/photographe-lcd-les-sables-d-olonne')).toBe(true)
    expect(isProCityPage('/menage-lcd-lyon')).toBe(true)
    expect(isProCityPage('/devenir-hote-airbnb-lyon')).toBe(false)
  })
})

describe('audienceOf, conciergerie', () => {
  it('une recherche de conciergerie concerne les hôtes, pas les équipes de ménage', () => {
    expect(audienceOf('ouvrir une conciergerie en ligne')).toBe('hote')
  })
})

describe('recherche par ville', () => {
  it('pageFull : tout est montré, recherches les plus vues d\'abord', async () => {
    const { pageFull } = await import('./rules')
    const p = pageFull('/photographe-lcd-lyon', { impressions: 70, clicks: 1, position: 12.34 }, { impressions: 40 }, [
      row('photographe lyon', '/photographe-lcd-lyon', 40, 25), row('photographe airbnb lyon', '/photographe-lcd-lyon', 30, 8),
    ], 2)
    expect(p).toMatchObject({ impressions: 70, clicks: 1, place: 12.3, prevImpressions: 40, visitors: 2 })
    expect(p.queries.map(q => q.q)).toEqual(['photographe lyon', 'photographe airbnb lyon'])
    expect(pageFull('/menage-lcd-pau', undefined, undefined, [], 0).place).toBeNull()
  })
  it('prosByCity : fiches en ligne seulement', async () => {
    const { prosByCity } = await import('./rules')
    const m = prosByCity([
      { ville: 'Lyon', zone_couverte: null, status: 'active', is_public: true },
      { ville: 'Lyon', zone_couverte: null, status: 'hidden', is_public: false },
      { ville: 'Nulle part', zone_couverte: null, status: 'active', is_public: true },
    ], (v) => v === 'Lyon' ? 'lyon' : null)
    expect(m.get('lyon')).toBe(1)
    expect(m.size).toBe(1)
  })
  it('cleanCityRequest', async () => {
    const { cleanCityRequest } = await import('./rules')
    expect(cleanCityRequest({ ville: '  Saint-Jean-de-Luz ', metier: 'photographe' })).toEqual({ ok: true, ville: 'Saint-Jean-de-Luz', metier: 'photographe', email: null })
    expect(cleanCityRequest({ ville: 'x' }).ok).toBe(false)
    expect(cleanCityRequest({ ville: 'Dax', email: 'pas-un-mail' }).ok).toBe(false)
    expect(cleanCityRequest({ ville: 'Dax', email: 'A@B.fr', metier: 'autre' })).toEqual({ ok: true, ville: 'Dax', metier: 'hote', email: 'a@b.fr' })
  })
  it('seule la ville sans guide hôte est listée', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const { NO_HOST_GUIDE } = await import('./rules')
    const { CITY_PAGE_SLUGS } = await import('@/lib/visibility/city-page')
    const site = path.resolve(__dirname, '../../..')
    const missing = CITY_PAGE_SLUGS.filter(s => !fs.existsSync(path.join(site, `devenir-hote-airbnb-${s}`)))
    expect(missing.sort()).toEqual([...NO_HOST_GUIDE].sort())
  })
})

describe('recherches vidéo', () => {
  it('reconnaît vidéo, vidéaste, drone, sans confondre', async () => {
    const { isVideoQuery } = await import('@/lib/visibility/rules')
    expect(isVideoQuery('vidéaste airbnb lyon')).toBe(true)
    expect(isVideoQuery('Video logement location')).toBe(true)
    expect(isVideoQuery('photo drone maison')).toBe(true)
    expect(isVideoQuery('photographe airbnb lyon')).toBe(false)
    expect(isVideoQuery('videotheque')).toBe(false)
    // « réel » sans accent ne doit pas passer pour des reels (vu le 17/10/2026)
    expect(isVideoQuery('comparaison micro bic et bic réel')).toBe(false)
    expect(isVideoQuery('passage réel lcd 2026')).toBe(false)
    expect(isVideoQuery('synchronisation tarifaire en temps réel')).toBe(false)
    expect(isVideoQuery('reels instagram airbnb')).toBe(true)
  })
  it('les range chez les photographes et les résume', async () => {
    const { audienceOf, videoSummary } = await import('./rules')
    expect(audienceOf('vidéaste immobilier nice')).toBe('photographe')
    const rows = [
      { query: 'vidéaste airbnb', page: 'https://jasonmarinho.com/photographe-lcd-nice', clicks: 1, impressions: 30, position: 6 },
      { query: 'drone maison', page: 'https://jasonmarinho.com/photographe-lcd-nice', clicks: 0, impressions: 10, position: 14 },
      { query: 'photographe airbnb', page: 'https://jasonmarinho.com/photographe-lcd-nice', clicks: 2, impressions: 50, position: 4 },
    ]
    expect(videoSummary(rows)).toMatchObject({ count: 2, impressions: 40, clicks: 1, firstPage: 1 })
  })
})

describe('cityPageRanks', () => {
  it('garde les pages de ville en première page même sans recherche nommée par Google', () => {
    const pages = [
      { path: '/photographe-lcd-nice', impressions: 14, clicks: 0, position: 6.94 },
      { path: '/photographe-lcd-lyon', impressions: 48, clicks: 4, position: 7.4 },
      { path: '/photographe-lcd-paris', impressions: 22, clicks: 3, position: 13.8 },
      { path: '/menage-lcd-cannes', impressions: 72, clicks: 1, position: 8 },
      { path: '/photographe-lcd-pau', impressions: 2, clicks: 0, position: 3 },
      { path: '/blog/x', impressions: 500, clicks: 9, position: 2 },
    ]
    const pairs = [{ query: 'photographe airbnb lyon', page: 'https://jasonmarinho.com/photographe-lcd-lyon', clicks: 3, impressions: 38, position: 7.5 }]
    const r = cityPageRanks(pages, pairs)
    expect(r.photographe.map(x => x.path)).toEqual(['/photographe-lcd-nice', '/photographe-lcd-lyon'])
    expect(r.photographe[0]).toMatchObject({ place: 6.9, query: null })
    expect(r.photographe[1].query).toBe('photographe airbnb lyon')
    expect(r.menage.map(x => x.path)).toEqual(['/menage-lcd-cannes'])
  })
})
