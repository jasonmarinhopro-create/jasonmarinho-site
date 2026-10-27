import { describe, it, expect } from 'vitest'
import { storyFrameHtml, slideHtml, normalizeSlides, assertNoBlank, SIZES } from '../../../scripts/social/templates.mjs'

// 27/10/2026 : les stories du jour affichaient « undefined » à la place du
// numéro des écrans « point ». Chaque type d'écran, avec ses seuls champs
// obligatoires, doit donner un visuel sans undefined / null / NaN.
const minimal = [
  { type: 'couverture', titre: 'Titre' },
  { type: 'point', titre: 'Point' },
  { type: 'liste', titre: 'Liste', items: ['Un'] },
  { type: 'chiffre', valeur: '12 %', label: 'Label' },
  { type: 'astuce', texte: 'Texte' },
  { type: 'question', titre: 'Question ?' },
  { type: 'fin' },
]

describe('visuels des réseaux sociaux', () => {
  it('stories : les écrans « point » sont numérotés', () => {
    const frames = [{ type: 'point', titre: 'A' }, { type: 'astuce', texte: 'B' }, { type: 'point', titre: 'C' }]
    expect(storyFrameHtml({ format: 'stories' }, frames, 0)).toContain('>01<small>')
    expect(storyFrameHtml({ format: 'stories' }, frames, 2)).toContain('>02<small>')
  })
  it('aucun type d’écran ne laisse passer undefined, en story comme en carrousel', () => {
    for (let i = 0; i < minimal.length; i++) {
      expect(() => assertNoBlank(storyFrameHtml({ format: 'stories' }, minimal, i))).not.toThrow()
    }
    const spec = { format: 'carrousel', slides: minimal }
    const slides = normalizeSlides(spec)
    for (let i = 0; i < slides.length; i++) expect(() => assertNoBlank(slideHtml(spec, slides, i, SIZES.feed))).not.toThrow()
  })
  it('le garde-fou refuse un visuel avec undefined', () => {
    expect(() => assertNoBlank('<style>.a{}</style><h2>undefined</h2>')).toThrow(/undefined/)
    expect(() => assertNoBlank('<p>Taxe de séjour</p>')).not.toThrow()
  })
})
