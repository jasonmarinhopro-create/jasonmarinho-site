import { describe, it, expect } from 'vitest'
import { cautionGroup } from './caution-group'

// Le 5 octobre 2026 à midi, heure de Paris
const NOW = new Date('2026-10-05T10:00:00Z')
const c = (st: string | null, arr: string, dep: string) => ({ stripe_deposit_status: st, date_arrivee: arr, date_depart: dep })

describe('rangement des cautions', () => {
  it('carte bloquée ou action en cours : à décider, même sans Stripe connecté', () => {
    expect(cautionGroup(c('held', '2026-10-03', '2026-10-05'), true, NOW)).toBe('decider')
    expect(cautionGroup(c('capturing', '2026-10-03', '2026-10-05'), true, NOW)).toBe('decider')
    expect(cautionGroup(c('releasing', '2026-10-03', '2026-10-05'), false, NOW)).toBe('decider')
  })
  it('libérée ou retenue : terminée', () => {
    expect(cautionGroup(c('released', '2026-09-10', '2026-09-14'), true, NOW)).toBe('terminee')
    expect(cautionGroup(c('captured', '2026-09-01', '2026-09-04'), true, NOW)).toBe('terminee')
  })
  it('sans Stripe : caution à gérer soi-même', () => {
    expect(cautionGroup(c(null, '2026-10-17', '2026-10-21'), false, NOW)).toBe('horsligne')
  })
  it('séjour à venir ou en cours sans blocage : en attente du voyageur', () => {
    expect(cautionGroup(c(null, '2026-10-17', '2026-10-21'), true, NOW)).toBe('attente')
    expect(cautionGroup(c('pending', '2026-10-06', '2026-10-09'), true, NOW)).toBe('attente')
  })
  it('blocage tombé pendant le séjour : à renvoyer ; après le départ : terminé', () => {
    expect(cautionGroup(c('expired', '2026-10-01', '2026-10-08'), true, NOW)).toBe('expiree')
    expect(cautionGroup(c('expired', '2026-09-20', '2026-09-27'), true, NOW)).toBe('terminee')
  })
  it('séjour passé sans caution validée : terminé, plus rien à demander', () => {
    expect(cautionGroup(c(null, '2026-09-20', '2026-09-23'), true, NOW)).toBe('terminee')
  })
})
