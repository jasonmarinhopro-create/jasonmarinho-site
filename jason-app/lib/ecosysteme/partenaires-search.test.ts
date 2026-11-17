import { describe, it, expect } from 'vitest'
import { searchPartners, PARTNERS } from './partenaires'

describe('searchPartners', () => {
  const noms = (q: string) => searchPartners(PARTNERS, q).map(p => p.nom)
  it('trouve par nom, sans accents ni majuscules', () => {
    expect(noms('airdna')).toEqual(['AirDNA'])
    expect(noms('ORANGE')).toContain('Orange Travel')
  })
  it('trouve par mot courant de la catégorie', () => {
    expect(noms('comptable')).toEqual(expect.arrayContaining(['Indy', 'Keobiz', 'JD2M']))
    expect(noms('serrure connectée')).toEqual(expect.arrayContaining(['Nuki', 'Igloohome']))
    expect(noms('esim')).toContain('Orange Travel')
  })
  it('tous les mots doivent correspondre', () => {
    expect(noms('comptable serrure')).toEqual([])
  })
  it('recherche vide : tout', () => {
    expect(searchPartners(PARTNERS, ' ').length).toBe(PARTNERS.length)
  })
})
