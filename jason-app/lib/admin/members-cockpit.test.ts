import { describe, it, expect } from 'vitest'
import { buildMemberSpaces } from './members-cockpit'

const now = new Date('2026-11-16T12:00:00Z')
const p = (id: string, created_at: string, extra: Partial<{ plan: string; is_investor: boolean }> = {}) =>
  ({ id, full_name: `Nom ${id}`, email: `${id}@x.fr`, created_at, plan: extra.plan ?? 'decouverte', is_investor: extra.is_investor ?? false })

describe('buildMemberSpaces', () => {
  const profiles = [
    p('h1', '2026-11-10T10:00:00Z', { plan: 'standard' }),
    p('h2', '2026-06-01T10:00:00Z'),
    p('i1', '2026-11-02T10:00:00Z', { is_investor: true }),
    p('ph', '2026-10-01T10:00:00Z'),
    p('mx', '2025-12-15T10:00:00Z'),
  ]
  const pros = [
    { user_id: 'ph', kind: 'photographe' as const, paid: true, tier: 'fondateur' },
    { user_id: 'mx', kind: 'menage' as const, paid: false, tier: null },
    { user_id: 'mx', kind: 'depannage' as const, paid: true, tier: null },
    { user_id: null, kind: 'menage' as const, paid: true, tier: null },
  ]
  const r = buildMemberSpaces(profiles, pros, now)

  it('range chaque compte dans ses espaces', () => {
    expect(r.tous.count).toBe(5)
    expect(r.hote.count).toBe(2)
    expect(r.investisseur.count).toBe(1)
    expect(r.photographe.count).toBe(1)
    expect(r.menage.count).toBe(1)
    expect(r.depannage.count).toBe(1)
  })
  it('nouveaux ce mois-ci et courbe sur 12 mois', () => {
    expect(r.tous.newThisMonth).toBe(2)
    expect(r.tous.growth).toHaveLength(12)
    expect(r.tous.growth[0]).toEqual({ month: '2025-12', total: 1 })
    expect(r.tous.growth[11]).toEqual({ month: '2026-11', total: 5 })
  })
  it('répartition : formules des hôtes, fiches payées des pros', () => {
    expect(r.hote.split).toEqual([{ label: 'Découverte', count: 1 }, { label: 'Standard', count: 1 }, { label: 'Driing', count: 0 }])
    expect(r.menage.split).toEqual([{ label: 'Fiche payée', count: 0 }, { label: 'À payer', count: 1 }])
    expect(r.depannage.split[0]).toEqual({ label: 'Fiche payée', count: 1 })
  })
  it('derniers inscrits du plus récent au plus ancien, avec leurs fiches', () => {
    expect(r.tous.recent.map(x => x.id)).toEqual(['h1', 'i1', 'ph', 'h2', 'mx'])
    expect(r.menage.recent[0].pros.map(x => x.kind)).toEqual(['menage', 'depannage'])
  })
})
