import { describe, it, expect } from 'vitest'
import { buildMemberActivity, sinceLabel, activityLevel } from './activity'

describe('activité des membres', () => {
  it('garde la visite la plus récente et la dernière action', () => {
    const map = buildMemberActivity({
      rows: [
        { userId: 'a', at: '2026-10-01T10:00:00Z', kind: 'logement' },
        { userId: 'a', at: '2026-10-05T10:00:00Z', kind: 'contrat' },
        { userId: 'b', at: '2026-09-01T10:00:00Z', kind: 'question' },
      ],
      seen: new Map([['a', '2026-10-03T10:00:00Z'], ['c', null]]),
      signIns: new Map([['a', '2026-09-20T10:00:00Z'], ['b', '2026-09-10T10:00:00Z']]),
    })
    expect(map.get('a')).toEqual({ lastSeenAt: '2026-10-05T10:00:00Z', lastAction: { at: '2026-10-05T10:00:00Z', kind: 'contrat', label: 'A créé un contrat' } })
    expect(map.get('b')?.lastSeenAt).toBe('2026-09-10T10:00:00Z')
    expect(map.get('b')?.lastAction?.label).toBe('A posé une question')
    expect(map.get('c')).toEqual({ lastSeenAt: null, lastAction: null })
  })

  it('dit depuis quand, en jours de Paris', () => {
    const now = new Date('2026-10-11T10:00:00Z')
    expect(sinceLabel(null, now)).toBe('Jamais')
    expect(sinceLabel('2026-10-11T05:00:00Z', now)).toBe('Aujourd’hui')
    expect(sinceLabel('2026-10-10T21:30:00Z', now)).toBe('Hier')
    expect(sinceLabel('2026-10-01T10:00:00Z', now)).toBe('Il y a 10 jours')
    expect(sinceLabel('2026-06-11T10:00:00Z', now)).toBe('Il y a 4 mois')
    expect(sinceLabel('2024-10-11T10:00:00Z', now)).toBe('Il y a 2 ans')
  })

  it('range les membres par fraîcheur', () => {
    const now = new Date('2026-10-11T10:00:00Z')
    expect(activityLevel('2026-10-08T10:00:00Z', now)).toBe('actif')
    expect(activityLevel('2026-09-20T10:00:00Z', now)).toBe('tiede')
    expect(activityLevel('2026-06-01T10:00:00Z', now)).toBe('endormi')
    expect(activityLevel(null, now)).toBe('endormi')
  })
})
