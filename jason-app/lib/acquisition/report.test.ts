import { describe, it, expect } from 'vitest'
import { buildProvenance, type MemberRow, type LinkRow } from './report'

const now = new Date('2026-10-10T12:00:00Z')
const member = (o: Partial<MemberRow>): MemberRow => ({ id: 'm', name: 'Nom', created_at: '2026-10-05T10:00:00Z', acquisition: null, spaces: ['hote'], ...o })
const link: LinkRow = { id: 'l1', code: 'groupe-hotes-k3f9', label: 'Groupe Hôtes', channel: 'facebook_groupe', destination: 'https://jasonmarinho.com/annuaires/photographes', archived: false, created_at: '2026-10-01T10:00:00Z' }

describe('rapport de provenance', () => {
  it('compte les inscriptions par provenance et par espace, sans compter les anciennes', () => {
    const r = buildProvenance({
      now, periodDays: 30,
      links: [link],
      members: [
        member({ id: 'a', acquisition: { source: 'facebook', medium: 'groupe', campaign: 'groupe-hotes-k3f9' }, spaces: ['photographe'] }),
        member({ id: 'b', acquisition: { ref: 'www.google.fr' } }),
        member({ id: 'c', acquisition: { ref: 'www.google.com' }, created_at: '2026-10-09T10:00:00Z' }),
        member({ id: 'd' }),
        member({ id: 'e', acquisition: { ref: 'www.google.fr' }, created_at: '2026-08-01T10:00:00Z' }),
      ],
      clicks: [
        { code: 'groupe-hotes-k3f9', created_at: '2026-10-06T10:00:00Z' },
        { code: 'groupe-hotes-k3f9', created_at: '2026-10-07T10:00:00Z' },
        { code: 'groupe-hotes-k3f9', created_at: '2026-08-07T10:00:00Z' },
        { code: 'autre', created_at: '2026-10-07T10:00:00Z' },
      ],
      visits: [
        { session_id: 's1', utm_campaign: 'groupe-hotes-k3f9' },
        { session_id: 's1', utm_campaign: 'groupe-hotes-k3f9' },
        { session_id: 's2', utm_campaign: 'groupe-hotes-k3f9' },
        { session_id: 's3', utm_campaign: null },
      ],
    })
    expect(r.signups).toBe(4)
    expect(r.measured).toBe(3)
    expect(r.byKind).toEqual([
      { kind: 'google', label: 'Google', count: 2, pct: 67 },
      { kind: 'lien', label: 'Lien suivi', count: 1, pct: 33 },
    ])
    expect(r.bySpace).toEqual([
      { space: 'hote', label: 'Hôte', count: 3, measured: 2 },
      { space: 'photographe', label: 'Photographe', count: 1, measured: 1 },
    ])
    expect(r.recent[0].id).toBe('c')
    expect(r.measuredSince).toBe('2026-08-01T10:00:00Z')
    const l = r.links[0]
    expect(l).toMatchObject({ clicks: 2, clicksTotal: 3, visitors: 2, lastClick: '2026-10-07T10:00:00Z', channelLabel: 'Groupe Facebook', url: 'https://jasonmarinho.com/l/groupe-hotes-k3f9' })
    expect(l.signups.map(s => s.id)).toEqual(['a'])
    expect(l.target).toContain('utm_campaign=groupe-hotes-k3f9')
  })
})
