import { describe, it, expect } from 'vitest'
import { einvoicingVerdict, guessTvaFromMention, type EinvoicingAnswers } from './einvoicing'

const base: EinvoicingAnswers = { tva: 'exonere', services: [], clientsPros: false }
const TODAY = '2026-10-05'

describe('guessTvaFromMention', () => {
  it('reconnaît les mentions usuelles', () => {
    expect(guessTvaFromMention('TVA non applicable, article 261 D 4° du CGI')).toBe('exonere')
    expect(guessTvaFromMention('TVA non applicable, art. 293 B du CGI')).toBe('franchise')
    expect(guessTvaFromMention('TVA non applicable, art. L. 233-3 du CIBS')).toBe('franchise')
    expect(guessTvaFromMention('TVA 10 %')).toBe('collecte')
    expect(guessTvaFromMention('')).toBe('nsp')
    expect(guessTvaFromMention(null)).toBe('nsp')
  })
})

describe('einvoicingVerdict', () => {
  it('meublé sans services : rien ne change, seulement la réception', () => {
    const v = einvoicingVerdict(base, TODAY)
    expect(v.key).toBe('simple')
    expect(v.steps[0].when).toBe('Dès maintenant')
    expect(v.notes).toEqual([])
  })
  it('3 services sur 4 : concerné en 2027, même en franchise', () => {
    const v = einvoicingVerdict({ ...base, tva: 'franchise', services: ['petit_dejeuner', 'linge', 'accueil'] }, TODAY)
    expect(v.key).toBe('concerne')
    expect(v.title).toContain('1er septembre 2027')
    expect(v.text).toContain('para-hôtellerie')
  })
  it('TVA collectée sans services : concerné', () => {
    expect(einvoicingVerdict({ ...base, tva: 'collecte' }, TODAY).key).toBe('concerne')
  })
  it('services en double ne comptent qu\'une fois', () => {
    expect(einvoicingVerdict({ ...base, services: ['linge', 'linge', 'accueil'] }, TODAY).key).toBe('simple')
  })
  it('para-hôtellerie déclarée exonérée : alerte sur la mention de TVA', () => {
    const v = einvoicingVerdict({ ...base, services: ['petit_dejeuner', 'linge', 'accueil', 'menage_sejour'] }, TODAY)
    expect(v.notes[0]).toContain('plus exonérée')
  })
  it('2 services : prévient qu\'un de plus fait basculer', () => {
    const v = einvoicingVerdict({ ...base, services: ['linge', 'accueil'] }, TODAY)
    expect(v.key).toBe('simple')
    expect(v.notes.some(n => n.includes('un de plus'))).toBe(true)
  })
  it('franchise sans services : signale la mention probablement fausse', () => {
    const v = einvoicingVerdict({ ...base, tva: 'franchise' }, TODAY)
    expect(v.notes.some(n => n.includes('261 D 4°'))).toBe(true)
  })
  it('compte à rebours jusqu\'au 1er septembre 2027', () => {
    expect(einvoicingVerdict(base, '2027-08-31').daysLeft).toBe(1)
    expect(einvoicingVerdict(base, '2027-09-02').daysLeft).toBe(0)
    expect(einvoicingVerdict({ ...base, tva: 'collecte' }, '2027-09-02').title).toContain('depuis')
  })
  it('avant septembre 2026, la réception est datée', () => {
    expect(einvoicingVerdict(base, '2026-08-15').steps[0].when).toBe('Le 1er septembre 2026')
  })
  it('aucun tiret cadratin dans les textes', () => {
    const all = JSON.stringify([
      einvoicingVerdict(base, TODAY),
      einvoicingVerdict({ tva: 'franchise', services: ['linge', 'accueil'], clientsPros: true }, TODAY),
      einvoicingVerdict({ tva: 'exonere', services: ['petit_dejeuner', 'linge', 'accueil'], clientsPros: true }, TODAY),
    ])
    expect(all).not.toContain('—')
  })
})
