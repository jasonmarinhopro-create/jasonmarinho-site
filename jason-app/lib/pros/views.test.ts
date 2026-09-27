import { describe, it, expect } from 'vitest'
import { summarizeDailyViews } from './views'

describe('summarizeDailyViews', () => {
  const rows = [
    { day: '2026-09-27', views: 4 },
    { day: '2026-09-01', views: 2 },
    { day: '2026-08-31', views: 5 },
    { day: '2026-08-02', views: 1 },
    { day: '2026-07-15', views: 9 }, // hors des deux mois
  ]
  it('sépare ce mois-ci et le mois dernier', () => {
    const r = summarizeDailyViews(rows, '2026-09-27')
    expect(r.thisMonth).toBe(6)
    expect(r.lastMonth).toBe(6)
  })
  it('gère le passage d’année (janvier vs décembre)', () => {
    const r = summarizeDailyViews([{ day: '2026-12-31', views: 3 }, { day: '2027-01-02', views: 1 }], '2027-01-10')
    expect(r).toMatchObject({ thisMonth: 1, lastMonth: 3 })
  })
  it('renvoie 30 jours consécutifs, jours vides à 0, aujourd’hui en dernier', () => {
    const r = summarizeDailyViews(rows, '2026-09-27')
    expect(r.daily).toHaveLength(30)
    expect(r.daily[29]).toEqual({ day: '2026-09-27', views: 4 })
    expect(r.daily[0].day).toBe('2026-08-29')
    expect(r.daily.find(d => d.day === '2026-08-31')?.views).toBe(5)
    expect(r.daily.find(d => d.day === '2026-09-10')?.views).toBe(0)
  })
})
