import { describe, it, expect } from 'vitest'
import { listItems, hasMore, rewardStatus, toIso, amountCents, summarizePartnerStack } from './partnerstack-parse'

describe('PartnerStack', () => {
  it('lit les listes et la pagination', () => {
    const json = { data: { items: [{ key: 'a' }, { key: 'b' }], has_more: true }, status: 200 }
    expect(listItems(json)).toHaveLength(2)
    expect(hasMore(json)).toBe(true)
    expect(listItems({ data: [{ key: 'a' }] })).toHaveLength(1)
    expect(listItems([{ key: 'a' }, 3])).toHaveLength(1)
    expect(listItems(null)).toEqual([])
    expect(hasMore({ data: { items: [] } })).toBe(false)
  })

  it('statuts, dates et montants', () => {
    expect(rewardStatus('paid')).toBe('payee')
    expect(rewardStatus('approved')).toBe('validee')
    expect(rewardStatus('declined')).toBe('refusee')
    expect(rewardStatus('pending')).toBe('en_attente')
    expect(rewardStatus(undefined)).toBe('en_attente')
    expect(toIso(1759708800000)).toBe('2025-10-06T00:00:00.000Z')
    expect(toIso(1759708800)).toBe('2025-10-06T00:00:00.000Z')
    expect(toIso('2026-10-06T10:00:00Z')).toBe('2026-10-06T10:00:00.000Z')
    expect(toIso('n importe quoi')).toBeNull()
    expect(amountCents(500)).toBe(500)
    expect(amountCents('100.00')).toBe(10000)
    expect(amountCents('500')).toBe(500)
    expect(amountCents(null)).toBe(0)
  })

  it('résume récompenses et clients sans garder de donnée personnelle', () => {
    const s = summarizePartnerStack({
      rewards: [
        { key: 'r1', amount: 500, currency: 'eur', status: 'approved', created_at: 1759708800000, description: 'Free signup', company: { name: 'Brevo' } },
        { key: 'r2', amount: 10000, currency: 'eur', status: 'pending', created_at: 1759795200000, description: 'contact@exemple.fr' },
        { key: 'r3', amount: 500, status: 'declined', created_at: 1759622400000 },
      ],
      customers: [{ key: 'c1', email: 'a@b.fr' }, { key: 'c2', email: 'c@d.fr', company: { name: 'Brevo' } }],
    })
    expect(s.currency).toBe('EUR')
    expect(s.programs).toHaveLength(1)
    const p = s.programs[0]
    expect(p).toMatchObject({ name: 'Brevo', rewards: 3, customers: 2, commissionCents: 10500 })
    expect(p.byStatus).toEqual({ en_attente: 10000, validee: 500, refusee: 500, payee: 0 })
    expect(s.recent[0]).toMatchObject({ commissionCents: 10000, status: 'en_attente', label: null })
    expect(s.recent[1].label).toBe('Free signup')
    expect(JSON.stringify(s)).not.toContain('@')
  })
})
