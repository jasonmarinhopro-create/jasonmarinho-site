import { describe, it, expect } from 'vitest'
import { checkSpec, captions, nextSlot } from '../../../scripts/social/spec.mjs'

const ok = {
  slug: 'taxe-de-sejour-3-erreurs',
  format: 'carrousel',
  slides: [
    { type: 'couverture', titre: 'Taxe de séjour : *3 erreurs*' },
    { type: 'point', titre: 'Oublier le registre', texte: 'Texte.' },
    { type: 'liste', titre: 'À faire', items: ['Un', 'Deux'] },
  ],
  legende: 'Trois erreurs que je vois souvent chez les hôtes qui débutent. Laquelle tu as déjà faite ?',
  hashtags: ['#airbnb', '#locationcourteduree'],
  lien: 'https://jasonmarinho.com/blog/taxe-de-sejour',
}

describe('fichier de publication des réseaux', () => {
  it('accepte un fichier correct', () => {
    expect(checkSpec(ok)).toEqual([])
  })
  it('refuse les écarts à la charte', () => {
    expect(checkSpec({ ...ok, legende: ok.legende + ' — fin' })).toContain('tiret cadratin interdit')
    expect(checkSpec({ ...ok, legende: ok.legende + ' 🔥' })).toContain('emoji interdit')
    expect(checkSpec({ ...ok, lien: 'https://exemple.com' })).toContain('le lien doit pointer vers jasonmarinho.com')
    expect(checkSpec({ ...ok, format: 'story' }).length).toBeGreaterThan(0)
    expect(checkSpec({ ...ok, slides: ok.slides.slice(1) })).toContain('la première diapositive doit être une couverture')
    expect(checkSpec({ ...ok, photo: 'img/absente.jpg' }, { exists: () => false })).toContain('photo introuvable dans img/')
  })
  it('story : accroche courte, ou désactivée', () => {
    expect(checkSpec({ ...ok, story: { texte: 'La 3e, *presque tout le monde* la fait' } })).toEqual([])
    expect(checkSpec({ ...ok, story: false })).toEqual([])
    expect(checkSpec({ ...ok, story: { texte: 'x'.repeat(91) } }).some(e => e.startsWith('story'))).toBe(true)
    expect(checkSpec({ ...ok, story: 'oui' }).some(e => e.startsWith('story'))).toBe(true)
  })
  it('légendes : lien suivi sur Facebook, lien en bio sur Instagram', () => {
    const c = captions(ok)
    expect(c.facebook).toContain('utm_source=facebook')
    expect(c.facebook).toContain('utm_campaign=taxe-de-sejour-3-erreurs')
    expect(c.instagram).not.toContain('https://')
    expect(c.instagram).toContain('lien est dans la bio')
    expect(c.instagram.endsWith('#airbnb #locationcourteduree')).toBe(true)
  })
  it('créneau : 17 h UTC, au moins 2 h d’avance, un post par jour', () => {
    expect(nextSlot(new Date('2026-10-24T08:00:00Z')).toISOString()).toBe('2026-10-24T17:00:00.000Z')
    expect(nextSlot(new Date('2026-10-24T15:30:00Z')).toISOString()).toBe('2026-10-25T17:00:00.000Z')
    expect(nextSlot(new Date('2026-10-24T08:00:00Z'), ['2026-10-24', '2026-10-25']).toISOString()).toBe('2026-10-26T17:00:00.000Z')
  })
})
