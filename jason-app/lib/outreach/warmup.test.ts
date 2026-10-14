import { describe, it, expect } from 'vitest'
import { classifyError, decideWarmup, pushLog, clampCeiling, type WarmupStats } from './warmup'

const base: WarmupStats = { sent: 120, bounces: 1, unsubscribes: 0, complaints: 0, blocks: 0, otherErrors: 0, replies: 3, busiestDay: 25 }
const input = (over: Partial<WarmupStats> = {}, rest: Partial<Parameters<typeof decideWarmup>[0]> = {}) =>
  decideWarmup({ cap: 25, ceiling: 70, stats: { ...base, ...over }, today: '2026-10-14', lastChange: null, lastCut: null, ...rest })

describe('erreurs SMTP', () => {
  it('distingue adresse inconnue, blocage et le reste', () => {
    expect(classifyError('550 5.1.1 <x@y.fr>: Recipient address rejected: User unknown')).toBe('adresse')
    expect(classifyError('554 5.7.1 Message rejected as spam')).toBe('blocage')
    expect(classifyError('421 Too many messages, try later')).toBe('blocage')
    expect(classifyError('550 5.7.1 Sender blocked: poor reputation')).toBe('blocage')
    expect(classifyError('Connection timeout')).toBe('autre')
    expect(classifyError(null)).toBe('autre')
  })
})

describe('montée en charge', () => {
  it('monte de 5 quand tout va bien et que le plafond est utilisé', () => {
    const d = input()
    expect(d).toMatchObject({ level: 'vert', action: 'monter', cap: 30 })
  })

  it('ne monte pas si le plafond n\'est pas utilisé', () => {
    expect(input({ busiestDay: 12 })).toMatchObject({ action: 'garder', cap: 25 })
  })

  it('attend 2 jours entre deux hausses et 7 jours après une baisse', () => {
    expect(input({}, { lastChange: '2026-10-13' }).action).toBe('garder')
    expect(input({}, { lastChange: '2026-10-12' }).action).toBe('monter')
    expect(input({}, { lastCut: '2026-10-10', lastChange: '2026-10-10' }).action).toBe('garder')
    expect(input({}, { lastCut: '2026-10-06', lastChange: '2026-10-06' }).action).toBe('monter')
  })

  it('ne dépasse jamais le plafond maximum', () => {
    expect(input({ busiestDay: 68 }, { cap: 68 }).cap).toBe(70)
    expect(input({ busiestDay: 70 }, { cap: 70 })).toMatchObject({ action: 'garder', cap: 70 })
  })

  it('garde le plafond sur des signaux moyens', () => {
    expect(input({ bounces: 4 })).toMatchObject({ level: 'orange', action: 'garder', cap: 25 }) // 3,3 %
    expect(input({ blocks: 1 })).toMatchObject({ level: 'orange', action: 'garder' })
    expect(input({ unsubscribes: 2 })).toMatchObject({ level: 'orange' })
  })

  it('baisse nettement sur de mauvais signaux, jamais sous 10', () => {
    expect(input({ bounces: 8 }, { cap: 40 })).toMatchObject({ level: 'rouge', action: 'baisser', cap: 24 }) // 6,7 %
    expect(input({ blocks: 2 }, { cap: 40 }).cap).toBe(24)
    expect(input({ complaints: 1 }, { cap: 40 }).action).toBe('baisser')
    expect(input({ blocks: 3 }, { cap: 12 })).toMatchObject({ action: 'baisser', cap: 10 })
    expect(input({ blocks: 3 }, { cap: 10 })).toMatchObject({ level: 'rouge', action: 'garder', cap: 10 })
  })

  it('attend d\'avoir assez d\'envois pour juger un taux', () => {
    expect(input({ sent: 12, bounces: 0, busiestDay: 12 })).toMatchObject({ level: 'attente', action: 'garder' })
    expect(input({ sent: 12, bounces: 2 }).level).toBe('orange')
    expect(input({ sent: 12, bounces: 4 }).level).toBe('rouge')
  })
})

describe('journal et plafond maximum', () => {
  it('garde 30 entrées, une par jour, la plus récente d\'abord', () => {
    const e = (date: string) => ({ date, level: 'vert' as const, action: 'garder' as const, from: 25, to: 25, reasons: [], stats: base })
    const log = pushLog([e('2026-10-13'), e('2026-10-14')], e('2026-10-14'))
    expect(log.map(x => x.date)).toEqual(['2026-10-14', '2026-10-13'])
    expect(pushLog('nimporte', e('2026-10-14'))).toHaveLength(1)
  })
  it('borne le plafond maximum', () => {
    expect(clampCeiling(500)).toBe(90)
    expect(clampCeiling(3)).toBe(10)
    expect(clampCeiling(null)).toBe(70)
  })
})
