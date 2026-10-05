import { describe, it, expect } from 'vitest'
import {
  shortDate, fmtInt, ctrLabel, normCity, cityMatches, mainPageByQuery, fillDays, sessionsByPath, normPath,
  topVisitedPages, proBucketOf, weightedDelta, bestQuery, groupCities, filterPros, filterQueries, filterPages,
  parseTab, queryItems, type ProItem, type QueryItem, type QueryLite, type PageItem,
} from './admin-rules'
import { aggregateQueries } from './rules'

const q = (query: string, place: number, impressions = 10, clicks = 0, delta: number | null = null): QueryLite =>
  ({ query, place, impressions, clicks, prevPlace: delta === null ? null : place + delta, delta, isNew: delta === null })

describe('aides', () => {
  it('dates courtes et nombres sans dépendre de la locale', () => {
    expect(shortDate('2026-10-05')).toBe('5 oct.')
    expect(shortDate('2026-02-28')).toBe('28 févr.')
    expect(fmtInt(12345)).toBe('12 345')
    expect(fmtInt(999)).toBe('999')
    expect(ctrLabel(3, 100)).toBe('3,0 %')
    expect(ctrLabel(30, 100)).toBe('30 %')
    expect(ctrLabel(0, 0)).toBe('–')
    expect(parseTab('villes')).toBe('villes')
    expect(parseTab('bing')).toBe('ensemble')
  })
  it('villes comparées sans accents ni arrondissement', () => {
    expect(normCity('Saint-Étienne')).toBe('saint etienne')
    expect(cityMatches('Paris 15e', 'Paris')).toBe(true)
    expect(cityMatches('LYON', 'Lyon')).toBe(true)
    expect(cityMatches('Saint-Malo', 'Saint Malo')).toBe(true)
    expect(cityMatches('Parisot', 'Paris')).toBe(false)
    expect(cityMatches('', 'Paris')).toBe(false)
  })
  it('chemins des visites ramenés à ceux de Google', () => {
    expect(normPath('/blog/x/')).toBe('/blog/x')
    expect(normPath('/blog/x.html')).toBe('/blog/x')
    expect(normPath('/index.html')).toBe('/')
    expect(normPath('/annuaires/menage/caf%C3%A9')).toBe('/annuaires/menage/café')
  })
})

describe('recherches et pages', () => {
  const rows = [
    { query: 'photographe lyon', page: 'https://jasonmarinho.com/annuaires/photographes/a', clicks: 5, impressions: 100, position: 4 },
    { query: 'photographe lyon', page: 'https://jasonmarinho.com/photographe-lcd-lyon', clicks: 1, impressions: 200, position: 12 },
    { query: 'jason marinho', page: 'https://jasonmarinho.com/', clicks: 30, impressions: 40, position: 1 },
  ]
  it('page principale d\'une recherche', () => {
    const m = mainPageByQuery(rows)
    expect(m.get('photographe lyon')).toBe('/annuaires/photographes/a')
    const items = queryItems(aggregateQueries(rows, []), m)
    expect(items.find(i => i.query === 'jason marinho')).toMatchObject({ brand: true, mainPath: '/', mainLabel: 'Accueil' })
  })
  it('jours sans clic remplis à zéro', () => {
    expect(fillDays([{ date: '2026-10-02', clicks: 3, impressions: 9 }], ['2026-10-01', '2026-10-02']))
      .toEqual([{ date: '2026-10-01', clicks: 0, impressions: 0 }, { date: '2026-10-02', clicks: 3, impressions: 9 }])
  })
  it('visiteurs et pages les plus vues', () => {
    const v = [
      { session_id: 'a', path: '/blog/x' }, { session_id: 'a', path: '/blog/x/' }, { session_id: 'b', path: '/blog/x' },
      { session_id: 'b', path: '/' },
    ]
    expect(sessionsByPath(v).get('/blog/x')).toBe(2)
    expect(topVisitedPages(v)[0]).toMatchObject({ path: '/blog/x', views: 3, visitors: 2 })
  })
  it('tranche d\'une fiche', () => {
    expect(proBucketOf(q('x', 1), 10)).toBe('1')
    expect(proBucketOf(q('x', 14), 10)).toBe('11-20')
    expect(proBucketOf(null, 10)).toBe('masked')
    expect(proBucketOf(null, 0)).toBe('never')
  })
  it('évolution moyenne et meilleure recherche', () => {
    expect(weightedDelta([{ delta: 2, impressions: 30 }, { delta: -2, impressions: 10 }, { delta: null, impressions: 99 }])).toBe(1)
    expect(weightedDelta([{ delta: null, impressions: 5 }])).toBeNull()
    expect(bestQuery([q('a', 5, 10), q('b', 3, 1), q('c', 3, 50)])?.query).toBe('c')
    expect(bestQuery([])).toBeNull()
  })
})

describe('villes', () => {
  it('regroupe les pages par ville avec les pros inscrits', () => {
    const cities = groupCities([
      { path: '/menage-lcd-lyon', clicks: 4, impressions: 100, pagePlace: 8, delta: 2, queries: [q('menage airbnb lyon', 6, 80)] },
      { path: '/photographe-lcd-lyon', clicks: 1, impressions: 50, pagePlace: 15, delta: null, queries: [q('photographe lyon', 15, 50)] },
      { path: '/devenir-hote-airbnb-nantes', clicks: 0, impressions: 20, pagePlace: 30, delta: -1, queries: [] },
      { path: '/blog/x', clicks: 9, impressions: 900, pagePlace: 2, delta: null, queries: [] },
    ], [
      { kind: 'photographe', ville: 'Lyon 3e' }, { kind: 'menage', ville: 'lyon' }, { kind: 'menage', ville: 'Paris' },
    ])
    expect(cities.map(c => c.name)).toEqual(['Lyon', 'Nantes'])
    expect(cities[0]).toMatchObject({ clicks: 5, impressions: 150, delta: 2, pros: { photographes: 1, menage: 1 } })
    expect(cities[0].best?.query).toBe('menage airbnb lyon')
    expect(cities[0].themes.map(t => t.label)).toEqual(['Ménage', 'Photographe'])
  })
})

describe('filtres et tris', () => {
  const pro = (o: Partial<ProItem>): ProItem => ({
    id: o.name ?? 'x', kind: 'photographe', name: 'x', ville: 'Lyon', slug: 'x', online: true, paid: false, founder: false,
    statusLabel: null, clicks: 0, impressions: 0, bucket: 'never', main: null, pagePlace: null, prevPagePlace: null,
    visitors: 0, demandes: 0, queries: [], ...o,
  })
  const pros = [
    pro({ name: 'Anne', clicks: 5, impressions: 100, main: q('photographe lyon', 4), bucket: '4-10', paid: true, founder: true }),
    pro({ name: 'Bruno', kind: 'menage', ville: 'Nantes', clicks: 1, impressions: 300, main: q('menage nantes', 12), bucket: '11-20', visitors: 9 }),
    pro({ name: 'Céline', online: false }),
  ]
  it('fiches', () => {
    expect(filterPros(pros, { kind: 'all', filter: 'toutes', q: '', sort: 'clics' }).map(p => p.name)).toEqual(['Anne', 'Bruno', 'Céline'])
    expect(filterPros(pros, { kind: 'all', filter: 'toutes', q: '', sort: 'affichages' })[0].name).toBe('Bruno')
    expect(filterPros(pros, { kind: 'all', filter: 'toutes', q: '', sort: 'place' }).map(p => p.name)).toEqual(['Anne', 'Bruno', 'Céline'])
    expect(filterPros(pros, { kind: 'all', filter: 'toutes', q: '', sort: 'visiteurs' })[0].name).toBe('Bruno')
    expect(filterPros(pros, { kind: 'menage', filter: 'toutes', q: '', sort: 'nom' }).map(p => p.name)).toEqual(['Bruno'])
    expect(filterPros(pros, { kind: 'all', filter: 'fondateur', q: '', sort: 'nom' }).map(p => p.name)).toEqual(['Anne'])
    expect(filterPros(pros, { kind: 'all', filter: 'hors-ligne', q: '', sort: 'nom' }).map(p => p.name)).toEqual(['Céline'])
    expect(filterPros(pros, { kind: 'all', filter: 'jamais', q: '', sort: 'nom' }).map(p => p.name)).toEqual(['Céline'])
    expect(filterPros(pros, { kind: 'all', filter: 'toutes', q: 'celine', sort: 'nom' }).map(p => p.name)).toEqual(['Céline'])
    expect(filterPros(pros, { kind: 'all', filter: 'toutes', q: 'nantes', sort: 'nom' }).map(p => p.name)).toEqual(['Bruno'])
  })
  it('recherches', () => {
    const it = (o: Partial<QueryItem>): QueryItem => ({ ...q('x', 5), brand: false, mainPath: null, mainLabel: null, ...o })
    const items = [
      it({ query: 'a', place: 3, delta: 2, isNew: false, clicks: 1 }),
      it({ query: 'b', place: 15, delta: -3, isNew: false, impressions: 500 }),
      it({ query: 'jason marinho', place: 1, brand: true, clicks: 40 }),
      it({ query: 'c', place: 8, delta: null, isNew: true }),
    ]
    expect(filterQueries(items, { filter: 'toutes', hideBrand: true, q: '', sort: 'place' }).map(x => x.query)).toEqual(['a', 'c', 'b'])
    expect(filterQueries(items, { filter: 'toutes', hideBrand: false, q: '', sort: 'clics' })[0].query).toBe('jason marinho')
    expect(filterQueries(items, { filter: 'progres', hideBrand: false, q: '', sort: 'place' }).map(x => x.query)).toEqual(['a'])
    expect(filterQueries(items, { filter: 'recul', hideBrand: false, q: '', sort: 'place' }).map(x => x.query)).toEqual(['b'])
    expect(filterQueries(items, { filter: 'nouvelles', hideBrand: false, q: '', sort: 'place' }).map(x => x.query)).toEqual(['jason marinho', 'c'])
    expect(filterQueries(items, { filter: 'toutes', hideBrand: false, q: '', sort: 'progression' }).map(x => x.query)[0]).toBe('a')
  })
  it('pages', () => {
    const page = (o: Partial<PageItem>): PageItem => ({ path: '/x', kind: 'blog', label: 'Blog · X', clicks: 0, impressions: 0, main: null, pagePlace: null, prevPagePlace: null, visitors: 0, queries: [], ...o })
    const items = [page({ path: '/blog/a', clicks: 3 }), page({ path: '/services/b', kind: 'service', label: 'Service · B', clicks: 9 })]
    expect(filterPages(items, { kind: 'all', q: '', sort: 'clics' })[0].path).toBe('/services/b')
    expect(filterPages(items, { kind: 'blog', q: '', sort: 'clics' }).map(p => p.path)).toEqual(['/blog/a'])
  })
})
