import { describe, it, expect } from 'vitest'
import { buildVisibility, type VisibilityInput, type ProRow } from './admin-build'
import { periodRange } from './rules'

const O = 'https://jasonmarinho.com'
const pro = (o: Partial<ProRow>): ProRow => ({
  id: 'p1', slug: 'marie', full_name: 'Marie Photo', pseudo: null, ville: 'Lyon', status: 'active', is_public: true,
  tier: 'fondateur', stripe_subscription_status: 'active', ...o,
})

function input(over: Partial<VisibilityInput> = {}): VisibilityInput {
  const cur = [
    { query: 'photographe lyon', page: `${O}/annuaires/photographes/marie`, clicks: 4, impressions: 80, position: 3 },
    { query: 'menage airbnb lyon', page: `${O}/menage-lcd-lyon`, clicks: 2, impressions: 60, position: 12 },
    { query: 'jason marinho', page: `${O}/`, clicks: 20, impressions: 30, position: 1 },
    { query: 'taxe de sejour', page: `${O}/blog/taxe`, clicks: 1, impressions: 200, position: 8 },
  ]
  const pages = new Map(cur.map(r => [r.page, { clicks: r.clicks, impressions: r.impressions, position: r.position }]))
  pages.set(`${O}/annuaires/menage/clean`, { clicks: 0, impressions: 9, position: 40 })
  return {
    periodKey: '28j', tab: 'ensemble',
    gscPeriod: periodRange('28j', '2026-10-05', 2), visitPeriod: periodRange('28j', '2026-10-05', 0),
    qp: { ok: true, data: { cur, prev: [] } },
    daily: { ok: true, data: { days: [{ date: '2026-10-01', clicks: 27, impressions: 370 }], total: { clicks: 27, impressions: 370 }, prevTotal: { clicks: 20, impressions: 300 } } },
    truth: { ok: true, data: { cur: pages, prev: new Map() } },
    visitsRes: { ok: true, rows: [
      { session_id: 'a', path: '/annuaires/photographes/marie', referrer: 'https://www.google.fr/', utm_source: null, utm_medium: null, created_at: '2026-10-02T10:00:00Z' },
      { session_id: 'b', path: '/', referrer: 'https://chatgpt.com/', utm_source: null, utm_medium: null, created_at: '2026-10-03T10:00:00Z' },
    ] },
    prevVisitsRes: { ok: true, rows: [] },
    prosRes: { ok: true, photographers: [pro({})], cleaners: [pro({ id: 'c1', slug: 'clean', full_name: 'Clean', tier: 'standard' }), pro({ id: 'c2', slug: null, full_name: 'Hors ligne', status: 'pending_validation', is_public: false })] },
    demandes: new Map([['p1', 2]]),
    ...over,
  }
}

describe('buildVisibility', () => {
  it('vue d\'ensemble', () => {
    const d = buildVisibility(input())
    expect(d.hero).toMatchObject({ clicks: 27, clicksPct: 35, visitors: 2 })
    expect(d.counts).toMatchObject({ fiches: 3, recherches: 4, villes: 1, pages: 2, visiteurs: 2 })
    expect(d.ensemble).toMatchObject({ firstPage: 2, queriesTotal: 4, brandQueries: 1, prosFirstPage: 1, prosOnline: 2, fromGoogle: 1, fromAi: 1 })
    expect(d.ensemble!.nearly.map(q => q.query)).toEqual(['menage airbnb lyon'])
    expect(d.fiches).toBeUndefined()
  })
  it('fiches pros : place, recherches masquées, jamais montrée, visiteurs et demandes', () => {
    const d = buildVisibility(input({ tab: 'fiches' }))
    const [marie, clean, off] = d.fiches!.items
    expect(marie).toMatchObject({ bucket: '2-3', visitors: 1, demandes: 2, paid: true, founder: true, online: true })
    expect(clean).toMatchObject({ bucket: 'masked', impressions: 9 })
    expect(off).toMatchObject({ bucket: 'never', online: false, statusLabel: 'En validation' })
    expect(d.fiches!.buckets).toMatchObject({ '2-3': 1, masked: 1, never: 0 })
  })
  it('villes avec pros inscrits (fiche en validation comprise, refusée exclue)', () => {
    const d = buildVisibility(input({ tab: 'villes' }))
    expect(d.villes!.items[0]).toMatchObject({ name: 'Lyon', pros: { photographes: 1, menage: 2 } })
    const refusee = buildVisibility(input({ tab: 'villes', prosRes: { ok: true, photographers: [pro({ status: 'rejected' })], cleaners: [] } }))
    expect(refusee.villes!.items[0].pros).toEqual({ photographes: 0, menage: 0 })
  })
  it('Google en panne : les visites restent', () => {
    const fail = { ok: false as const, error: 'x', auth: true }
    const d = buildVisibility(input({ qp: fail, daily: fail, truth: fail }))
    expect(d.gsc).toMatchObject({ ok: false, auth: true })
    expect(d.hero.clicks).toBeNull()
    expect(d.hero.visitors).toBe(2)
    expect(d.counts.recherches).toBeUndefined()
  })
  it('visites en panne : Google reste', () => {
    const d = buildVisibility(input({ tab: 'visiteurs', visitsRes: { ok: false, error: 'base' } }))
    expect(d.visits.ok).toBe(false)
    expect(d.hero.clicks).toBe(27)
    expect(d.hero.visitors).toBeNull()
  })
})
