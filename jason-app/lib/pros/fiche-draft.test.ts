import { describe, it, expect } from 'vitest'
import { changedSections, revertSections, readDraft, newerDraft, mergeDraftState, sameValue, pendingLabel, listeFr, type DraftSection } from './fiche-draft'

const sections: DraftSection[] = [
  { id: 'photos', paths: [], touched: 'photos' },
  { id: 'formules', paths: ['vitrine.formules', 'form.tarif_min'] },
  { id: 'presentation', paths: ['form.bio'] },
]
const base = { form: { bio: 'Bonjour', tarif_min: 230 as number | null }, vitrine: { formules: [{ nom: 'A', prix: '230', detail: '' }] } }

describe('brouillon de Ma fiche', () => {
  it('repère les parties modifiées, et seulement elles', () => {
    expect(changedSections(sections, base, base, {})).toEqual([])
    const cur = { ...base, form: { ...base.form, bio: 'Bonjour à tous' } }
    expect(changedSections(sections, cur, base, {})).toEqual(['presentation'])
    expect(changedSections(sections, base, base, { photos: true })).toEqual(['photos'])
  })
  it('espaces autour et chaîne vide ne comptent pas comme un changement', () => {
    expect(sameValue(' Bonjour ', 'Bonjour')).toBe(true)
    expect(sameValue('', null)).toBe(true)
    expect(sameValue({ b: 1, a: 2 }, { a: 2, b: 1 })).toBe(true)
    expect(sameValue([1, 2], [2, 1])).toBe(false)
  })
  it('Annuler remet la partie comme en ligne sans toucher au reste', () => {
    const cur = { form: { bio: 'Nouveau', tarif_min: 300 }, vitrine: { formules: [{ nom: 'B', prix: '300', detail: '' }] } }
    const back = revertSections(sections, ['formules'], cur, base)
    expect(back.vitrine.formules).toEqual(base.vitrine.formules)
    expect(back.form.tarif_min).toBe(230)
    expect(back.form.bio).toBe('Nouveau')
    expect(cur.form.tarif_min).toBe(300)
  })
  it('relit un brouillon valide, refuse le reste', () => {
    expect(readDraft(null)).toBeNull()
    expect(readDraft({ v: 2, savedAt: '2026-10-27T10:00:00Z', state: {} })).toBeNull()
    expect(readDraft({ v: 1, savedAt: 'hier', state: {} })).toBeNull()
    const d = readDraft({ v: 1, savedAt: '2026-10-27T10:00:00Z', state: { form: {} }, touched: { photos: true, x: 1 } })
    expect(d?.touched).toEqual({ photos: true, logo: false })
  })
  it('garde le brouillon le plus récent (base ou téléphone)', () => {
    const a = readDraft({ v: 1, savedAt: '2026-10-27T10:00:00Z', state: { n: 1 } })
    const b = readDraft({ v: 1, savedAt: '2026-10-27T10:05:00Z', state: { n: 2 } })
    expect(newerDraft(a, b)).toBe(b)
    expect(newerDraft(b, a)).toBe(b)
    expect(newerDraft(null, a)).toBe(a)
  })
  it('reprend le brouillon clé par clé, prix effacé compris, sans clé inconnue', () => {
    const merged = mergeDraftState(base, { form: { bio: 'Brouillon', tarif_min: null, pirate: 'x' } } as never)
    expect(merged.form.bio).toBe('Brouillon')
    expect(merged.form.tarif_min).toBeNull()
    expect('pirate' in merged.form).toBe(false)
    expect(merged.vitrine).toBe(base.vitrine)
    expect(mergeDraftState(base, { form: { bio: 42 } } as never).form.bio).toBe('Bonjour')
  })
  it('textes de la barre', () => {
    expect(pendingLabel(1)).toBe('1 modification')
    expect(pendingLabel(3)).toBe('3 modifications')
    expect(listeFr(['formules', 'zone', 'présentation'])).toBe('formules, zone et présentation')
    expect(listeFr(['zone'])).toBe('zone')
  })
})
