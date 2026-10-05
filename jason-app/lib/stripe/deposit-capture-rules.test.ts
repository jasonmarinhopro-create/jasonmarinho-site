import { describe, it, expect } from 'vitest'
import { parseRetenue } from './deposit-capture-rules'

describe('retenue sur une caution', () => {
  it('motif obligatoire (envoyé au voyageur)', () => {
    expect(parseRetenue({ amount: 80, motif: '', caution: 300 }).ok).toBe(false)
    expect(parseRetenue({ amount: 80, motif: '  a ', caution: 300 }).ok).toBe(false)
  })
  it('retenue partielle : le reste est libéré', () => {
    const r = parseRetenue({ amount: 80, motif: 'Verre cassé', caution: 300 })
    expect(r).toEqual({ ok: true, kept: 80, keptCents: 8000, partial: true, reason: 'Verre cassé' })
  })
  it('accepte la virgule française et arrondit au centime', () => {
    const r = parseRetenue({ amount: '80,456', motif: 'Ménage non fait', caution: 300 })
    expect(r.ok && r.kept).toBe(80.46)
  })
  it('sans montant : toute la caution, pas partielle', () => {
    const r = parseRetenue({ amount: '', motif: 'Dégâts importants', caution: 300 })
    expect(r.ok && r.partial).toBe(false)
    expect(r.ok && r.keptCents).toBe(30000)
  })
  it('jamais plus que la caution, jamais 0 ni négatif', () => {
    expect(parseRetenue({ amount: 300.01, motif: 'Trop', caution: 300 }).ok).toBe(false)
    expect(parseRetenue({ amount: 0, motif: 'Rien', caution: 300 }).ok).toBe(false)
    expect(parseRetenue({ amount: -5, motif: 'Négatif', caution: 300 }).ok).toBe(false)
    expect(parseRetenue({ amount: 'abc', motif: 'Texte', caution: 300 }).ok).toBe(false)
    expect(parseRetenue({ amount: 300, motif: 'Tout', caution: 300 }).ok).toBe(true)
  })
  it('motif ramené à 300 caractères', () => {
    const r = parseRetenue({ amount: 10, motif: 'x'.repeat(500), caution: 300 })
    expect(r.ok && r.reason.length).toBe(300)
  })
})
