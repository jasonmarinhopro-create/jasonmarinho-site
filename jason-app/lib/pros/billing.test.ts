import { describe, it, expect } from 'vitest'
import {
  computeTotals, cleanLines, lineAmount, displayStatus, legalMentions, vatMention,
  sellerDisplayName, missingProfileFields, missingDocFields, yearStats, recentLines, addDays,
  EMPTY_PROFILE, type DocLine,
} from './billing'

const L = (label: string, qty: number, unit_price: number): DocLine => ({ label, qty, unit: 'forfait', unit_price })

describe('montants', () => {
  it('calcule les lignes au centime', () => {
    expect(lineAmount({ qty: 3, unit_price: 19.99 })).toBe(59.97)
    expect(lineAmount({ qty: 0.5, unit_price: 45 })).toBe(22.5)
  })
  it('sans TVA en franchise', () => {
    expect(computeTotals([L('a', 1, 250), L('b', 2, 10)], 'franchise', 20)).toEqual({ total_ht: 270, total_tva: 0, total_ttc: 270 })
  })
  it('avec TVA', () => {
    expect(computeTotals([L('a', 1, 99.99)], 'tva', 20)).toEqual({ total_ht: 99.99, total_tva: 20, total_ttc: 119.99 })
  })
  it('accepte une remise en ligne négative', () => {
    expect(computeTotals([L('a', 1, 300), L('Remise', 1, -30)], 'franchise', 0).total_ttc).toBe(270)
  })
  it('retire les lignes vides et corrige les unités inconnues', () => {
    const out = cleanLines([L('', 1, 0), { label: ' Ménage ', qty: 1, unit: 'bidule', unit_price: 60 }])
    expect(out).toEqual([{ label: 'Ménage', detail: null, qty: 1, unit: 'forfait', unit_price: 60 }])
  })
})

describe('statut affiché', () => {
  const today = '2026-10-04'
  it('devis expiré après sa date de validité', () => {
    expect(displayStatus({ status: 'envoye', valid_until: '2026-10-03' }, today)).toBe('expire')
    expect(displayStatus({ status: 'envoye', valid_until: '2026-10-04' }, today)).toBe('en_attente')
  })
  it('brouillon, accepté, refusé', () => {
    expect(displayStatus({ status: 'brouillon', valid_until: '2020-01-01' }, today)).toBe('brouillon')
    expect(displayStatus({ status: 'accepte', valid_until: '2020-01-01' }, today)).toBe('accepte')
    expect(displayStatus({ status: 'refuse', valid_until: null }, today)).toBe('refuse')
  })
})

describe('mentions', () => {
  it('ajoute EI au nom d\'un entrepreneur individuel, une seule fois', () => {
    expect(sellerDisplayName({ legal_name: 'Léa Martin', legal_form: 'EI' })).toBe('Léa Martin EI')
    expect(sellerDisplayName({ legal_name: 'Léa Martin EI', legal_form: 'EI' })).toBe('Léa Martin EI')
    expect(sellerDisplayName({ legal_name: 'Studio Lumière SAS', legal_form: 'societe' })).toBe('Studio Lumière SAS')
  })
  it('mention de franchise selon la date', () => {
    expect(vatMention('franchise', '2026-12-31')).toBe('TVA non applicable, art. 293 B du CGI')
    expect(vatMention('franchise', '2027-01-01')).toBe('TVA non applicable, art. L. 233-3 du CIBS')
    expect(vatMention('tva', '2026-10-04')).toBeNull()
  })
  it('devis : date de validité et « Bon pour accord »', () => {
    const m = legalMentions({ vat_mode: 'tva', issue_date: '2026-10-04', valid_until: '2026-11-03' }, EMPTY_PROFILE)
    expect(m.join(' ')).toContain('Bon pour accord')
  })
  it('aucun tiret cadratin ni emoji dans les textes', () => {
    const all = legalMentions({ vat_mode: 'franchise', issue_date: '2026-10-04', valid_until: '2026-11-03' }, { ...EMPTY_PROFILE, footer_note: 'RC Pro MAAF' }).join(' ')
    expect(all).not.toMatch(/[—\u{1F300}-\u{1FAFF}]/u)
  })
})

describe('contrôles avant finalisation', () => {
  it('liste ce qui manque', () => {
    expect(missingProfileFields(EMPTY_PROFILE)).toHaveLength(3)
    expect(missingProfileFields({ ...EMPTY_PROFILE, legal_name: 'A', siret: '123 456 789 00012', address: 'Paris' })).toEqual([])
    expect(missingDocFields({ client_name: '', lines: [L('', 0, 0)] })).toHaveLength(2)
  })
})

describe('chiffres de l\'année', () => {
  it('envoyés, acceptés, en attente, taux', () => {
    const today = '2026-10-04'
    const d = (o: object) => ({ status: 'envoye', total_ttc: 100, issue_date: '2026-09-01', valid_until: '2026-10-20', ...o }) as never
    const s = yearStats([
      d({ status: 'accepte', total_ttc: 300 }),
      d({ status: 'refuse' }),
      d({ valid_until: '2026-09-15' }),                     // expiré
      d({ total_ttc: 450 }),                                // en attente
      d({ status: 'accepte', issue_date: '2025-12-20', total_ttc: 999 }),
      d({ status: 'brouillon', issue_date: null, total_ttc: 1000 }),
    ], today)
    expect(s).toEqual({ envoyes: 4, acceptes: 1, montantAccepte: 300, enAttente: 1, montantEnAttente: 450, tauxAcceptation: 33 })
  })
})

describe('divers', () => {
  it('prestations récentes sans doublon', () => {
    const r = recentLines([
      { created_at: '2026-01-01', lines: [L('Ménage', 1, 50)] },
      { created_at: '2026-02-01', lines: [L('ménage', 1, 60), L('Linge', 2, 8)] },
    ])
    expect(r.map(l => [l.label, l.unit_price])).toEqual([['ménage', 60], ['Linge', 8]])
  })
  it('ajoute des jours', () => {
    expect(addDays('2026-10-04', 30)).toBe('2026-11-03')
  })
})
