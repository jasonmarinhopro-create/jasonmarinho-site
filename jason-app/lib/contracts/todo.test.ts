import { describe, expect, it } from 'vitest'
import { contractTodos, contractTodoCount, type ContractTodoInput } from './todo'

const base: ContractTodoInput = {
  id: 'x', statut: 'signe', date_arrivee: '2026-10-01', date_depart: '2026-10-05',
  stripe_payment_enabled: false, stripe_payment_status: null, stripe_deposit_status: null,
}
const c = (p: Partial<ContractTodoInput>) => ({ ...base, ...p })
const TODAY = '2026-09-27'

describe('contractTodos', () => {
  it('liste les contrats à faire signer, sauf séjours terminés et annulés', () => {
    const t = contractTodos([
      c({ id: 'a', statut: 'en_attente', date_arrivee: '2026-10-10', date_depart: '2026-10-12' }),
      c({ id: 'b', statut: 'en_attente', date_arrivee: '2026-10-02', date_depart: '2026-10-04' }),
      c({ id: 'passe', statut: 'en_attente', date_arrivee: '2026-09-01', date_depart: '2026-09-03' }),
      c({ id: 'annule', statut: 'annule' }),
    ], TODAY)
    expect(t.aSigner.map(x => x.id)).toEqual(['b', 'a'])
  })

  it('loyer en attente seulement si le paiement en ligne est activé et non payé', () => {
    const t = contractTodos([
      c({ id: 'paye', stripe_payment_enabled: true, stripe_payment_status: 'paid' }),
      c({ id: 'attente', stripe_payment_enabled: true, stripe_payment_status: 'pending' }),
      c({ id: 'echec', stripe_payment_enabled: true, stripe_payment_status: 'failed' }),
      c({ id: 'horsligne', stripe_payment_enabled: false }),
      c({ id: 'nonsigne', statut: 'en_attente', stripe_payment_enabled: true }),
    ], TODAY)
    expect(t.loyerEnAttente.map(x => x.id).sort()).toEqual(['attente', 'echec'])
  })

  it('caution à libérer une fois le séjour terminé (jour du départ inclus)', () => {
    const t = contractTodos([
      c({ id: 'enCours', stripe_deposit_status: 'held', date_depart: '2026-09-30' }),
      c({ id: 'partiAujourdhui', stripe_deposit_status: 'held', date_depart: TODAY }),
      c({ id: 'parti', stripe_deposit_status: 'held', date_depart: '2026-09-20' }),
      c({ id: 'liberee', stripe_deposit_status: 'released', date_depart: '2026-09-20' }),
    ], TODAY)
    expect(t.cautionALiberer.map(x => x.id)).toEqual(['parti', 'partiAujourdhui'])
    expect(contractTodoCount(t)).toBe(2)
  })

  it('caution à décider dès la date limite, même voyageur encore sur place', () => {
    // arrivée 20/09 → date limite 24/09 (blocage ~7 jours depuis J-2)
    const t = contractTodos([
      c({ id: 'longSejour', stripe_deposit_status: 'held', date_arrivee: '2026-09-20', date_depart: '2026-10-05' }),
      c({ id: 'recent', stripe_deposit_status: 'held', date_arrivee: '2026-09-26', date_depart: '2026-10-05' }),
    ], TODAY)
    expect(t.cautionALiberer.map(x => x.id)).toEqual(['longSejour'])
  })

  it('caution expirée signalée tant que le séjour n\'est pas terminé', () => {
    const t = contractTodos([
      c({ id: 'aRenvoyer', stripe_deposit_status: 'expired', date_depart: '2026-10-05' }),
      c({ id: 'fini', stripe_deposit_status: 'expired', date_depart: '2026-09-20' }),
    ], TODAY)
    expect(t.cautionExpiree.map(x => x.id)).toEqual(['aRenvoyer'])
    expect(contractTodoCount(t)).toBe(1)
  })
})
