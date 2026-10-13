import { describe, expect, it } from 'vitest'
import {
  audienceOf, cityStats, countVisitors, firstPageQueries, groupByQuery, isProCityPage, monthlySeries,
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
