import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { GUIDE_FICHES, PAGE_GUIDE, guideHref } from './fiches'

const cards = readFileSync(join(__dirname, '..', '..', 'app/dashboard/guide/GuideCards.tsx'), 'utf8')

describe('liens vers le Guide LCD', () => {
  it.each(Object.keys(GUIDE_FICHES))('la fiche %s existe dans le guide', id => {
    expect(cards).toContain(`id: '${id}'`)
  })
  it('chaque page propose 1 à 3 fiches connues', () => {
    for (const ids of Object.values(PAGE_GUIDE)) {
      expect(ids.length).toBeGreaterThan(0)
      expect(ids.length).toBeLessThanOrEqual(3)
      ids.forEach(id => expect(GUIDE_FICHES[id]).toBeTruthy())
    }
  })
  it('construit l’ancre', () => {
    expect(guideHref('commun-taxe-sejour')).toBe('/dashboard/apprendre/guide#commun-taxe-sejour')
  })
})
