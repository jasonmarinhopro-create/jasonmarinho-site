import { describe, it, expect } from 'vitest'
import { launchTarget } from './launch'

describe('page d’arrivée après connexion', () => {
  it('va directement à la Vue d’ensemble quand le mode admin est actif', () => {
    expect(launchTarget('a=1; jm-admin-mode=1; jm-launch=1')).toBe('/dashboard/admin')
    expect(launchTarget('jm-admin-mode=1')).toBe('/dashboard/admin')
  })
  it('sinon l’accueil, avec les paramètres', () => {
    expect(launchTarget('')).toBe('/dashboard')
    expect(launchTarget('jm-admin-mode=; x=2', '?src=pwa')).toBe('/dashboard?src=pwa')
    expect(launchTarget('jm-admin-mode=10')).toBe('/dashboard')
  })
})
