import { describe, it, expect } from 'vitest'
import { diagnostiquer, etatDepuisReponse, etatDeLaBase, type EtatSonde } from './diagnostic'

describe('page d’erreur : diagnostic', () => {
  it('classe la mesure de la base', () => {
    expect(etatDeLaBase({ status: 200, ms: 180 })).toBe('ok')
    expect(etatDeLaBase({ status: 200, ms: 4200 })).toBe('lente')
    expect(etatDeLaBase({ status: 522, ms: 300 })).toBe('muette')
    expect(etatDeLaBase({ status: 0, ms: 4000 })).toBe('muette')
    expect(etatDeLaBase(null)).toBe('muette')
    // Un refus d'accès prouve que la base répond
    expect(etatDeLaBase({ status: 401, ms: 90 })).toBe('ok')
  })
  it('lit la réponse de la sonde, et rien d’autre', () => {
    expect(etatDepuisReponse({ base: 'muette', ms: 4000 })).toBe('muette')
    expect(etatDepuisReponse({ base: 'lente' })).toBe('lente')
    expect(etatDepuisReponse({ base: 'ok' })).toBe('ok')
    for (const x of [null, 'ok', {}, { base: 'cassée' }, { base: 1 }]) expect(etatDepuisReponse(x)).toBe('inconnu')
  })
  it('base muette ou lente : rassure et relance seule', () => {
    for (const e of ['muette', 'lente'] as const) {
      const d = diagnostiquer(e)
      expect(d.ton).toBe('rassurant')
      expect(d.relanceAuto).toBe(true)
      expect(d.texte).toContain('tes données sont intactes')
    }
    expect(diagnostiquer('muette').base.etat).toBe('ko')
  })
  it('base en forme : raté isolé, pas de relance automatique', () => {
    const d = diagnostiquer('ok')
    expect(d).toMatchObject({ ton: 'neutre', relanceAuto: false, base: { etat: 'ok' } })
  })
  it('chaque état a un titre et un texte, sans tiret cadratin ni jargon', () => {
    for (const e of ['cherche', 'ok', 'lente', 'muette', 'hors-ligne', 'inconnu'] as EtatSonde[]) {
      const d = diagnostiquer(e)
      expect(d.titre.length).toBeGreaterThan(8)
      expect(d.texte.length).toBeGreaterThan(40)
      expect(d.titre + d.texte).not.toMatch(/—|serveur a renvoyé|timeout|500|Supabase/i)
    }
  })
})
