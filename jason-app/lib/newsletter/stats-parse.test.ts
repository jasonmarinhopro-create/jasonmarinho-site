import { describe, it, expect } from 'vitest'
import { parseCampaignStats, parseLinkStats, buildIssueReports, campaignCode, nextSendDate, linkLabel } from './stats-parse'

describe('statistiques de la lettre', () => {
  it('lit les statistiques globales de Brevo, ou les additionne par liste', () => {
    expect(parseCampaignStats({ statistics: { globalStats: { sent: 24, delivered: 23, uniqueViews: 12, uniqueClicks: 4, unsubscriptions: 1, hardBounces: 1, softBounces: 0 } } }))
      .toEqual({ sent: 24, delivered: 23, opens: 12, clicks: 4, unsubscribed: 1, bounces: 1 })
    expect(parseCampaignStats({ statistics: { globalStats: {}, campaignStats: [{ listId: 3, sent: 10, delivered: 10, uniqueViews: 5, uniqueClicks: 1 }, { listId: 9, sent: 2, delivered: 2, uniqueViews: 1, uniqueClicks: 1 }] } }))
      .toMatchObject({ sent: 12, delivered: 12, opens: 6, clicks: 2 })
    expect(parseCampaignStats({})).toBeNull()
  })

  it('regroupe les clics par lien sans les paramètres de suivi', () => {
    const links = parseLinkStats({ statistics: { linksStats: {
      'https://jasonmarinho.com/blog/x?utm_source=newsletter&utm_campaign=a': 3,
      'https://jasonmarinho.com/blog/x?utm_source=newsletter&utm_campaign=b': 2,
      'https://app.jasonmarinho.com/dashboard/investir?utm_source=newsletter': 1,
      '{{ unsubscribe }}': 4,
    } } })
    expect(links).toEqual([
      { url: 'https://jasonmarinho.com/blog/x', label: '/blog/x', clicks: 5 },
      { url: 'https://app.jasonmarinho.com/dashboard/investir', label: 'App /investir', clicks: 1 },
    ])
    expect(linkLabel('https://www.impots.gouv.fr/a/')).toBe('impots.gouv.fr/a')
  })

  it('une ligne par lettre et édition, avec nos visiteurs et inscriptions', () => {
    expect(campaignCode('2026-11')).toBe('lettre-2026-11')
    expect(campaignCode('2026-11#photographe')).toBe('lettre-2026-11-photographe')
    const rows = buildIssueReports({
      now: new Date('2026-11-05T10:00:00Z'),
      issues: [
        { month: '2026-11', status: 'programmee', campaign_id: 1, subject: 'Une', scheduled_at: '2026-11-03T08:30:00Z', recipients: 23 },
        { month: '2026-11#photographe', status: 'programmee', campaign_id: 2, subject: 'Une', scheduled_at: '2026-11-03T08:30:00Z', recipients: 1 },
        { month: '2026-10', status: 'pas-assez', campaign_id: null, subject: null, scheduled_at: null },
      ],
      stats: new Map([[1, { stats: { sent: 23, delivered: 20, opens: 10, clicks: 3, unsubscribed: 0, bounces: 0 }, links: [] }]]),
      visits: [{ session_id: 's1', utm_campaign: 'lettre-2026-11' }, { session_id: 's1', utm_campaign: 'lettre-2026-11' }, { session_id: 's2', utm_campaign: 'lettre-2026-11' }],
      signups: [{ campaign: 'lettre-2026-11', paid: true }, { campaign: 'autre', paid: false }],
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ edition: 'hote', sent: true, openRate: 50, clickRate: 15, visitors: 2, signups: 1, clients: 1, recipients: 23 })
    expect(rows[1]).toMatchObject({ edition: 'photographe', stats: null, visitors: 0 })
  })

  it('prochain envoi : le mardi après le premier lundi du mois', () => {
    expect(nextSendDate('2026-10-11')).toBe('2026-11-03')
    expect(nextSendDate('2026-11-02')).toBe('2026-11-03')
    expect(nextSendDate('2026-11-04')).toBe('2026-12-08')
  })
})
