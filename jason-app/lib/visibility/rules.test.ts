import { describe, it, expect } from 'vitest'
import {
  periodRange, pctChange, placeBucket, placeLabel, bucketCounts, pathOf, pageKind, proSlugOf, cityOf, cityName,
  pageLabel, aggregateQueries, aggregatePages, isBrandQuery, topRanked, nearlyFirstPage, sourceOf, countryName,
  regionName, bucketOf, bucketKeys, summarizeVisits, formatDuration, proTakeaways, granularityFor, parisDay,
  type QueryPageRow, type VisitRow,
} from './rules'

describe('périodes', () => {
  it('28 jours finissant 2 jours avant (retard de Google), et la période d\'avant', () => {
    const p = periodRange('28j', '2026-10-05', 2)
    expect(p).toMatchObject({ start: '2026-09-06', end: '2026-10-03', prevEnd: '2026-09-05', prevStart: '2026-08-09', days: 28 })
  })
  it('écart en %, null sans base', () => {
    expect(pctChange(110, 100)).toBe(10)
    expect(pctChange(5, 0)).toBeNull()
  })
  it('granularité', () => {
    expect(granularityFor(28)).toBe('day')
    expect(granularityFor(90)).toBe('week')
    expect(granularityFor(365)).toBe('month')
  })
})

describe('places', () => {
  it('libellés et tranches', () => {
    expect(placeLabel(1.2)).toBe('1er')
    expect(placeLabel(12.6)).toBe('13e')
    expect(placeBucket(2.4)).toBe('2-3')
    expect(placeBucket(10.4)).toBe('4-10')
    expect(placeBucket(10.6)).toBe('11-20')
    expect(placeBucket(25)).toBe('21+')
    expect(bucketCounts([1, 3, 8, 15, 40])).toEqual({ '1': 1, '2-3': 1, '4-10': 1, '11-20': 1, '21+': 1 })
  })
})

describe('pages', () => {
  it('chemin d\'une URL Google', () => {
    expect(pathOf('https://jasonmarinho.com/blog/mon-article/?x=1#a')).toBe('/blog/mon-article')
    expect(pathOf('https://jasonmarinho.com/')).toBe('/')
  })
  it('sortes de pages', () => {
    expect(pageKind('/')).toBe('accueil')
    expect(pageKind('/annuaires/photographes/marie-photo')).toBe('fiche-photographe')
    expect(pageKind('/annuaires/menage/clean-lyon')).toBe('fiche-menage')
    expect(pageKind('/annuaires/menage')).toBe('annuaire')
    expect(pageKind('/menage-lcd-la-rochelle')).toBe('ville')
    expect(pageKind('/devenir-hote-airbnb-lyon')).toBe('ville')
    expect(pageKind('/blog/micro-bic-2026')).toBe('blog')
    expect(pageKind('/calculateurs/prix')).toBe('simulateur')
    expect(pageKind('/lodgify-avis')).toBe('partenaire')
    expect(pageKind('/partenaires/indy')).toBe('partenaire')
    expect(pageKind('/comparatif-lodgify-smoobu')).toBe('comparatif')
    expect(pageKind('/services/contrats')).toBe('service')
    expect(pageKind('/contact')).toBe('autre')
    expect(proSlugOf('/annuaires/photographes/x')).toEqual({ kind: 'photographe', slug: 'x' })
  })
  it('villes', () => {
    expect(cityOf('/photographe-lcd-aix-en-provence')).toEqual({ slug: 'aix-en-provence', name: 'Aix-en-Provence', theme: 'photographe' })
    expect(cityName('la-rochelle')).toBe('La Rochelle')
    expect(cityName('saint-malo')).toBe('Saint-Malo')
    expect(cityName('le-mans')).toBe('Le Mans')
    expect(cityName('clermont-ferrand')).toBe('Clermont-Ferrand')
    expect(pageLabel('/menage-lcd-lyon')).toBe('Ménage · Lyon')
    expect(pageLabel('/blog/declarer-son-lmnp')).toBe('Blog · Declarer son lmnp')
  })
})

const rows = (list: Array<[string, string, number, number, number]>): QueryPageRow[] =>
  list.map(([query, page, clicks, impressions, position]) => ({ query, page, clicks, impressions, position }))

describe('recherches', () => {
  const cur = rows([
    ['photographe lyon', 'https://jasonmarinho.com/annuaires/photographes/a', 5, 100, 4],
    ['photographe lyon', 'https://jasonmarinho.com/photographe-lcd-lyon', 1, 100, 12],
    ['jason marinho', 'https://jasonmarinho.com/', 30, 40, 1],
    ['micro bic', 'https://jasonmarinho.com/blog/micro-bic', 0, 300, 14],
  ])
  const prev = rows([
    ['photographe lyon', 'https://jasonmarinho.com/annuaires/photographes/a', 1, 50, 9],
  ])
  it('regroupe par recherche, place pondérée, évolution', () => {
    const q = aggregateQueries(cur, prev)
    const lyon = q.find(s => s.query === 'photographe lyon')!
    expect(lyon.clicks).toBe(6)
    expect(lyon.position).toBe(8)
    expect(lyon.delta).toBe(1)
    expect(q.find(s => s.query === 'micro bic')!.isNew).toBe(true)
  })
  it('regroupe par page avec la recherche principale', () => {
    const p = aggregatePages(cur, prev)
    const fiche = p.find(x => x.path === '/annuaires/photographes/a')!
    expect(fiche.kind).toBe('fiche-photographe')
    expect(fiche.main?.query).toBe('photographe lyon')
    expect(fiche.delta).toBe(5)
  })
  it('en tête sans notre nom, et à un pas de la première page', () => {
    const q = aggregateQueries(cur, prev)
    expect(isBrandQuery('Jason Marinho avis')).toBe(true)
    expect(topRanked(q).map(s => s.query)).toEqual([])
    expect(nearlyFirstPage(q).map(s => s.query)).toEqual(['micro bic'])
  })
})

describe('provenance des visites', () => {
  const v = (referrer: string | null, utm_source: string | null = null, utm_medium: string | null = null) => sourceOf({ referrer, utm_source, utm_medium })
  it('reconnaît les IA, réseaux, moteurs, e-mails, interne et direct', () => {
    expect(v('https://chatgpt.com/')).toMatchObject({ kind: 'ia', ai: 'ChatGPT' })
    expect(v(null, 'chatgpt.com')).toMatchObject({ kind: 'ia', ai: 'ChatGPT' })
    expect(v('https://www.perplexity.ai/search')).toMatchObject({ kind: 'ia', ai: 'Perplexity' })
    expect(v('https://gemini.google.com/')).toMatchObject({ kind: 'ia', ai: 'Gemini' })
    expect(v('https://claude.ai/')).toMatchObject({ kind: 'ia', ai: 'Claude' })
    expect(v('https://www.google.fr/')).toMatchObject({ kind: 'google' })
    expect(v('https://l.facebook.com/')).toMatchObject({ kind: 'facebook' })
    expect(v(null, 'facebook')).toMatchObject({ kind: 'facebook' })
    expect(v('https://www.bing.com/')).toMatchObject({ kind: 'autre-moteur' })
    expect(v(null, 'prospection', 'email')).toMatchObject({ kind: 'e-mail' })
    expect(v('https://jasonmarinho.com/annuaires/menage')).toMatchObject({ kind: 'interne' })
    expect(v(null)).toMatchObject({ kind: 'direct' })
    expect(v('https://driing.co/x')).toMatchObject({ kind: 'autre-site', site: 'driing.co' })
  })
})

describe('pays et régions', () => {
  it('noms en français', () => {
    expect(countryName('FR')).toBe('France')
    expect(regionName('FR', 'IDF')).toBe('Île-de-France')
    expect(regionName('PT', '18')).toBe('Viseu')
    expect(regionName('US', 'CA')).toBe('CA')
  })
})

describe('séries', () => {
  it('semaine commencée le lundi, mois, clés sans trou', () => {
    expect(bucketOf('2026-10-04', 'week')).toBe('2026-09-28')
    expect(bucketOf('2026-10-04', 'month')).toBe('2026-10-01')
    expect(bucketKeys('2026-08-15', '2026-10-04', 'month')).toEqual(['2026-08-01', '2026-09-01', '2026-10-01'])
    expect(bucketKeys('2026-10-01', '2026-10-03', 'day')).toHaveLength(3)
  })
  it('jour de Paris', () => {
    expect(parisDay('2026-07-14T22:30:00Z')).toBe('2026-07-15')
  })
})

describe('résumé des visites', () => {
  const visit = (o: Partial<VisitRow>): VisitRow => ({ session_id: 's1', path: '/annuaires/photographes/a', referrer: null, utm_source: null, utm_medium: null, created_at: '2026-10-01T10:00:00Z', ...o })
  it('visiteurs = sessions, provenance de la première page, temps par visiteur', () => {
    const s = summarizeVisits([
      visit({ session_id: 's1', referrer: 'https://www.google.com/', country: 'FR', region: 'IDF', city: 'Paris', device: 'mobile', duration_s: 40 }),
      visit({ session_id: 's1', created_at: '2026-10-01T10:05:00Z', referrer: 'https://jasonmarinho.com/', duration_s: 20 }),
      visit({ session_id: 's2', referrer: 'https://chatgpt.com/', country: 'PT', region: '18', device: 'desktop', created_at: '2026-10-02T10:00:00Z' }),
      visit({ session_id: 's3', created_at: '2026-10-02T11:00:00Z' }),
    ], { start: '2026-10-01', end: '2026-10-03', granularity: 'day' })
    expect(s.visitors).toBe(3)
    expect(s.views).toBe(4)
    expect(s.avgSeconds).toBe(60)
    expect(s.sources.map(x => x.key)).toEqual(expect.arrayContaining(['google', 'ia', 'direct']))
    expect(s.ai.ChatGPT).toBe(1)
    expect(s.countries[0]).toMatchObject({ label: 'France', count: 1, pct: 50 })
    expect(s.regions.map(r => r.label)).toEqual(expect.arrayContaining(['Île-de-France', 'Viseu']))
    expect(s.devices.map(d => d.label)).toEqual(expect.arrayContaining(['Téléphone', 'Ordinateur']))
    expect(s.series).toEqual([
      { key: '2026-10-01', visitors: 1, views: 2 },
      { key: '2026-10-02', visitors: 2, views: 2 },
      { key: '2026-10-03', visitors: 0, views: 0 },
    ])
    expect(s.measured).toBe(2)
  })
  it('durées', () => {
    expect(formatDuration(45)).toBe('45 s')
    expect(formatDuration(125)).toBe('2 min 05')
  })
})

describe('conseils aux pros', () => {
  const base = { visitors: 0, demandes: 0, clicks: 0, googleImpressions: 0, googleFirstPage: 0, googleQueries: 0, bestNearly: null, sources: [], mobilePct: null, ficheAgeDays: 100, metier: 'photographe' as const }
  it('visites sans demande, presque en première page, téléphone', () => {
    const t = proTakeaways({ ...base, visitors: 40, bestNearly: { query: 'photographe lyon', place: 13 }, mobilePct: 60, sources: [{ key: 'google', count: 40 }] })
    const titles = t.map(x => x.title)
    expect(titles).toContain('Des visites, pas encore de demande')
    expect(titles).toContain('Presque en première page')
    expect(titles.length).toBeLessThanOrEqual(4)
    expect(t.every(x => !x.text.includes('—'))).toBe(true)
  })
  it('fiche toute neuve', () => {
    expect(proTakeaways({ ...base, ficheAgeDays: 5 })[0].title).toBe('Ta fiche démarre')
  })
})
