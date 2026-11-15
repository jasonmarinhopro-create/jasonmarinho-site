import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/service', () => ({ getServiceClient: () => ({}) }))

import { auditExpress, isGoogleMapsUrl, expressVerdict } from './express'
import type { PlaceDetails } from './places-api'

const complete: PlaceDetails = {
  id: 'ChIJexemple0000000000000000',
  displayName: { text: 'Gîte des Pins' },
  formattedAddress: '12 chemin des Pins, 40150 Hossegor',
  nationalPhoneNumber: '05 00 00 00 00',
  websiteUri: 'https://gite-des-pins.exemple.fr/reserver',
  types: ['cottage', 'lodging', 'point_of_interest'],
  primaryType: 'cottage',
  primaryTypeDisplayName: { text: 'Gîte' },
  rating: 4.9,
  userRatingCount: 132,
  photos: Array.from({ length: 10 }, (_, i) => ({ name: `p${i}`, widthPx: 1600, heightPx: 1000 })),
  regularOpeningHours: { weekdayDescriptions: ['lundi : ouvert 24 h/24'] },
  businessStatus: 'OPERATIONAL',
  addressComponents: [{ longText: 'Hossegor', types: ['locality'] }],
}

describe('audit express d’une fiche Google', () => {
  it('donne 100 à une fiche complète', () => {
    const r = auditExpress(complete)
    expect(r.score).toBe(100)
    expect(r.conseils).toHaveLength(0)
    expect(r.verdict).toBe('Fiche solide')
    expect(r.fiche).toMatchObject({ nom: 'Gîte des Pins', ville: 'Hossegor', categorie: 'Gîte', note: 4.9, avis: 132, photos: 10, telephone: true })
  })
  it('le barème fait 100 et les pertes expliquent l’écart', () => {
    const r = auditExpress({ id: 'x' })
    expect(r.sections.reduce((s, x) => s + x.max, 0)).toBe(100)
    expect(r.score + r.conseils.reduce((s, c) => s + c.perte, 0)).toBe(100)
  })
  it('fiche vide : note basse, sans planter', () => {
    const r = auditExpress({ id: 'x' })
    expect(r.score).toBeLessThan(20)
    expect(r.conseils[0].titre).toBe('Obtiens tes premiers avis Google')
  })
  it('lien vers une plateforme : conseil de réservation en direct, pas de point fort', () => {
    const r = auditExpress({ ...complete, websiteUri: 'https://www.airbnb.fr/rooms/123456' })
    expect(r.score).toBe(97)
    expect(r.conseils.find(c => c.section === 'identite')?.titre).toContain('réservation en direct')
    expect(r.forts.some(f => f.includes('ton propre site'))).toBe(false)
  })
  it('catégorie hors hébergement signalée', () => {
    const r = auditExpress({ ...complete, primaryType: 'real_estate_agency', primaryTypeDisplayName: { text: 'Agence immobilière' }, types: ['real_estate_agency', 'point_of_interest'] })
    expect(r.conseils.some(c => c.titre === 'Choisis une catégorie d’hébergement')).toBe(true)
  })
  it('note et nombre d’avis : paliers', () => {
    const r = auditExpress({ ...complete, rating: 4.3, userRatingCount: 12 })
    const avis = r.sections.find(s => s.id === 'avis')
    expect(avis?.score).toBe(10 + 9)
    expect(r.conseils.some(c => c.texte.includes('4,3 sur 5'))).toBe(true)
  })
  it('classe les priorités de la plus coûteuse à la moins coûteuse, sans tiret cadratin', () => {
    const r = auditExpress({ id: 'x', rating: 3.9, userRatingCount: 2, photos: [{ name: 'a', widthPx: 1, heightPx: 1 }], businessStatus: 'CLOSED_TEMPORARILY' })
    const pertes = r.conseils.map(c => c.perte)
    expect(pertes).toEqual([...pertes].sort((a, b) => b - a))
    expect(r.conseils.map(c => c.titre + c.texte).join(' ')).not.toMatch(/—/)
  })
  it('verdicts', () => {
    expect([expressVerdict(90), expressVerdict(70), expressVerdict(50), expressVerdict(10)]).toEqual(['Fiche solide', 'Bonne base, quelques réglages', 'Du potentiel à aller chercher', 'Fiche à retravailler'])
  })
})

describe('liens Google Maps acceptés', () => {
  it('accepte Google Maps et ses liens de partage', () => {
    for (const u of ['https://www.google.com/maps/place/Gite+des+Pins/@43.6,-1.4,17z', 'https://www.google.fr/maps/place/x', 'https://maps.google.com/?cid=123', 'https://maps.app.goo.gl/AbCdEf', 'https://share.google/AbCd', 'https://g.co/kgs/abc']) {
      expect(isGoogleMapsUrl(u)).toBe(true)
    }
  })
  it('refuse tout autre site', () => {
    for (const u of ['https://evil.test/maps/place/x', 'https://google.com.evil.test/maps', 'https://www.airbnb.fr/rooms/1', 'javascript:alert(1)', 'Gîte des Pins Hossegor', '']) {
      expect(isGoogleMapsUrl(u)).toBe(false)
    }
  })
})
