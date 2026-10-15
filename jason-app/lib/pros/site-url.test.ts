import { describe, it, expect } from 'vitest'
import { normSiteUrl, siteUrlOk } from './site-url'

describe('adresse de site des pros', () => {
  it('ajoute https:// et reconnaît un compte Instagram', () => {
    expect(normSiteUrl('monsite.fr')).toBe('https://monsite.fr')
    expect(normSiteUrl(' www.photo-roanne.fr ')).toBe('https://www.photo-roanne.fr')
    expect(normSiteUrl('@marie.photo')).toBe('https://www.instagram.com/marie.photo')
    expect(normSiteUrl('https://instagram.com/x')).toBe('https://instagram.com/x')
    expect(normSiteUrl('')).toBe('')
  })
  it('refuse ce qui n\'est pas une adresse de site', () => {
    expect(siteUrlOk(normSiteUrl('Roanne'))).toBe(false)
    expect(siteUrlOk(normSiteUrl('monsite.fr'))).toBe(true)
    expect(siteUrlOk(normSiteUrl('http://a.b'))).toBe(true)
  })
})
