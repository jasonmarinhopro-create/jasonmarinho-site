import { describe, it, expect } from 'vitest'
import { buildPartners, partnerInfo, affilaeSalesFor, euros, type ClickRow } from './partners'
import { periodRange, type VisitRow } from './rules'
import type { AffilaeOverview } from '@/lib/affiliation/affilae'

const period = periodRange('7j', '2026-10-05')
const visit = (o: Partial<VisitRow>): VisitRow => ({ session_id: 's1', path: '/lodgify-avis', referrer: null, utm_source: null, utm_medium: null, created_at: '2026-10-03T10:00:00Z', ...o })
const click = (o: Partial<ClickRow>): ClickRow => ({ session_id: 's1', path: '/lodgify-avis', partner: 'lodgify', created_at: '2026-10-03T10:01:00Z', ...o })

const affilae: AffilaeOverview = {
  state: 'ok', fetchedAt: '2026-10-05T10:00:00Z', missing: [],
  summary: {
    programs: [{ id: 'p1', name: 'Indy', status: 'actif', trackingId: 1994, clicks: 12, conversions: 2, commissionCents: 2500, byStatus: { en_attente: 1000, validee: 1500, refusee: 0, payee: 0 } }],
    totals: { conversions: 2, commissionCents: 2500, byStatus: { en_attente: 1000, validee: 1500, refusee: 0, payee: 0 }, clicks: 12 },
    recent: [],
  },
}

describe('partenaires', () => {
  it('noms et rémunération connus, repli lisible sinon', () => {
    expect(partnerInfo('lodgify').name).toBe('Lodgify')
    expect(partnerInfo('indy').affilae).toBe(true)
    expect(partnerInfo('smoobu')).toMatchObject({ name: 'Smoobu', affilae: false })
  })
  it('ventes Affilae retrouvées par le nom du programme', () => {
    expect(affilaeSalesFor('Indy', affilae)).toMatchObject({ conversions: 2, commissionCents: 2500 })
    expect(affilaeSalesFor('Tiime', affilae)).toBeNull()
    expect(affilaeSalesFor('Indy', { state: 'absent' })).toBeNull()
    expect(euros(2500)).toBe('25,00 €')
  })
  it('« Shine » ne prend pas les ventes de « Shine Facture »', () => {
    const prog = (id: string, name: string, conversions: number) => ({ ...affilae.summary.programs[0], id, name, conversions })
    const two: AffilaeOverview = { ...affilae, summary: { ...affilae.summary, programs: [prog('a', 'Shine Facture', 5), prog('b', 'Shine', 1)] } }
    expect(affilaeSalesFor('Shine', two)?.conversions).toBe(1)
    expect(affilaeSalesFor('Shine Facture', two)?.conversions).toBe(5)
    expect(partnerInfo('shine-facture')).toMatchObject({ name: 'Shine Facture', affilae: true })
  })

  it('clics par partenaire et par page, taux, provenance de ceux qui cliquent', () => {
    const d = buildPartners({
      period,
      visits: [
        visit({ session_id: 's1', referrer: 'https://www.google.fr/' }),
        visit({ session_id: 's2', referrer: 'https://chatgpt.com/' }),
        visit({ session_id: 's3' }),
        visit({ session_id: 's4', path: '/comparatif-lodgify-smoobu' }),
      ],
      clicks: [
        click({ session_id: 's1' }),
        click({ session_id: 's1', created_at: '2026-10-03T10:02:00Z' }),
        click({ session_id: 's2', partner: 'indy' }),
      ],
      prevClicks: [click({ session_id: 'x', created_at: '2026-09-25T10:00:00Z' })],
      pages: new Map([['/lodgify-avis', { impressions: 300, position: 6.4 }], ['/comparatif-lodgify-smoobu', { impressions: 500, position: 12 }]]),
      affilae,
    })
    expect(d.clicks).toBe(3)
    expect(d.clicksPct).toBe(200)
    expect(d.clickers).toBe(2)
    expect(d.siteVisitors).toBe(4)
    expect(d.clickRatePct).toBe(50)

    const lodgify = d.partners.find(p => p.slug === 'lodgify')!
    expect(lodgify).toMatchObject({ clicks: 2, clickers: 1, prevClicks: 1 })
    expect(lodgify.sources[0].key).toBe('google')
    expect(d.partners.find(p => p.slug === 'indy')!.sales?.conversions).toBe(2)
    // Partenaires connus affichés même sans clic
    expect(d.partners.some(p => p.slug === 'hospitable' && p.clicks === 0)).toBe(true)

    const page = d.pages[0]
    expect(page).toMatchObject({ path: '/lodgify-avis', clicks: 3, clickers: 2, visitors: 3, place: 6 })
    expect(page.ratePct).toBeCloseTo(66.7, 1)
    expect(page.partners.map(p => p.name)).toEqual(['Lodgify', 'Indy'])

    expect(d.opportunities.map(o => o.path)).toEqual(['/comparatif-lodgify-smoobu'])
    expect(d.sources.map(s => s.key).sort()).toEqual(['google', 'ia'])
    expect(d.series).toHaveLength(7)
    expect(d.series.reduce((n, s) => n + s.clicks, 0)).toBe(3)
  })
})

import { buildPartnerSeo } from './partners'

describe('pages des partenaires dans Google', () => {
  const stat = (query: string, clicks: number, impressions: number, position: number) => ({ query, clicks, impressions, position, prevPosition: null, delta: null, isNew: true })
  it('regroupe les pages par partenaire, avec les recherches visées et les meilleures recherches', () => {
    const groups = buildPartnerSeo({
      pageStats: [
        { path: '/lodgify-avis', clicks: 12, impressions: 400, position: 6.2, delta: 1, queries: [stat('lodgify avis', 10, 300, 5.6), stat('avis lodgify', 2, 100, 8)] },
        { path: '/blog/lodgify-ou-smoobu-2026', clicks: 1, impressions: 50, position: 14, delta: null, queries: [stat('lodgify ou smoobu', 1, 50, 14)] },
        { path: '/code-promo-lodgify', clicks: 4, impressions: 40, position: 2.4, delta: null, queries: [stat('code promo lodgify', 4, 40, 2.4)] },
      ],
      totals: new Map([['/lodgify-avis', { clicks: 14, impressions: 420, position: 6.1, prevPosition: 8 }]]),
      queries: [stat('lodgify avis', 10, 300, 5.6), stat('code promo lodgify', 4, 40, 2.4)],
    })
    const lodgify = groups.find(g => g.key === 'lodgify')!
    // Page trouvée par son nom, en plus de la liste fixe
    expect(lodgify.pages.map(p => p.path)).toContain('/blog/lodgify-ou-smoobu-2026')
    const avis = lodgify.pages[0]
    expect(avis).toMatchObject({ path: '/lodgify-avis', clicks: 14, place: 6, delta: 2 })
    expect(avis.ctrPct).toBeCloseTo(3.3, 1)
    // Page de la liste sans aucun affichage : affichée sans place
    expect(lodgify.pages.find(p => p.path === '/lodgify-prix')).toMatchObject({ place: null, impressions: 0 })
    expect(lodgify.targets.find(t => t.query === 'code promo lodgify')).toMatchObject({ place: 2, pageLabel: 'Partenaire · Code promo lodgify' })
    expect(lodgify.targets.find(t => t.query === 'lodgify prix')).toMatchObject({ place: null, impressions: 0 })
    expect(lodgify.best[0].query).toBe('lodgify avis')
    expect(groups.find(g => g.key === 'indy')!.pages.every(p => p.place === null)).toBe(true)
  })
})

import { partnerstackSalesFor } from './partners'

describe('ventes PartnerStack (Brevo)', () => {
  it('retrouve Brevo par son nom, ou le seul programme du compte', () => {
    const ok = {
      state: 'ok' as const, fetchedAt: '', missing: [],
      summary: { currency: 'EUR', programs: [{ name: 'Brevo', rewards: 3, commissionCents: 10500, byStatus: { en_attente: 10000, validee: 500, refusee: 0, payee: 0 }, customers: 2 }], totals: { rewards: 3, commissionCents: 10500, byStatus: { en_attente: 10000, validee: 500, refusee: 0, payee: 0 }, customers: 2 }, recent: [] },
    }
    expect(partnerInfo('brevo')).toMatchObject({ name: 'Brevo', partnerstack: true, salesWhere: 'PartnerStack' })
    expect(partnerstackSalesFor('Brevo', ok)).toMatchObject({ conversions: 3, commissionCents: 10500 })
    expect(partnerstackSalesFor('Brevo', { ...ok, summary: { ...ok.summary, programs: [{ ...ok.summary.programs[0], name: 'Sendinblue SAS' }] } })?.conversions).toBe(3)
    expect(partnerstackSalesFor('Brevo', { state: 'absent' })).toBeNull()
  })
})
