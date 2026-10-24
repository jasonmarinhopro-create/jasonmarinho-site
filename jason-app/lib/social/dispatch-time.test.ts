import { describe, expect, it } from 'vitest'
import { nextDispatchRun } from './dispatch-time'

describe('nextDispatchRun', () => {
  it('un post prévu à 18 h (Paris) part au passage du workflow de 17 h 05 UTC', () => {
    expect(nextDispatchRun(new Date('2026-09-28T16:00:00Z')).toISOString()).toBe('2026-09-28T17:05:00.000Z')
    expect(nextDispatchRun(new Date('2026-10-24T17:00:00Z')).toISOString()).toBe('2026-10-24T17:05:00.000Z')
  })
  it('un post prévu en soirée part le lendemain à 7 h UTC', () => {
    expect(nextDispatchRun(new Date('2026-09-28T19:00:00Z')).toISOString()).toBe('2026-09-29T07:00:00.000Z')
  })
  it('un post prévu avant le passage part le jour même', () => {
    expect(nextDispatchRun(new Date('2026-09-28T05:30:00Z')).toISOString()).toBe('2026-09-28T07:00:00.000Z')
  })
  it('pile à l’heure du passage : ce passage-là', () => {
    expect(nextDispatchRun(new Date('2026-09-28T07:00:00Z')).toISOString()).toBe('2026-09-28T07:00:00.000Z')
  })
  it('fin de mois : passage au mois suivant', () => {
    expect(nextDispatchRun(new Date('2026-09-30T20:00:00Z')).toISOString()).toBe('2026-10-01T07:00:00.000Z')
  })
})

describe('cron social-dispatch', () => {
  it('les passages du workflow suivent .github/workflows/reseaux-sociaux.yml', async () => {
    const { readFileSync } = await import('fs')
    const { WORKFLOW_DISPATCH_UTC } = await import('./dispatch-time')
    const yml = readFileSync(new URL('../../../.github/workflows/reseaux-sociaux.yml', import.meta.url), 'utf8')
    for (const [h, m] of WORKFLOW_DISPATCH_UTC) expect(yml).toContain(`"schedule:${m} ${h} * * *") T="dispatch`)
  })
  it('SOCIAL_DISPATCH_HOUR_UTC suit le cron de vercel.json', async () => {
    const { readFileSync } = await import('fs')
    const { SOCIAL_DISPATCH_HOUR_UTC } = await import('./dispatch-time')
    const cfg = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as { crons: { path: string; schedule: string }[] }
    const cron = cfg.crons.find(c => c.path === '/api/cron/social-dispatch')
    expect(cron).toBeDefined()
    const [minute, hour] = cron!.schedule.split(' ')
    expect(minute).toBe('0')
    expect(Number(hour)).toBe(SOCIAL_DISPATCH_HOUR_UTC)
  })
})
