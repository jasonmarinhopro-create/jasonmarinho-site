import { describe, it, expect } from 'vitest'
import { zoneSummary, prixDes, tarifsDepuisFormules } from './atelier-resumes'

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
  it('fourchette tirée des formules, sinon celle saisie', () => {
    expect(tarifsDepuisFormules([{ prix: '230' }, { prix: '920' }, { prix: '460' }], 100, 2000)).toEqual({ min: 230, max: 920, auto: true })
    expect(tarifsDepuisFormules([{ prix: '45' }], 30, 90)).toEqual({ min: 45, max: null, auto: true })
    expect(tarifsDepuisFormules([{ prix: '' }], 30, 90)).toEqual({ min: 30, max: 90, auto: false })
    expect(tarifsDepuisFormules([{ prix: '99,6' }, { prix: 99.6 }], null, null)).toEqual({ min: 100, max: null, auto: true })
  })
})
