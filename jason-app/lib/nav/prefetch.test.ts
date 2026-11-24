import { describe, it, expect } from 'vitest'
import { isHeavyLayoutHref, prefetchFor } from './prefetch'

describe('liens vers une section au layout lourd', () => {
  it('Mes finances et ses onglets', () => {
    expect(isHeavyLayoutHref('/dashboard/finances')).toBe(true)
    expect(isHeavyLayoutHref('/dashboard/finances/revenus')).toBe(true)
    expect(isHeavyLayoutHref('/dashboard/finances/fiscalite#facture-electronique')).toBe(true)
    expect(prefetchFor('/dashboard/finances/journal')).toBe(false)
  })
  it('les autres pages restent préchargées', () => {
    expect(isHeavyLayoutHref('/dashboard/financement')).toBe(false)
    expect(isHeavyLayoutHref('/dashboard/reservations')).toBe(false)
    expect(prefetchFor('/dashboard/reservations')).toBeUndefined()
  })

  it("l'Accueil n'est jamais préchargé (calcul complet à chaque page)", () => {
    expect(prefetchFor('/dashboard')).toBe(false)
    expect(prefetchFor('/dashboard?x=1')).toBe(false)
    expect(prefetchFor('/dashboard/calendrier')).toBeUndefined()
  })
})
