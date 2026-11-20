import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { buttonKey, isAllowedTarget, keptRecipient, trackLinks } from './tracking'
import { eventRow, verifyResendWebhook } from './webhook'

describe('liens suivis', () => {
  it('seulement nos sites, sans jeton', () => {
    expect(isAllowedTarget('https://app.jasonmarinho.com/dashboard')).toBe(true)
    expect(isAllowedTarget('https://evil.com/?jasonmarinho.com')).toBe(false)
    expect(isAllowedTarget('http://jasonmarinho.com')).toBe(false)
    const html = [
      '<a href="https://app.jasonmarinho.com/dashboard/ma-fiche-photographe/statistiques" style="x">Voir mes statistiques</a>',
      '<a href="https://app.jasonmarinho.com/auth/confirmer?t=abc">Ouvrir</a>',
      '<a href="https://app.jasonmarinho.com/sign/9f3c2a1b8d7e6f5a4b3c2d1e0f9a8b7c">Contrat</a>',
      '<a href="https://jasonmarinho.com/demande/suivi/3f2b1c4d-1111-2222-3333-444455556666">Suivi</a>',
      '<a href="mailto:a@b.fr">Écrire</a>',
      '<a href="https://instagram.com/x">Insta</a>',
    ].join('')
    const out = trackLinks(html, 'bilan-pro')
    expect(out).toContain('/api/e/c?c=bilan-pro&amp;b=voir-mes-statistiques&amp;u=https%3A%2F%2Fapp.jasonmarinho.com%2Fdashboard')
    expect(out).toContain('href="https://app.jasonmarinho.com/auth/confirmer?t=abc"')
    expect(out).toContain('href="https://app.jasonmarinho.com/sign/9f3c')
    expect(out).toContain('href="https://jasonmarinho.com/demande/suivi/3f2b')
    expect(out).toContain('href="mailto:a@b.fr"')
    expect(out).toContain('href="https://instagram.com/x"')
    expect(out.match(/\/api\/e\/c/g)?.length).toBe(1)
  })
  it('nom du bouton', () => {
    expect(buttonKey('Répondre à Camille')).toBe('repondre-a-camille')
    expect(buttonKey('<strong>Voir&nbsp;la fiche</strong>')).toBe('voir-la-fiche')
    expect(buttonKey('')).toBe('lien')
  })
  it('adresse masquée pour les clients des membres', () => {
    expect(keptRecipient('voyageur', 'x@y.fr')).toBe('adresse masquée (client d’un membre)')
    expect(keptRecipient('devis', 'x@y.fr')).toContain('masquée')
    expect(keptRecipient('compte', ' X@Y.fr ')).toBe('x@y.fr')
  })
})

describe('webhook Resend', () => {
  const secret = 'whsec_' + Buffer.from('cle-de-test-123456').toString('base64')
  const sign = (id: string, ts: string, body: string) => 'v1,' + createHmac('sha256', Buffer.from('cle-de-test-123456')).update(`${id}.${ts}.${body}`).digest('base64')
  it('signature valide, falsifiée ou trop vieille', () => {
    const body = '{"type":"email.sent"}', ts = '1795190000'
    const now = 1795190000 * 1000
    expect(verifyResendWebhook({ secret, id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body), body, now })).toBe(true)
    expect(verifyResendWebhook({ secret, id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body), body: body + ' ', now })).toBe(false)
    expect(verifyResendWebhook({ secret, id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body), body, now: now + 600_000 })).toBe(false)
    expect(verifyResendWebhook({ secret, id: null, timestamp: ts, signature: 'v1,x', body, now })).toBe(false)
  })
  it('lignes enregistrées', () => {
    expect(eventRow('m1', { type: 'email.sent', data: { email_id: 'e1', to: ['a@b.fr'], tags: { categorie: 'bilan-pro' } } }))
      .toEqual({ id: 'm1', email_id: 'e1', type: 'sent', categorie: 'bilan-pro', destinataire: null, raison: null })
    const b = eventRow('m2', { type: 'email.bounced', data: { to: ['guest@x.fr'], tags: [{ name: 'categorie', value: 'voyageur' }], bounce: { type: 'Permanent', message: 'Mailbox does not exist' } } })
    expect(b?.destinataire).toContain('masquée')
    expect(b?.raison).toContain('Mailbox does not exist')
    expect(eventRow('m3', { type: 'email.opened', data: {} })).toBeNull()
    expect(eventRow('m4', { type: 'email.delivered', data: { tags: { categorie: 'inconnue' } } })?.categorie).toBe('autre')
  })
})
