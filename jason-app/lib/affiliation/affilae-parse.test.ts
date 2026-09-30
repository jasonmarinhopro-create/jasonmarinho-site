import { describe, it, expect } from 'vitest'
import { summarizeAffilae, listData, conversionStatus } from './affilae-parse'

// Forme relevée sur le compte réel le 30/09/2026 (valeurs anonymisées)
const partnerships = {
  statusCode: 200,
  partnerships: {
    data: [
      { id: 'p1', advertiser: '651c09ceeb35e1061de8d27f', program: { id: 'x' }, trackingId: 1127, status: 'pending' },
      { id: 'p2', advertiser: '5e3c32d7acb4603ec9da8e33', program: { id: 'y' }, trackingId: 1994, status: 'active', stats: { clicks: { total: 3, total_capped: 3 } } },
    ],
  },
}

describe('summarizeAffilae', () => {
  it('liste les partenariats, actifs en premier, Indy reconnu', () => {
    const s = summarizeAffilae({ partnerships, conversions: { conversions: { total: 0, data: [] } }, clicks: { clicks: { total: 3, data: [] } } })
    expect(s.programs.map(p => [p.name, p.status, p.trackingId, p.clicks])).toEqual([
      ['Indy', 'actif', 1994, 3],
      ['Programme n° 1127', 'en_attente', 1127, null],
    ])
    expect(s.totals).toEqual({ conversions: 0, commissionCents: 0, byStatus: { en_attente: 0, validee: 0, refusee: 0, payee: 0 }, clicks: 3 })
  })

  it('additionne les commissions en centimes par statut et par programme', () => {
    const conversions = { conversions: { total: 3, data: [
      { partnership: 'p2', commission: 1000, status: 'pending', createdAt: '2026-10-01T10:00:00.000Z' },
      { partnershipName: 'Indy', commission: { amount: 3500 }, status: 'accepted', createdAt: '2026-10-03T10:00:00.000Z' },
      { partnership: 'p2', commission: '12000', status: 'refused' },
    ] } }
    const s = summarizeAffilae({ partnerships, conversions, clicks: null })
    const indy = s.programs[0]
    expect(indy.conversions).toBe(3)
    expect(indy.commissionCents).toBe(16500)
    expect(indy.byStatus).toEqual({ en_attente: 1000, validee: 3500, refusee: 12000, payee: 0 })
    expect(s.recent[0].date).toBe('2026-10-03T10:00:00.000Z')
    expect(s.totals.clicks).toBeNull()
  })

  it('tolère une réponse vide ou inattendue', () => {
    expect(listData(null, 'x')).toEqual([])
    expect(listData({ data: [{ a: 1 }] }, 'x')).toEqual([{ a: 1 }])
    const s = summarizeAffilae({ partnerships: 'oops', conversions: undefined, clicks: {} })
    expect(s.programs).toEqual([])
  })

  it('reconnaît les statuts de conversion', () => {
    expect(conversionStatus('pending')).toBe('en_attente')
    expect(conversionStatus('validated')).toBe('validee')
    expect(conversionStatus('rejected')).toBe('refusee')
    expect(conversionStatus('paid')).toBe('payee')
  })
})
