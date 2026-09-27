import { describe, it, expect } from 'vitest'
import { menagePhotosKeptUntil, menagePhotosExpired, menagePhotosCutoff } from './photo-retention'

describe('conservation des photos de ménage (90 jours)', () => {
  it('garde les photos 90 jours après le ménage', () => {
    expect(menagePhotosKeptUntil('2026-09-27')).toBe('2026-12-26')
  })
  it('expirées seulement après le dernier jour de conservation', () => {
    expect(menagePhotosExpired('2026-09-27', new Date('2026-12-26T12:00:00Z'))).toBe(false)
    expect(menagePhotosExpired('2026-09-27', new Date('2026-12-27T12:00:00Z'))).toBe(true)
  })
  it('purge les ménages antérieurs à aujourd\'hui − 90 jours', () => {
    const now = new Date('2026-12-27T07:00:00Z')
    expect(menagePhotosCutoff(now)).toBe('2026-09-28')
    // un ménage du 27/09 (< 28/09) est purgé le 27/12, cohérent avec menagePhotosExpired
    expect('2026-09-27' < menagePhotosCutoff(now)).toBe(true)
  })
})
