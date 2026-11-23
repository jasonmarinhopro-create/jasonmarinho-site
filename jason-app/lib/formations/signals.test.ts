import { describe, it, expect } from 'vitest'
import { computeSignals, nuitsReservees } from './signals'

const base = { today: '2026-12-01', logementsCount: 1, prixRenseignes: true, sejoursTotal: 10, sejoursProchains: [], leconsFaites: new Set<string>() }

describe('signaux de l\'activité', () => {
  it('compte les nuits dans la fenêtre de 30 jours', () => {
    expect(nuitsReservees([{ arrivee: '2026-11-28', depart: '2026-12-03' }, { arrivee: '2026-12-29', depart: '2027-01-05' }], '2026-12-01')).toBe(2 + 2)
    expect(nuitsReservees([{ arrivee: '2026-12-05', depart: null }], '2026-12-01')).toBe(26)
  })
  it('rien sans logement', () => {
    expect(computeSignals({ ...base, logementsCount: 0, prixRenseignes: false })).toEqual([])
  })
  it('prix non renseignés, puis plus rien une fois la leçon faite', () => {
    expect(computeSignals({ ...base, prixRenseignes: false, sejoursTotal: 0 }).map(s => s.key)).toEqual(['prix-minimum'])
    expect(computeSignals({ ...base, prixRenseignes: false, sejoursTotal: 0, leconsFaites: new Set(['mettre-le-bon-prix-lcd:1']) })).toEqual([])
  })
  it('calendrier vide ou plein, seulement si les séjours sont tenus dans l\'app', () => {
    const vide = computeSignals({ ...base, sejoursProchains: [{ arrivee: '2026-12-10', depart: '2026-12-13' }] })
    expect(vide.map(s => s.key)).toEqual(['calendrier-vide'])
    expect(vide[0].titre).toContain('10 %')
    expect(computeSignals({ ...base, sejoursTotal: 2 })).toEqual([])
    const plein = computeSignals({ ...base, sejoursProchains: [{ arrivee: '2026-12-01', depart: '2026-12-31' }] })
    expect(plein.map(s => s.key)).toEqual(['calendrier-plein'])
  })
})
