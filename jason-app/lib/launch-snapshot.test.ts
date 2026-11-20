import { describe, it, expect } from 'vitest'
import {
  sessionUserId, readLaunchSnapshot, snapMode, snapHome, buildSnapshot,
  SNAP_READ_JS, SNAP_FILL_INLINE, SNAP_MAX_AGE_MS, SNAP_MAX_BYTES,
} from './launch-snapshot'

const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (sub: string) => `${enc({ alg: 'ES256' })}.${enc({ sub, exp: 9e9 })}.sig`
const UID = '11111111-2222-3333-4444-555555555555'
const OTHER = '99999999-2222-3333-4444-555555555555'

function rawCookie(sub: string, opts: { base64?: boolean; chunks?: number } = {}) {
  let v = JSON.stringify({ access_token: jwt(sub), refresh_token: 'r', user: { user_metadata: { full_name: 'Élodie' } } })
  if (opts.base64) v = 'base64-' + Buffer.from(v).toString('base64url')
  v = encodeURIComponent(v)
  const name = 'sb-abc-auth-token'
  if (!opts.chunks) return `${name}=${v}`
  const size = Math.ceil(v.length / opts.chunks)
  return Array.from({ length: opts.chunks }, (_, i) => `${name}.${i}=${v.slice(i * size, (i + 1) * size)}`).join('; ')
}

const store = (data: Record<string, string>) => ({ getItem: (k: string) => data[k] ?? null })
const NOW = 1_800_000_000_000
const snap = (over: Partial<Record<string, unknown>> = {}) => JSON.stringify({ v: 1, u: UID, p: '/dashboard', w: 390, t: NOW - 3600_000, h: '<div class="dash-layout">x</div>', ...over })

// eslint-disable-next-line no-new-func
const inlineRead = new Function('return ' + SNAP_READ_JS)() as (c: string, ls: unknown, w: number, n: number) => string

describe('identifiant du compte dans le cookie de session', () => {
  it('lit le JSON simple, découpé en morceaux ou en base64', () => {
    expect(sessionUserId(rawCookie(UID))).toBe(UID)
    expect(sessionUserId('a=1; ' + rawCookie(UID, { chunks: 3 }) + '; b=2')).toBe(UID)
    expect(sessionUserId(rawCookie(UID, { base64: true, chunks: 2 }))).toBe(UID)
  })
  it('rien sans session ou avec un cookie illisible', () => {
    expect(sessionUserId('')).toBe('')
    expect(sessionUserId('sb-abc-auth-token=pas%20du%20json')).toBe('')
    expect(sessionUserId('autre=1')).toBe('')
  })
})

describe('copie de la page d’arrivée', () => {
  const cases: Array<[string, string, Record<string, string>, number, number, string]> = [
    ['même compte', rawCookie(UID), { 'jm-snap:user': snap() }, 390, NOW, '<div class="dash-layout">x</div>'],
    ['autre compte sur l’appareil', rawCookie(OTHER), { 'jm-snap:user': snap() }, 390, NOW, ''],
    ['pas de session', '', { 'jm-snap:user': snap() }, 390, NOW, ''],
    ['périmée', rawCookie(UID), { 'jm-snap:user': snap({ t: NOW - SNAP_MAX_AGE_MS - 1 }) }, 390, NOW, ''],
    ['écran trop différent', rawCookie(UID), { 'jm-snap:user': snap() }, 1280, NOW, ''],
    ['écran proche', rawCookie(UID), { 'jm-snap:user': snap() }, 430, NOW, '<div class="dash-layout">x</div>'],
    ['mode admin : copie admin', rawCookie(UID) + '; jm-admin-mode=1', { 'jm-snap:user': snap(), 'jm-snap:admin': snap({ h: 'admin' }) }, 390, NOW, 'admin'],
    ['mode admin sans copie admin', rawCookie(UID) + '; jm-admin-mode=1', { 'jm-snap:user': snap() }, 390, NOW, ''],
    ['donnée abîmée', rawCookie(UID), { 'jm-snap:user': '{oups' }, 390, NOW, ''],
    ['date dans le futur', rawCookie(UID), { 'jm-snap:user': snap({ t: NOW + 3600_000 }) }, 390, NOW, ''],
  ]
  it.each(cases)('%s', (_label, cookie, data, w, now, expected) => {
    expect(readLaunchSnapshot(cookie, store(data), w, now)).toBe(expected)
    // Le script en ligne répond exactement pareil
    expect(inlineRead(cookie, store(data), w, now)).toBe(expected)
  })

  it('le script de remplissage est du JavaScript valide', () => {
    // eslint-disable-next-line no-new-func
    expect(() => new Function(SNAP_FILL_INLINE)).not.toThrow()
  })
})

describe('rangement', () => {
  it('mode et page d’arrivée', () => {
    expect(snapMode('jm-admin-mode=1')).toBe('admin')
    expect(snapMode('jm-admin-mode=0')).toBe('user')
    expect(snapHome(store({}), 'user')).toBe('/dashboard')
    expect(snapHome(store({}), 'admin')).toBe('/dashboard/admin')
    expect(snapHome(store({ 'jm-snap-home:user': '/dashboard/ma-fiche-photographe' }), 'user')).toBe('/dashboard/ma-fiche-photographe')
    expect(snapHome(store({ 'jm-snap-home:user': 'https://ailleurs.example' }), 'user')).toBe('/dashboard')
  })
  it('refuse une copie trop lourde ou sans compte', () => {
    expect(buildSnapshot(UID, '/dashboard', 390, NOW, 'x'.repeat(SNAP_MAX_BYTES + 1))).toBeNull()
    expect(buildSnapshot('', '/dashboard', 390, NOW, 'x')).toBeNull()
    expect(buildSnapshot(UID, '/dashboard', 390, NOW, 'x')).toMatchObject({ v: 1, u: UID })
  })
})
