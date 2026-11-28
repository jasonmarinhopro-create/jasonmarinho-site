import { describe, it, expect, afterEach, vi } from 'vitest'
import { annonceImmediate, heureParis, lancerStoriesDemandes } from './dispatch-demandes'

describe('stories de demande lancées par l’app', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
  it('heure de Paris, hiver et été', () => {
    expect(heureParis(new Date('2026-11-28T07:30:00Z'))).toBe(8)
    expect(heureParis(new Date('2026-07-01T06:30:00Z'))).toBe(8)
  })
  it('pas d’annonce la nuit', () => {
    expect(annonceImmediate(new Date('2026-11-28T06:59:00Z'))).toBe(false)
    expect(annonceImmediate(new Date('2026-11-28T07:00:00Z'))).toBe(true)
    expect(annonceImmediate(new Date('2026-11-28T19:59:00Z'))).toBe(true)
    expect(annonceImmediate(new Date('2026-11-28T20:00:00Z'))).toBe(false)
  })
  it('sans jeton, rien ; avec jeton, appel de l’API GitHub', async () => {
    vi.stubEnv('GITHUB_DISPATCH_TOKEN', '')
    expect(await lancerStoriesDemandes(new Date('2026-11-28T10:00:00Z'))).toBe('sans-jeton')
    vi.stubEnv('GITHUB_DISPATCH_TOKEN', 'x')
    const f = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', f)
    expect(await lancerStoriesDemandes(new Date('2026-11-28T10:00:00Z'))).toBe('lance')
    expect(String((f.mock.calls[0] as unknown[])[0])).toContain('/actions/workflows/reseaux-sociaux.yml/dispatches')
    expect(await lancerStoriesDemandes(new Date('2026-11-28T23:00:00Z'))).toBe('nuit')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })))
    expect(await lancerStoriesDemandes(new Date('2026-11-28T10:00:00Z'))).toBe('echec')
  })
})
