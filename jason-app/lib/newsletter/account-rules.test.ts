import { describe, it, expect } from 'vitest'
import { newsletterState, newsletterNote } from './account-rules'

const base = { blacklisted: false, inList: false, optIn: false, paidPro: false }

describe('interrupteur de la lettre dans Mon compte', () => {
  it('une désinscription chez Brevo l’emporte sur tout le reste', () => {
    expect(newsletterState({ blacklisted: true, inList: true, optIn: true, paidPro: true })).toEqual({ subscribed: false, reason: 'desinscrit' })
  })

  it('inscrit par la liste, la case de l’inscription ou une fiche pro payée', () => {
    expect(newsletterState({ ...base, inList: true }).reason).toBe('inscrit')
    expect(newsletterState({ ...base, optIn: true }).reason).toBe('inscrit')
    expect(newsletterState({ ...base, paidPro: true })).toEqual({ subscribed: true, reason: 'client-pro' })
    expect(newsletterState(base)).toEqual({ subscribed: false, reason: 'pas-inscrit' })
  })

  it('dit quelle édition la personne reçoit', () => {
    expect(newsletterNote({ subscribed: true, reason: 'inscrit' }, 'photographe')).toContain('photographes')
    expect(newsletterNote({ subscribed: true, reason: 'client-pro' }, 'menage')).toContain('pros de l’annuaire')
    expect(newsletterNote({ subscribed: false, reason: 'desinscrit' }, 'hote')).toContain('désinscrit')
    for (const r of ['inscrit', 'client-pro', 'desinscrit', 'pas-inscrit'] as const) {
      expect(newsletterNote({ subscribed: r === 'inscrit' || r === 'client-pro', reason: r }, 'hote')).not.toMatch(/—/)
    }
  })
})
