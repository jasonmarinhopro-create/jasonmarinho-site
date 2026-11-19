import { describe, it, expect } from 'vitest'
import { computeActivation, part } from './activation-rules'

const now = new Date('2026-11-19T12:00:00Z')
const p = (id: string, o: Partial<{ role: string; plan: string; created_at: string; last_seen_at: string; stripe_onboarding_complete: boolean }> = {}) => ({
  id, role: o.role ?? 'user', plan: o.plan ?? 'decouverte', created_at: o.created_at ?? '2026-01-01T00:00:00Z',
  last_seen_at: o.last_seen_at ?? null, stripe_onboarding_complete: o.stripe_onboarding_complete ?? false,
})

describe('computeActivation', () => {
  it('exclut les admins et compte chaque étape une fois par membre', () => {
    const a = computeActivation({
      profiles: [p('admin', { role: 'admin' }), p('a', { plan: 'standard', stripe_onboarding_complete: true, last_seen_at: '2026-11-18T00:00:00Z' }), p('b', { plan: 'driing', created_at: '2026-11-10T00:00:00Z' }), p('c')],
      logementUsers: ['a', 'a', 'admin'],
      icalUsers: ['a'],
      contractUsers: ['a', 'a', 'b'],
      now,
    })
    expect(a.inscrits).toBe(3)
    expect(a.logement).toBe(1)
    expect(a.calendrier).toBe(1)
    expect(a.contrat).toBe(2)
    expect(a.stripe).toBe(1)
    expect(a.standard).toBe(1)
    expect(a.driing).toBe(1)
    expect(a.actifs7).toBe(1)
    expect(a.inscrits30).toBe(1)
    expect(a.sansLogement).toBe(2)
    expect(a.sansLogement30).toBe(1)
  })
  it('part en pourcentage', () => {
    expect(part(6, 63)).toBe(10)
    expect(part(1, 0)).toBe(0)
  })
})
