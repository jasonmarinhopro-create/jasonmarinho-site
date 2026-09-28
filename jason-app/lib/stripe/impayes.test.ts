import { describe, it, expect } from 'vitest'
import { deriveImpayes, type ImpayeInput } from './impayes'

const base: ImpayeInput = {
  id: 'c1', locataire_prenom: 'Ana', locataire_nom: 'Silva', locataire_email: 'a@b.c',
  logement_nom: 'Casa', montant_loyer: 500, acompte_percent: null,
  date_arrivee: '2026-10-01', date_depart: '2026-10-05',
  statut: 'signe', stripe_payment_status: null, stripe_payment_enabled: true,
}

describe('deriveImpayes', () => {
  it('garde une arrivée à 7 jours ou moins, ignore au-delà', () => {
    expect(deriveImpayes([base], '2026-09-24')).toHaveLength(1)
    expect(deriveImpayes([base], '2026-09-23')).toHaveLength(0)
  })

  it('calcule le retard sans décalage horaire', () => {
    expect(deriveImpayes([base], '2026-10-03')[0].daysOverdue).toBe(2)
    expect(deriveImpayes([base], '2026-09-29')[0].daysOverdue).toBe(-2)
    expect(deriveImpayes([base], '2026-10-01')[0].daysOverdue).toBe(0)
  })

  it('ignore payé, annulé, paiement en ligne désactivé', () => {
    expect(deriveImpayes([{ ...base, stripe_payment_status: 'paid' }], '2026-10-01')).toHaveLength(0)
    expect(deriveImpayes([{ ...base, statut: 'annule' }], '2026-10-01')).toHaveLength(0)
    expect(deriveImpayes([{ ...base, stripe_payment_enabled: false }], '2026-10-01')).toHaveLength(0)
  })

  it("montant dû = part d'acompte du loyer", () => {
    expect(deriveImpayes([{ ...base, acompte_percent: 50 }], '2026-10-01')[0].montant_du).toBe(250)
    expect(deriveImpayes([base], '2026-10-01')[0].montant_du).toBe(500)
  })

  it('les plus en retard en premier', () => {
    const r = deriveImpayes([base, { ...base, id: 'c2', date_arrivee: '2026-09-20' }], '2026-10-01')
    expect(r.map(c => c.id)).toEqual(['c2', 'c1'])
  })
})
