import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

// Le moteur vit à la racine du site statique (/analyse-annonce-regles.js),
// chargé tel quel par la page /services/analyse-annonce-airbnb.
const require = createRequire(import.meta.url)
type Resultat = {
  score: number
  verdict: string
  partiel: boolean
  sections: Array<{ id: string; score: number; max: number }>
  conseils: Array<{ section: string; perte: number; titre: string; texte: string }>
  forts: string[]
}
const { analyser } = require('../../../analyse-annonce-regles.js') as { analyser: (a: Record<string, unknown>) => Resultat }

const complete = {
  complet: true,
  titre: 'Appartement vue mer, terrasse et parking',
  description: [
    'Vue mer depuis la terrasse de cet appartement refait en 2025, à 5 min à pied de la plage.',
    'Deux chambres avec lits 160 cm, un canapé dans le salon. Cuisine équipée : four, plaques, lave-vaisselle et cafetière.',
    'Le quartier est calme, avec commerces et restaurants à proximité. La gare est à 10 min en bus.',
    'Arrivée autonome avec boîte à clés. Idéal pour un couple, une famille avec enfants ou du télétravail.',
  ].join('\n\n'),
  photos: { total: 24, paysage: 22, legendes: 20, pieces: ['Salon', 'Chambre 1', 'Cuisine', 'Salle de bain', 'Extérieur'] },
  equipements: {
    presents: ['Wifi', 'Cuisine', 'Arrivée autonome', 'Lave-linge', 'Espace de travail dédié', 'Parking gratuit sur place', 'Chauffage', 'Télévision', 'Équipements de base', 'Détecteur de fumée'],
    absents: [],
  },
  note: 4.93,
  avis: 31,
  sousNotes: { proprete: 4.9, exactitude: 5, arrivee: 5, communication: 5, emplacement: 4.9, qualitePrix: 4.8 },
  superhote: true,
  coupDeCoeur: true,
  tauxReponse: 100,
}

describe('analyse d’une annonce Airbnb', () => {
  it('donne 100 à une annonce complète', () => {
    const r = analyser(complete)
    expect(r.score).toBe(100)
    expect(r.verdict).toBe('Annonce solide')
    expect(r.conseils).toHaveLength(0)
    expect(r.partiel).toBe(false)
  })

  it('le total des barèmes fait 100 quand la page est complète', () => {
    expect(analyser(complete).sections.reduce((s, x) => s + x.max, 0)).toBe(100)
  })

  it('ne plante pas sur une annonce vide', () => {
    const r = analyser({})
    expect(r.score).toBeLessThan(15)
    expect(r.verdict).toBe('Annonce à retravailler')
  })

  it('page allégée : ni photos ni équipements notés, note ramenée sur 100', () => {
    const r = analyser({ ...complete, complet: false })
    expect(r.partiel).toBe(true)
    expect(r.sections.map(s => s.id)).toEqual(['titre', 'description', 'confiance'])
    expect(r.score).toBe(100)
  })

  it('signale un titre de plus de 50 caractères', () => {
    const r = analyser({ ...complete, titre: 'Appartement vue mer avec grande terrasse, parking privé et climatisation' })
    expect(r.conseils.some(c => c.titre.includes('50 caractères'))).toBe(true)
  })

  it('signale les majuscules et les adjectifs vagues', () => {
    const r = analyser({ ...complete, titre: 'MAGNIFIQUE APPARTEMENT VUE MER !!!' })
    expect(r.conseils.some(c => c.titre.includes('majuscules'))).toBe(true)
    expect(r.conseils.some(c => c.titre.includes('adjectifs vagues'))).toBe(true)
  })

  it('compte les photos verticales et les légendes manquantes', () => {
    const r = analyser({ ...complete, photos: { total: 50, paysage: 8, legendes: 0, pieces: ['Salon', 'Chambre 1', 'Cuisine', 'Extérieur'] } })
    const paysage = r.conseils.find(c => c.titre.includes('paysage'))
    expect(paysage?.texte).toContain('42 de tes 50 photos')
    expect(r.conseils.some(c => c.titre === 'Ajoute une légende à tes photos')).toBe(true)
  })

  it('distingue un équipement non coché d’un équipement affiché comme absent', () => {
    const r = analyser({ ...complete, equipements: { presents: ['Wifi', 'Cuisine', 'Lave-linge', 'Télévision', 'Draps', 'Détecteur de fumée', 'Parking gratuit', 'Arrivée autonome'], absents: ['Climatisation', 'Chauffage'] } })
    const eq = r.conseils.filter(c => c.section === 'equipements')
    expect(eq.find(c => c.titre.startsWith('Équipements non cochés'))?.titre).toContain('espace de travail')
    expect(eq.find(c => c.titre.startsWith('Équipements affichés comme absents'))?.titre).toContain('climatisation ou chauffage')
  })

  it('nomme la sous-note la plus basse', () => {
    const r = analyser({ ...complete, note: 4.7, sousNotes: { ...complete.sousNotes, proprete: 4.4, arrivee: 4.6 } })
    expect(r.conseils.some(c => c.titre.includes('la propreté (4,4)'))).toBe(true)
  })

  it('sans avis : conseil dédié, pas de note inventée', () => {
    const r = analyser({ ...complete, note: null, avis: 0, superhote: false })
    expect(r.conseils.some(c => c.titre === 'Obtiens tes premiers avis')).toBe(true)
  })

  it('classe les conseils du plus coûteux au moins coûteux', () => {
    const r = analyser({ complet: true, titre: 'Studio', description: 'Petit studio.', photos: { total: 3, paysage: 0, legendes: 0, pieces: [] }, equipements: { presents: [], absents: [] } })
    const pertes = r.conseils.map(c => c.perte)
    expect(pertes).toEqual([...pertes].sort((a, b) => b - a))
  })

  it('n’écrit ni tiret cadratin ni promesse sur l’algorithme', () => {
    const r = analyser({ complet: true, titre: 'x', description: 'y', photos: { total: 1, paysage: 0, legendes: 0, pieces: [] }, equipements: { presents: [], absents: ['Wifi'] }, note: 4.2, avis: 2, tauxReponse: 60, superhote: false })
    const tout = r.conseils.map(c => c.titre + ' ' + c.texte).join(' ')
    expect(tout).not.toMatch(/—/)
    expect(tout.toLowerCase()).not.toContain('algorithme')
  })
})
