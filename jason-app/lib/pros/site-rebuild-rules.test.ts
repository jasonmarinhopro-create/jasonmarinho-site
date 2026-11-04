import { describe, it, expect } from 'vitest'
import { rebuildDecision } from './site-rebuild-rules'

const now = Date.parse('2026-11-04T12:00:00Z')
describe('regroupement des reconstructions', () => {
  it('reconstruit tout de suite si rien n’est parti depuis 4 minutes', () => {
    expect(rebuildDecision({ requested_at: null, triggered_at: null }, now, 'request')).toBe('now')
    expect(rebuildDecision({ requested_at: null, triggered_at: '2026-11-04T11:55:00Z' }, now, 'request')).toBe('now')
  })
  it('met en attente si une reconstruction vient de partir', () => {
    expect(rebuildDecision({ requested_at: null, triggered_at: '2026-11-04T11:58:30Z' }, now, 'request')).toBe('queue')
  })
  it('le passage suivant envoie l’attente, seulement une fois le délai passé', () => {
    expect(rebuildDecision({ requested_at: '2026-11-04T11:58:40Z', triggered_at: '2026-11-04T11:58:30Z' }, now, 'flush')).toBe('queue')
    expect(rebuildDecision({ requested_at: '2026-11-04T11:58:40Z', triggered_at: '2026-11-04T11:50:00Z' }, now, 'flush')).toBe('now')
    expect(rebuildDecision({ requested_at: null, triggered_at: '2026-11-04T11:50:00Z' }, now, 'flush')).toBe('none')
  })
})
