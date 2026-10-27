import { describe, it, expect } from 'vitest'
import { parseZone, composeZone, zonePhrase, distanceKm, zoneVerdict } from './zone'

describe('zone des pros', () => {
  it('lit le rayon et ce qui reste', () => {
    expect(parseZone('Paris + 30 kms', 'Paris')).toEqual({ km: 30, autre: '' })
    expect(parseZone('Lyon + 30 km, Villeurbanne, Rhône', 'Lyon')).toEqual({ km: 30, autre: 'Villeurbanne, Rhône' })
    expect(parseZone('Rhône', 'Lyon')).toEqual({ km: null, autre: 'Rhône' })
    expect(parseZone('rayon de 40 km autour', 'Nantes')).toEqual({ km: 40, autre: '' })
    expect(parseZone('', 'Lyon')).toEqual({ km: null, autre: '' })
    expect(parseZone('Saint-Étienne et 20 kilomètres', 'Saint-Etienne').km).toBe(20)
  })
  it('écrit la zone comme la lit la carte des fiches', () => {
    expect(composeZone('Paris', 30, '')).toBe('Paris + 30 km')
    expect(composeZone('Lyon', 30, 'Rhône')).toBe('Lyon + 30 km, Rhône')
    expect(composeZone('Lyon', null, 'Rhône')).toBe('Rhône')
    expect(composeZone('Lyon', null, '')).toBe('')
    expect(parseZone(composeZone('Lyon', 25, 'Ain'), 'Lyon')).toEqual({ km: 25, autre: 'Ain' })
  })
  it('phrase de la fiche', () => {
    expect(zonePhrase('Paris', 30, ['Versailles'], '')).toBe('Paris et 30 km autour, avec Versailles.')
    expect(zonePhrase('Lyon', null, ['Ain', 'Vienne'], 'Rhône')).toBe('Lyon, Rhône, avec Ain et Vienne.')
    expect(zonePhrase('', 30, [], '')).toBe('Indique ta ville principale.')
  })
  it('distance et réponse du test', () => {
    const paris = { lat: 48.8566, lon: 2.3522 }
    const versailles = { lat: 48.8049, lon: 2.1204 }
    const d = distanceKm(paris, versailles)
    expect(d).toBeGreaterThan(15)
    expect(d).toBeLessThan(20)
    expect(zoneVerdict(d, 30)).toBe('oui')
    expect(zoneVerdict(40, 30)).toBe('proche')
    expect(zoneVerdict(80, 30)).toBe('loin')
    expect(zoneVerdict(8, null)).toBe('oui')
  })
})
