import { describe, it, expect } from 'vitest'
import { parseSlowMessage, slowPagesCheck } from './slow-pages'

const msg = (label: string, ms: number, calls?: number) =>
  `Serveur lent : ${label} ${ms} ms (vue 1 ms, serveur bloqué au plus 1 ms${calls !== undefined ? `, · ${calls} appels, plus lents : x 1 ms` : ''})`

describe('parseSlowMessage', () => {
  it('lit la page, la durée et les appels', () => {
    expect(parseSlowMessage(msg('page /dashboard/admin', 6569, 2))).toEqual({ label: 'page /dashboard/admin', ms: 6569, calls: 2 })
    expect(parseSlowMessage(msg('/dashboard/admin/sante', 16517, 57))).toEqual({ label: '/dashboard/admin/sante', ms: 16517, calls: 57 })
  })
  it('sans nombre d’appels', () => {
    expect(parseSlowMessage(msg('/dashboard/admin/provenance', 3034))?.calls).toBeNull()
  })
  it('regroupe les fiches par identifiant', () => {
    expect(parseSlowMessage(msg('page /dashboard/admin/membres/0b1c2d3e-0000-4000-8000-123456789abc', 7000, 3))?.label).toBe('page /dashboard/admin/membres/<id>')
  })
  it('ignore un autre message', () => {
    expect(parseSlowMessage('Ouverture lente (navigateur) : /dashboard 8000 ms')).toBeNull()
  })
})

describe('slowPagesCheck', () => {
  it('rien à signaler sans répétition', () => {
    const c = slowPagesCheck([msg('page /a', 20000, 3), msg('page /b', 1600, 2)])
    expect(c.level).toBe('ok')
    expect(c.items).toEqual([])
  })
  it('signale une page lente plusieurs fois', () => {
    const c = slowPagesCheck([msg('page /a', 12000, 4), msg('page /a', 11000, 4), msg('page /a', 13000, 4)])
    expect(c.level).toBe('warn')
    expect(c.items[0].label).toBe('page /a')
  })
  it('signale une page à trop d’appels même rapide', () => {
    const c = slowPagesCheck([msg('page /b', 1800, 30), msg('page /b', 1700, 28), msg('page /b', 1900, 31)])
    expect(c.items[0].level).toBe('warn')
  })
})
