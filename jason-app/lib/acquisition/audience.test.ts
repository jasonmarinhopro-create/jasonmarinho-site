import { describe, it, expect } from 'vitest'
import { buildAudience } from './audience'
import type { TrafficVisit } from './traffic'

const v = (session_id: string, created_at: string, path = '/', referrer: string | null = null): TrafficVisit =>
  ({ session_id, path, referrer, utm_source: null, utm_medium: null, utm_campaign: null, created_at })
const now = new Date('2026-11-16T15:00:00Z')

describe('buildAudience', () => {
  const visits = [
    v('a', '2026-11-16T09:00:00Z', '/', 'https://www.google.com/'),
    v('a', '2026-11-16T09:01:00Z', '/chiffres'),
    v('b', '2026-11-16T10:00:00Z', '/chiffres'),
    v('c', '2026-11-15T10:00:00Z', '/blog/driing'),
    v('d', '2026-11-08T10:00:00Z', '/'),
    v('e', '2026-11-01T10:00:00Z', '/'),
  ]
  const members = [
    { id: '1', created_at: '2026-11-16T11:00:00Z', acquisition: null, paid: true },
    { id: '2', created_at: '2026-11-15T11:00:00Z', acquisition: null, paid: false },
    { id: '3', created_at: '2026-11-05T11:00:00Z', acquisition: null, paid: false },
  ]
  const gsc = [{ date: '2026-11-14', clicks: 5, impressions: 100, position: 8 }, { date: '2026-11-13', clicks: 3, impressions: 50, position: 9 }, { date: '2026-11-07', clicks: 2, impressions: 10, position: 9 }]
  const a = buildAudience({ visits, members, links: [], clicks: [], gsc, now })

  it('compte visiteurs, inscriptions et clients par période', () => {
    expect(a.day.visitors).toBe(2)
    expect(a.day.prevVisitors).toBe(1)
    expect(a.day.signups).toBe(1)
    expect(a.day.clients).toBe(1)
    expect(a.week.visitors).toBe(3)
    expect(a.week.prevVisitors).toBe(1)
    expect(a.week.signups).toBe(2)
    expect(a.week.prevSignups).toBe(1)
  })
  it('sources et pages lues', () => {
    expect(a.day.sources.find(s => s.key === 'google')?.count).toBe(1)
    expect(a.day.pages[0]).toMatchObject({ path: '/chiffres', views: 2 })
  })
  it('courbe jour par jour avec la période d’avant', () => {
    expect(a.week.series).toHaveLength(14)
    expect(a.month.series).toHaveLength(30)
    const last = a.week.series[13]
    expect(last).toMatchObject({ date: '2026-11-16', visitors: 2, signups: 1 })
    // 14 jours avant le 16 : le 2 (aucune visite) ; avant le 15 : le 1 (e)
    expect(a.week.series[12]).toMatchObject({ date: '2026-11-15', visitors: 1, prev: 1 })
  })
  it('Google sur la même durée, au dernier jour connu', () => {
    expect(a.day.google).toMatchObject({ clicks: 5, prevClicks: 3, to: '2026-11-14' })
    expect(a.week.google).toMatchObject({ clicks: 8, prevClicks: 2 })
  })
})
