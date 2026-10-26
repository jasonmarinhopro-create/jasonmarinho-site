import { describe, it, expect } from 'vitest'
import { CHANGELOG, changelogFor, isFormationAnnouncement } from './changelog'

describe('changelogFor', () => {
  it('garde tout par défaut', () => {
    expect(changelogFor(false)).toBe(CHANGELOG)
    expect(changelogFor(undefined)).toBe(CHANGELOG)
  })
  it('retire seulement les annonces de formations pour un compte coché', () => {
    const hidden = changelogFor(true)
    expect(hidden.some(isFormationAnnouncement)).toBe(false)
    expect(hidden.length).toBe(CHANGELOG.filter(e => !isFormationAnnouncement(e)).length)
    expect(CHANGELOG.filter(isFormationAnnouncement).map(e => e.id)).toContain('formation-louer-en-direct-oct-2026')
  })
})
