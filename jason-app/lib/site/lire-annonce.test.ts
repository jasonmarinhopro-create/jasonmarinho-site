import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

// Lecture de la page publique d'une annonce Airbnb (fonction du site
// /api/analyse-annonce). La page d'essai ci-dessous est fictive et reprend la
// forme relevée le 15/11/2026.
const require = createRequire(import.meta.url)
const { idAnnonce, extraireAnnonce } = require('../../../scripts/api-analyse/lire-annonce.cjs') as {
  idAnnonce: (lien: unknown) => string | null
  extraireAnnonce: (html: string) => {
    titre: string; description: string; note: number | null; avis: number | null
    photos: { total: number; paysage: number; legendes: number; pieces: string[] }
    equipements: { presents: string[]; absents: string[] }
    sousNotes: Record<string, number | null>
    superhote: boolean | null; coupDeCoeur: boolean | null; tauxReponse: number | null; capacite: number | null
    lisible: boolean; complet: boolean
  }
}

const ld = {
  '@context': 'https://schema.org', '@type': 'VacationRental', name: 'Studio vue lac, balcon',
  description: 'Un studio calme.\n\nÀ 5 min du lac.', image: ['a.jpeg', 'b.jpeg'],
  aggregateRating: { '@type': 'AggregateRating', ratingValue: 4.85, ratingCount: '12' },
}
const image = (id: string, orientation: string, label: string, caption: string | null) => ({
  __typename: 'Image', id, orientation, accessibilityLabel: label, baseUrl: 'https://exemple.test/' + id + '.jpeg', imageMetadata: { caption },
})
const etat = {
  root: [[0, { data: { node: { pdpPresentation: {
    amenities: { seeAllAmenitiesGroups: [
      { title: 'Internet', amenities: [{ available: true, title: 'Wifi' }, { available: true, title: 'Espace de travail dédié' }] },
      { title: 'Non inclus', amenities: [{ available: false, title: 'Climatisation' }] },
    ] },
    hostInfo: { responseRateText: 'Taux de réponse : 95 %', passportData: { isSuperhost: true } },
  } },
  presentation: {
    photos: [
      image('1', 'LANDSCAPE', 'Salon image 1', 'Le salon'),
      image('2', 'PORTRAIT', 'Salon image 2', null),
      image('3', 'LANDSCAPE', 'Chambre 1 image 1', null),
      image('3', 'LANDSCAPE', 'Chambre 1 image 1', null),
      image('4', 'LANDSCAPE', 'Photos supplémentaires image 1', null),
      { __typename: 'Image', id: '9', orientation: null, baseUrl: 'https://exemple.test/illustration.png', accessibilityLabel: 'Illustration' },
    ],
    logging: { accuracyRating: 4.9, checkinRating: 5, cleanlinessRating: 4.6, communicationRating: 5, locationRating: 4.8, valueRating: 4.7, personCapacity: 2, isSuperhost: true },
    contexte: { isGuestFavorite: 'false' },
  } } }]],
}
const page = (avecEtat: boolean) => '<html><head><meta property="og:description" content="Studio vue lac, balcon">'
  + '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>'
  + (avecEtat ? '<script id="data-injector-instances" type="application/json">' + JSON.stringify(etat) + '</script>' : '')
  + '</head><body></body></html>'

describe('lien d’une annonce Airbnb', () => {
  it('accepte les liens d’annonce, avec ou sans paramètres', () => {
    expect(idAnnonce('https://www.airbnb.fr/rooms/1495606164171440082?adults=1&s=67')).toBe('1495606164171440082')
    expect(idAnnonce(' https://airbnb.com/rooms/12345678 ')).toBe('12345678')
    expect(idAnnonce('https://www.airbnb.co.uk/rooms/plus/12345678')).toBe('12345678')
  })
  it('refuse tout le reste', () => {
    for (const l of ['https://evil.com/rooms/123456', 'https://airbnb.fr.evil.com/rooms/123456', 'https://abnb.me/xyz', 'https://www.airbnb.fr/s/Annecy', 'javascript:alert(1)', '', null, 'https://www.airbnb.fr/rooms/abc']) {
      expect(idAnnonce(l)).toBeNull()
    }
  })
})

describe('lecture de la page d’une annonce', () => {
  it('lit le titre, la description, la note et les avis', () => {
    const a = extraireAnnonce(page(true))
    expect(a.titre).toBe('Studio vue lac, balcon')
    expect(a.description).toContain('À 5 min du lac')
    expect(a.note).toBe(4.85)
    expect(a.avis).toBe(12)
    expect(a.lisible).toBe(true)
    expect(a.complet).toBe(true)
  })
  it('compte chaque photo une fois, avec orientation, légende et pièce', () => {
    const a = extraireAnnonce(page(true))
    expect({ ...a.photos, pieces: [...a.photos.pieces].sort() }).toEqual({ total: 4, paysage: 3, legendes: 1, pieces: ['Chambre 1', 'Salon'] })
  })
  it('sépare les équipements présents et absents', () => {
    const a = extraireAnnonce(page(true))
    expect(a.equipements).toEqual({ presents: ['Wifi', 'Espace de travail dédié'], absents: ['Climatisation'] })
  })
  it('lit les sous-notes, le taux de réponse et les statuts', () => {
    const a = extraireAnnonce(page(true))
    expect(a.sousNotes.proprete).toBe(4.6)
    expect(a.tauxReponse).toBe(95)
    expect(a.superhote).toBe(true)
    expect(a.coupDeCoeur).toBe(false)
    expect(a.capacite).toBe(2)
  })
  it('page allégée : lisible mais incomplète, photos comptées dans les données structurées', () => {
    const a = extraireAnnonce(page(false))
    expect(a.lisible).toBe(true)
    expect(a.complet).toBe(false)
    expect(a.photos.total).toBe(2)
    expect(a.equipements.presents).toEqual([])
  })
  it('page vide ou cassée : illisible, sans planter', () => {
    expect(extraireAnnonce('').lisible).toBe(false)
    expect(extraireAnnonce('<script type="application/ld+json">{cassé</script>').lisible).toBe(false)
  })
})
