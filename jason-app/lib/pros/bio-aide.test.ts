import { describe, it, expect } from 'vitest'
import { majusculesCriardes, adoucirMajuscules, bioReperes, apercuBio } from './bio-aide'

describe('coup de pouce de la présentation', () => {
  it('repère un début crié en majuscules, pas les sigles', () => {
    expect(majusculesCriardes('PHOTOGRAPHE IMMOBILIER et d’architecture à Paris')).toBe('PHOTOGRAPHE IMMOBILIER')
    expect(majusculesCriardes('Photographe LCD à Paris, TVA non applicable')).toBeNull()
    expect(majusculesCriardes('Spécialiste des PHOTOGRAPHIES')).toBe('PHOTOGRAPHIES')
    expect(majusculesCriardes('Bonjour, je suis Thierry.')).toBeNull()
  })
  it('remet en minuscules, majuscule gardée en début de phrase, sigles gardés', () => {
    expect(adoucirMajuscules('PHOTOGRAPHE IMMOBILIER et d’architecture. VISITE 3D en LCD.'))
      .toBe('Photographe immobilier et d’architecture. Visite 3D en LCD.')
    expect(adoucirMajuscules('Je photographie vos INTÉRIEURS.')).toBe('Je photographie vos intérieurs.')
    expect(adoucirMajuscules('Texte  normal\navec retour')).toBe('Texte  normal\navec retour')
  })
  it('liste ce que l’hôte aime y lire', () => {
    const r = bioReperes('Photographe immobilier à Lyon depuis 2015, je livre vos photos sous 48 h.', 'Lyon')
    expect(r.every(x => x.ok)).toBe(true)
    const r2 = bioReperes('Photos.', 'Lyon')
    expect(r2.filter(x => x.ok).map(x => x.key)).toEqual([])
  })
  it('ce qui s’affiche avant « Lire la suite »', () => {
    expect(apercuBio('Court.')).toEqual({ visible: 'Court.', coupe: false })
    const long = 'mot '.repeat(100)
    const a = apercuBio(long)
    expect(a.coupe).toBe(true)
    expect(a.visible.endsWith('…')).toBe(true)
    expect(a.visible.length).toBeLessThanOrEqual(261)
  })
})
