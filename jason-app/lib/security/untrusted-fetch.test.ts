import { describe, it, expect } from 'vitest'
import { isBrotli, untrustedText, UNTRUSTED_ACCEPT_ENCODING } from './untrusted-fetch'

describe('lecture des adresses non maîtrisées', () => {
  it('repère le Brotli, seul ou dans une liste', () => {
    expect(isBrotli('br')).toBe(true)
    expect(isBrotli('gzip, BR')).toBe(true)
    expect(isBrotli('gzip')).toBe(false)
    expect(isBrotli(null)).toBe(false)
    expect(isBrotli('brotli-like')).toBe(false)
  })
  it('refuse une réponse br sans la lire, lit les autres', async () => {
    await expect(untrustedText(new Response('x', { headers: { 'content-encoding': 'br' } }))).rejects.toThrow(/Brotli/)
    await expect(untrustedText(new Response('BEGIN:VCALENDAR'))).resolves.toBe('BEGIN:VCALENDAR')
  })
  it('ne demande jamais de Brotli', () => {
    expect(UNTRUSTED_ACCEPT_ENCODING).not.toMatch(/br/)
  })
})
