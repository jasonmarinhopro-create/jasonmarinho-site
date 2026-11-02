import { describe, it, expect } from 'vitest'
import { samePeriodLastMonth, pctChange } from './month-compare'

describe('samePeriodLastMonth', () => {
  it('rien les 7 premiers jours du mois', () => {
    expect(samePeriodLastMonth('2026-11-02')).toBeNull()
    expect(samePeriodLastMonth('2026-11-07')).toBeNull()
  })
  it('du 1er au même jour du mois dernier', () => {
    expect(samePeriodLastMonth('2026-11-15')).toEqual({ start: '2026-10-01', end: '2026-10-15', label: 'vs même période en octobre' })
  })
  it('borné à la fin d’un mois plus court, janvier compare à décembre', () => {
    expect(samePeriodLastMonth('2026-03-31')?.end).toBe('2026-02-28')
    expect(samePeriodLastMonth('2027-01-10')).toMatchObject({ start: '2026-12-01', end: '2026-12-10' })
  })
})

describe('pctChange', () => {
  it('écart arrondi, rien sans base', () => {
    expect(pctChange(150, 100)).toBe(50)
    expect(pctChange(0, 100)).toBe(-100)
    expect(pctChange(100, 0)).toBeNull()
  })
})
