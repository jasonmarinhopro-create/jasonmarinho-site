import { describe, it, expect } from 'vitest'
import {
  avgSecondsPerVisitor, bestNearly, bucketLabel, clickEventsOf, countByParisDay, dailySeries, daysBetween, fairPct,
  filterGoogle, frenchDate, googleTabOf, lastBucketIncomplete, mainSearch, parseProPeriod, proPeriodRange,
  screenAdvice, startedDuring, sumBetween, timeSeries, visitorSeries, visitsBetween,
} from './pro-stats'
import type { SearchStat, VisitRow } from './rules'

const v = (session_id: string, created_at: string, duration_s: number | null = null): VisitRow => ({
  session_id, path: '/annuaires/photographes/x', referrer: null, utm_source: null, utm_medium: null, created_at, duration_s,
})
const q = (query: string, position: number, impressions: number): SearchStat => ({ query, position, impressions, clicks: 0, prevPosition: null, delta: null, isNew: true })

describe('périodes des statistiques pros', () => {
  it('30 derniers jours (clé 28j), 3 mois, 12 mois ; défaut 30 jours', () => {
    expect(parseProPeriod('3m')).toBe('3m')
    expect(parseProPeriod('7j')).toBe('28j')
    expect(parseProPeriod(undefined)).toBe('28j')
    const p = proPeriodRange('28j', '2026-10-05')
    expect(p).toMatchObject({ start: '2026-09-06', end: '2026-10-05', prevEnd: '2026-09-05', prevStart: '2026-08-07', days: 30, granularity: 'day', label: '30 derniers jours' })
    expect(proPeriodRange('3m', '2026-10-05').granularity).toBe('week')
    expect(proPeriodRange('12m', '2026-10-05', 2)).toMatchObject({ end: '2026-10-03', granularity: 'month' })
  })
  it('écart seulement si le chiffre était mesuré au début de la période d\'avant', () => {
    expect(fairPct(20, 10, '2026-09-19', '2026-08-07')).toBeNull()
    expect(fairPct(20, 10, '2026-08-01', '2026-08-07')).toBe(100)
    expect(fairPct(20, 10, null, '2026-08-07')).toBe(100)
    expect(fairPct(5, 0, null, '2026-08-07')).toBeNull()
    expect(startedDuring('2026-10-05', '2026-09-06')).toBe(true)
    expect(startedDuring('2026-08-01', '2026-09-06')).toBe(false)
  })
})

describe('séries', () => {
  const period = proPeriodRange('28j', '2026-10-05')
  it('additionne par jour et superpose la période d\'avant', () => {
    const s = dailySeries([{ day: '2026-10-05', value: 3 }, { day: '2026-09-05', value: 2 }, { day: '2026-10-05', value: 1 }], period, { withPrev: true })
    expect(s).toHaveLength(30)
    expect(s[29]).toEqual({ key: '2026-10-05', cur: 4, prev: 2 })
    expect(s[0].prev).toBe(0)
    expect(dailySeries([], period, { withPrev: false })[0].prev).toBeNull()
  })
  it('regroupe par semaine sur 3 mois', () => {
    const p3 = proPeriodRange('3m', '2026-10-05')
    const s = dailySeries([{ day: '2026-10-05', value: 1 }, { day: '2026-09-30', value: 2 }], p3, { withPrev: false })
    // Le 5 octobre 2026 est un lundi : il ouvre sa propre semaine
    expect(s[s.length - 1]).toEqual({ key: '2026-10-05', cur: 1, prev: null })
    expect(s[s.length - 2]).toEqual({ key: '2026-09-28', cur: 2, prev: null })
  })
  it('sommes et demandes par jour de Paris', () => {
    expect(sumBetween([{ day: '2026-10-01', value: 2 }, { day: '2026-09-30', value: 5 }], '2026-10-01', '2026-10-31')).toBe(2)
    // 23 h 30 UTC le 30 septembre = 1er octobre à Paris
    expect(countByParisDay(['2026-09-30T23:30:00Z', '2026-10-01T08:00:00Z'])).toEqual([{ day: '2026-10-01', value: 2 }])
  })
  it('visiteurs distincts par jour, période d\'avant décalée', () => {
    const rows = [v('a', '2026-10-05T10:00:00Z'), v('a', '2026-10-05T11:00:00Z'), v('b', '2026-10-05T12:00:00Z'), v('c', '2026-09-05T12:00:00Z')]
    const s = visitorSeries(rows, period, { withPrev: true })
    expect(s[29]).toEqual({ key: '2026-10-05', cur: 2, prev: 1 })
    expect(visitsBetween(rows, period.start, period.end)).toHaveLength(3)
  })
  it('temps de lecture moyen par visiteur', () => {
    expect(avgSecondsPerVisitor([v('a', '2026-10-05T10:00:00Z', 30), v('a', '2026-10-05T10:05:00Z', 30), v('b', '2026-10-05T10:00:00Z', 120)])).toBe(90)
    expect(avgSecondsPerVisitor([v('a', '2026-10-05T10:00:00Z')])).toBeNull()
    expect(timeSeries([v('a', '2026-10-05T10:00:00Z', 40)], period, { withPrev: false })[29].cur).toBe(40)
  })
  it('dernier point en cours pour un mois ou une semaine pas finis', () => {
    expect(lastBucketIncomplete('2026-10-05', 'month')).toBe(true)
    expect(lastBucketIncomplete('2026-09-30', 'month')).toBe(false)
    expect(lastBucketIncomplete('2026-10-04', 'week')).toBe(false) // dimanche
    expect(lastBucketIncomplete('2026-10-05', 'day')).toBe(false)
  })
  it('libellés de dates', () => {
    expect(bucketLabel('2026-10-05', 'day')).toBe('5 oct.')
    expect(bucketLabel('2026-09-28', 'week', { long: true })).toBe('semaine du 28 sept.')
    expect(bucketLabel('2026-10-01', 'month', { long: true })).toBe('octobre 2026')
    expect(frenchDate('2026-10-05')).toBe('5 octobre 2026')
    expect(daysBetween('2026-09-12', '2026-10-05')).toBe(23)
  })
})

describe('Google', () => {
  const stats = [q('photographe lyon', 3.2, 220), q('photo airbnb lyon', 12.4, 300), q('gîte rhône', 24, 40), q('photographe immobilier', 8.6, 90)]
  it('onglets par place', () => {
    expect(googleTabOf(10.4)).toBe('premiere')
    expect(googleTabOf(10.6)).toBe('juste-apres')
    expect(googleTabOf(21)).toBe('plus-loin')
    expect(filterGoogle(stats, 'premiere').map(s => s.query)).toEqual(['photographe lyon', 'photographe immobilier'])
    expect(filterGoogle(stats, 'toutes')).toHaveLength(4)
  })
  it('recherche principale et presque en première page', () => {
    expect(mainSearch(stats)?.query).toBe('photo airbnb lyon')
    expect(bestNearly(stats)).toEqual({ query: 'photo airbnb lyon', place: 12 })
    expect(mainSearch([])).toBeNull()
  })
})

describe('textes', () => {
  it('clics suivis selon le métier', () => {
    expect(clickEventsOf('photographe').map(e => e.key)).toEqual(['portfolio', 'instagram'])
    expect(clickEventsOf('menage').map(e => e.key)).toEqual(['site', 'instagram'])
  })
  it('conseil sur l\'écran sans tiret cadratin', () => {
    expect(screenAdvice('photographe', null)).toContain('tes photos doivent y être belles')
    expect(screenAdvice('menage', 70)).toContain('70 %')
    for (const t of [screenAdvice('photographe', 30), screenAdvice('menage', 30), screenAdvice('menage', null)]) expect(t).not.toMatch(/\u2014/)
  })
})
