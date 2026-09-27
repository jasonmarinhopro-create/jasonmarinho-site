import { describe, it, expect } from 'vitest'
import {
  addDaysIso, depositOpensOn, depositWindow, depositActBefore, holdMayExpireBeforeCheckout, parisToday,
} from './deposit-window'

describe('addDaysIso', () => {
  it('traverse les fins de mois et d\'année', () => {
    expect(addDaysIso('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDaysIso('2027-01-01', -2)).toBe('2026-12-30')
    expect(addDaysIso('2026-10-25', 1)).toBe('2026-10-26') // changement d'heure
  })
})

describe('parisToday', () => {
  it('bascule à minuit heure de Paris, pas UTC', () => {
    // 30 sept. 22:30 UTC = 1er oct. 00:30 à Paris (UTC+2)
    expect(parisToday(new Date('2026-09-30T22:30:00Z'))).toBe('2026-10-01')
    expect(parisToday(new Date('2026-09-30T21:30:00Z'))).toBe('2026-09-30')
  })
})

describe('depositWindow', () => {
  const arrivee = '2026-10-10', depart = '2026-10-13'
  it('fermé tant qu\'on n\'est pas à 2 jours de l\'arrivée', () => {
    expect(depositOpensOn(arrivee)).toBe('2026-10-08')
    expect(depositWindow(arrivee, depart, new Date('2026-09-27T12:00:00Z'))).toBe('not_yet')
    expect(depositWindow(arrivee, depart, new Date('2026-10-07T12:00:00Z'))).toBe('not_yet')
  })
  it('ouvert de J-2 au jour du départ inclus', () => {
    expect(depositWindow(arrivee, depart, new Date('2026-10-08T06:00:00Z'))).toBe('open')
    expect(depositWindow(arrivee, depart, new Date('2026-10-10T12:00:00Z'))).toBe('open')
    expect(depositWindow(arrivee, depart, new Date('2026-10-13T20:00:00Z'))).toBe('open')
  })
  it('fermé après le départ', () => {
    expect(depositWindow(arrivee, depart, new Date('2026-10-14T12:00:00Z'))).toBe('closed')
  })
})

describe('durée du blocage', () => {
  it('agir au plus tard 4 jours après l\'arrivée', () => {
    expect(depositActBefore('2026-10-10')).toBe('2026-10-14')
  })
  it('séjour de 4 nuits couvert, 5 nuits non', () => {
    expect(holdMayExpireBeforeCheckout('2026-10-10', '2026-10-14')).toBe(false)
    expect(holdMayExpireBeforeCheckout('2026-10-10', '2026-10-15')).toBe(true)
  })
})
