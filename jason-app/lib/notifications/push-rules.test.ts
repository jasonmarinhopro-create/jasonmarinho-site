import { describe, it, expect } from 'vitest'
import { pushPayload, shouldPush, deviceLabel, isGoneStatus } from './push-rules'

describe('push', () => {
  it('lien interne seulement, textes raccourcis', () => {
    const p = pushPayload({ title: 'Nouvelle réservation Airbnb', body: 'x'.repeat(300), href: 'https://evil.com', type: 'ical_nouvelle', dedupKey: 'k' })
    expect(p.url).toBe('/dashboard/notifications')
    expect(p.body.length).toBe(180)
    expect(p.body.endsWith('…')).toBe(true)
    expect(pushPayload({ title: 'T', href: '//evil.com', type: 't', dedupKey: 'k' }).url).toBe('/dashboard/notifications')
    expect(pushPayload({ title: 'T', href: '/dashboard/contrats', type: 't', dedupKey: 'k' }).url).toBe('/dashboard/contrats')
  })
  it('rappels répétés jamais poussés', () => {
    expect(shouldPush('stripe_incomplet')).toBe(false)
    expect(shouldPush('contrat_signe')).toBe(true)
  })
  it('nom des appareils', () => {
    expect(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari/604.1')).toBe('iPhone')
    expect(deviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0 Safari/537.36')).toBe('Chrome sur Mac')
    expect(deviceLabel('Mozilla/5.0 (Linux; Android 14) Chrome/128.0 Mobile Safari/537.36')).toBe('Chrome sur Android')
    expect(deviceLabel(null)).toBe('Appareil')
  })
  it('abonnements morts', () => {
    expect(isGoneStatus(410)).toBe(true)
    expect(isGoneStatus(500)).toBe(false)
  })
})
