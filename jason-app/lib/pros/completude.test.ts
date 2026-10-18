import { describe, it, expect } from 'vitest'
import { completude, type CompletudeInput } from './completude'
import { DEFAULT_DEROULE } from './fiche-vitrine'

const P = '11111111-1111-4111-8111-111111111111'
const photo = (i: number) => `${P}/v2-1111111${i}-1111-4111-8111-111111111111.jpg`
const vide: CompletudeInput = { photos: [], bio: '', formules: [], prixMin: null, deroule: DEFAULT_DEROULE.photographe.map(e => ({ ...e })), villes: [], zone: 'Vendée', logo: false, options: 0 }

describe('jauge de complétude des fiches', () => {
  it('fiche vide : 0 %, les photos d’abord', () => {
    const r = completude(vide, 'photographe')
    expect(r.pct).toBe(0)
    expect(r.next?.key).toBe('photos')
    expect(r.points.reduce((n, p) => n + p.weight, 0)).toBe(100)
  })
  it('compte une fiche comme celles de l’annuaire (bio, prix, portfolio sans photo)', () => {
    const r = completude({ ...vide, bio: 'x'.repeat(120), prixMin: 150, zone: 'Roanne et 30km', options: 1 }, 'photographe')
    expect(r.pct).toBe(40)
    expect(r.next?.key).toBe('photos')
  })
  it('le déroulé par défaut ne compte pas, un déroulé écrit oui', () => {
    const d = DEFAULT_DEROULE.photographe.map(e => ({ ...e }))
    expect(completude({ ...vide, deroule: d }, 'photographe').points.find(p => p.key === 'deroule')?.done).toBe(false)
    d[1].texte = 'Je viens avec mon drone.'
    expect(completude({ ...vide, deroule: d }, 'photographe').points.find(p => p.key === 'deroule')?.done).toBe(true)
  })
  it('fiche complète : 100 %, plus rien à faire', () => {
    const d = DEFAULT_DEROULE.menage.map(e => ({ ...e, texte: e.texte + ' !' }))
    const r = completude({ photos: [photo(1), photo(2), photo(3)], bio: 'x'.repeat(90), formules: [{ nom: 'T2', prix: '95' }], prixMin: null, deroule: d, villes: ['Pessac'], zone: '', logo: true, prestations: 4, capacite: true }, 'menage')
    expect(r.pct).toBe(100)
    expect(r.next).toBeNull()
  })
  it('les anciennes photos ne comptent pas', () => {
    const r = completude({ ...vide, photos: [`${P}/ancienne.jpg`, photo(1)] }, 'photographe')
    expect(r.points[0].hint).toContain('Encore 2 photos')
  })
})
