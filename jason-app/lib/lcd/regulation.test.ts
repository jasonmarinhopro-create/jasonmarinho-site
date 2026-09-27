import { describe, it, expect } from 'vitest'
import { findRegulation, COUNTRY_NOTES } from './regulation'
import { allCityBenchmarks, SUPPORTED_COUNTRIES } from './market-benchmarks'

describe('réglementation par ville', () => {
  it('trouve les villes quel que soit l’accent ou la casse', () => {
    expect(findRegulation('barcelona', 'ES')?.niveau).toBe('bloquant')
    expect(findRegulation('MALAGA', 'ES')?.ville).toBe('Málaga')
    expect(findRegulation('Paris', 'FR')?.plafondRP).toBe(90)
  })

  it('ne confond pas deux pays', () => {
    expect(findRegulation('Paris', 'BE')).toBeNull()
  })

  it('renvoie null pour une ville sans règle locale confirmée', () => {
    expect(findRegulation('Dijon', 'FR')).toBeNull()
    expect(findRegulation(null, 'FR')).toBeNull()
  })

  it('chaque règle correspond à une ville de l’estimateur (sinon elle ne s’affiche jamais)', () => {
    const benches = allCityBenchmarks()
    const villesReglementees = ['Paris', 'Lyon', 'Bordeaux', 'Marseille', 'Nice', 'Montpellier', 'Barcelona', 'Palma', 'Málaga', 'Lisboa', 'Firenze', 'Amsterdam', 'Berlin', 'Wien']
    for (const v of villesReglementees) {
      const b = benches.find(x => x.ville === v)
      expect(b, `benchmark manquant pour ${v}`).toBeTruthy()
      expect(findRegulation(b!.ville, b!.pays), `règle introuvable pour ${v}`).not.toBeNull()
    }
  })

  it('a une note générique pour chaque pays de l’estimateur', () => {
    for (const c of SUPPORTED_COUNTRIES) expect(COUNTRY_NOTES[c.code], c.code).toBeTruthy()
  })

  it('n’utilise jamais de tiret cadratin (texte affiché aux utilisateurs)', () => {
    const all = JSON.stringify([
      ['Paris', 'FR'], ['Barcelona', 'ES'], ['Wien', 'AT'],
    ].map(([v, p]) => findRegulation(v, p))) + JSON.stringify(COUNTRY_NOTES)
    expect(all).not.toContain('—')
  })
})
