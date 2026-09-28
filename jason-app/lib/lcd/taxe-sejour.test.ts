import { describe, expect, it } from 'vitest'
import { computeTaxeSejour, type TaxeSejourInput } from './taxe-sejour'

const base: TaxeSejourInput = {
  categorie: 'nc', tarifCommune: 0, taux: 0.05, plafondCommune: 4.9, prixNuit: 120,
  adultes: 2, mineurs: 0, nuits: 3, departementale: true, ileDeFrance: false,
}

describe('computeTaxeSejour', () => {
  it('non classé : 5 % du prix par personne, fois adultes et nuits, + 10 % départemental', () => {
    const r = computeTaxeSejour(base)
    expect(r.tarifParNuit).toBe(3) // 120 / 2 × 5 %
    expect(r.communale).toBe(18)
    expect(r.departementale).toBe(1.8)
    expect(r.total).toBe(19.8)
  })

  it('non classé : les mineurs divisent le prix mais ne paient pas', () => {
    const r = computeTaxeSejour({ ...base, mineurs: 2 })
    expect(r.tarifParNuit).toBe(1.5) // 120 / 4 × 5 %
    expect(r.communale).toBe(9) // 2 adultes seulement
  })

  it('non classé : plafonné au tarif le plus élevé voté par la commune', () => {
    const r = computeTaxeSejour({ ...base, prixNuit: 400, plafondCommune: 2.6 })
    expect(r.tarifParNuit).toBe(2.6)
    expect(r.plafonne).toBe(true)
  })

  it('Paris 2026 : plafond non classé de 15,93 € par personne et par nuit (4,90 × 3,25)', () => {
    const r = computeTaxeSejour({ ...base, prixNuit: 1000, adultes: 1, nuits: 1, ileDeFrance: true })
    expect(r.totalParNuit).toBe(15.93)
    expect(r.mobilites).toBe(9.8)
  })

  it('classé : tarif communal borné par le plafond national de la catégorie', () => {
    const r = computeTaxeSejour({ ...base, categorie: 'e3', tarifCommune: 2.5, departementale: false })
    expect(r.tarifParNuit).toBe(1.7)
    expect(r.plafonne).toBe(true)
    expect(r.total).toBe(10.2) // 1,70 × 2 × 3
  })
})
