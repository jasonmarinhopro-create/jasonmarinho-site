import { describe, it, expect } from 'vitest'
import { zoneSummary, prixDes } from './atelier-resumes'

describe('résumés de l’atelier', () => {
  it('zone : ville, rayon lu dans la zone, villes en plus', () => {
    expect(zoneSummary('Paris', 'Paris + 30 kms', 4)).toBe('Paris + 30 km, 4 villes en plus')
    expect(zoneSummary('Lyon', 'Rhône', 0)).toBe('Lyon')
    expect(zoneSummary('Lyon', '', 1)).toBe('Lyon, 1 ville en plus')
    expect(zoneSummary('', '', 0)).toBe('À renseigner')
  })
  it('prix dès : formule la moins chère, sinon tarif minimum', () => {
    expect(prixDes([{ prix: '460' }, { prix: '230' }, { prix: '' }], 300)).toBe(230)
    expect(prixDes([{ prix: '' }], 150)).toBe(150)
    expect(prixDes([{ prix: '12,5' }], null)).toBe(12.5)
    expect(prixDes([], null)).toBeNull()
    expect(prixDes([], 0)).toBeNull()
  })
})
