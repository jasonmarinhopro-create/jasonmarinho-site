import { describe, it, expect } from 'vitest'
import { buildChannelCards, buildToday, buildSnapshot, visitChannel, acquisitionChannel, type TrafficVisit } from './traffic'

const v = (o: Partial<TrafficVisit>): TrafficVisit => ({ session_id: 's', path: '/', referrer: null, utm_source: null, utm_medium: null, utm_campaign: null, created_at: '2026-10-10T08:00:00Z', ...o })
const links = [
  { code: 'groupe-k3f9', label: 'Groupe Hôtes', channel: 'facebook_groupe' },
  { code: 'insta-ab12', label: 'Bio Instagram', channel: 'instagram' },
]
const map = new Map(links.map(l => [l.code, l]))

describe('canaux', () => {
  it('classe visites et inscriptions', () => {
    expect(visitChannel(v({ utm_campaign: 'groupe-k3f9', utm_source: 'facebook' }), map)).toBe('facebook')
    expect(visitChannel(v({ utm_campaign: 'insta-ab12', utm_source: 'instagram' }), map)).toBe('liens')
    expect(visitChannel(v({ referrer: 'https://www.google.fr/' }), map)).toBe('google')
    expect(visitChannel(v({ referrer: 'https://chatgpt.com/' }), map)).toBe('ia')
    expect(visitChannel(v({ utm_source: 'prospection', utm_medium: 'email' }), map)).toBe('email')
    expect(visitChannel(v({ referrer: 'https://le13depic.wixsite.com/' }), map)).toBe('autres')
    expect(visitChannel(v({}), map)).toBe('direct')
    expect(acquisitionChannel(null, map)).toBe('sans')
    expect(acquisitionChannel({ source: 'facebook', campaign: 'groupe-k3f9' }, map)).toBe('facebook')
    expect(acquisitionChannel({ landing: '/' }, map)).toBe('direct')
  })

  it('cartes par canal : visiteurs (première page), inscriptions, clients, clics, Google', () => {
    const cards = buildChannelCards({
      start: '2026-10-04', end: '2026-10-10',
      links,
      visits: [
        v({ session_id: 'a', referrer: 'https://www.google.fr/' }),
        v({ session_id: 'a', path: '/tarifs', created_at: '2026-10-10T08:05:00Z' }),
        v({ session_id: 'b', utm_campaign: 'groupe-k3f9', utm_source: 'facebook' }),
        v({ session_id: 'c', referrer: 'https://chatgpt.com/' }),
        v({ session_id: 'd', created_at: '2026-09-01T08:00:00Z' }),
      ],
      members: [
        { id: '1', created_at: '2026-10-09T08:00:00Z', acquisition: { source: 'facebook', campaign: 'groupe-k3f9' }, paid: true },
        { id: '2', created_at: '2026-10-09T08:00:00Z', acquisition: null, paid: false },
      ],
      clicks: [{ code: 'groupe-k3f9', created_at: '2026-10-09T08:00:00Z' }, { code: 'groupe-k3f9', created_at: '2026-10-10T07:00:00Z' }],
      gsc: [{ date: '2026-10-07', clicks: 4, impressions: 100, position: 8 }, { date: '2026-10-08', clicks: 2, impressions: 100, position: 10 }],
    })
    const c = Object.fromEntries(cards.map(x => [x.key, x]))
    expect(c.google).toMatchObject({ visitors: 1, clicks: 6, note: '200 affichages · place moyenne 9,0' })
    expect(c.facebook).toMatchObject({ visitors: 1, signups: 1, clients: 1, clicks: 2, top: [{ name: 'Groupe Hôtes', count: 2 }] })
    expect(c.ia).toMatchObject({ visitors: 1, top: [{ name: 'ChatGPT', count: 1 }] })
    expect(c.direct.visitors).toBe(0)
    expect(c.sans).toMatchObject({ visitors: null, signups: 1 })
  })

  it('aujourd\'hui : en ce moment, sources (hier si rien), liens, Google', () => {
    const now = new Date('2026-10-10T10:00:00Z')
    const t = buildToday({
      now, links,
      visits: [
        v({ session_id: 'a', path: '/annuaires/photographes', created_at: '2026-10-10T09:58:00Z', utm_campaign: 'groupe-k3f9', utm_source: 'facebook' }),
        v({ session_id: 'b', referrer: 'https://www.google.fr/', created_at: '2026-10-09T12:00:00Z' }),
        v({ session_id: 'c', created_at: '2026-10-10T09:40:00Z' }),
      ],
      members: [{ id: '1', created_at: '2026-10-10T09:00:00Z', acquisition: null, paid: false }],
      clicks: [{ code: 'groupe-k3f9', created_at: '2026-10-10T09:57:00Z' }, { code: 'groupe-k3f9', created_at: '2026-10-09T09:57:00Z' }],
      gsc: [{ date: '2026-10-07', clicks: 4, impressions: 100, position: 8 }, { date: '2026-10-08', clicks: 2, impressions: 50, position: 10 }],
    })
    expect(t).toMatchObject({ liveNow: 1, last30: 2, visitorsToday: 2, visitorsYesterday: 1, clicksToday: 1, clicksYesterday: 1, clicksLast30: 1, signupsToday: 1, sourcesDay: 'today' })
    expect(t.sources).toEqual(expect.arrayContaining([{ name: 'Groupe Hôtes', count: 1 }, { name: 'Accès direct', count: 1 }]))
    expect(t.recentLinks[0]).toMatchObject({ code: 'groupe-k3f9', count: 2 })
    expect(t.linkPagesToday[0]).toMatchObject({ count: 1, links: ['Groupe Hôtes'] })
    expect(t.google.day?.date).toBe('2026-10-08')
    expect(t.google.week).toMatchObject({ clicks: 6, impressions: 150 })
  })

  it('résumé de la Vue d\'ensemble : jour et 7 jours', () => {
    const s = buildSnapshot({
      now: new Date('2026-10-10T10:00:00Z'), links,
      visits: [v({ session_id: 'a', referrer: 'https://www.google.fr/' }), v({ session_id: 'b', created_at: '2026-10-09T08:00:00Z' })],
      members: [], clicks: [],
      gsc: [{ date: '2026-10-08', clicks: 3, impressions: 40, position: 9 }],
    })
    expect(s.day).toMatchObject({ visitors: 1, prevVisitors: 1, google: { clicks: 3, label: 'le 8 oct.' } })
    expect(s.week).toMatchObject({ visitors: 2, topChannels: [{ label: 'Google', visitors: 1 }, { label: 'Accès direct', visitors: 1 }] })
  })
})
