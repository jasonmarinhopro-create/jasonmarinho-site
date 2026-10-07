import { describe, it, expect } from 'vitest'
import { RESEAUX, normalizeReseau, cleanReseaux, readReseaux } from './reseaux'
import { PRO_RESEAUX } from '../../../scripts/lib/pro-reseaux.mjs'

describe('réseaux des pros', () => {
  it('accepte les liens des bons réseaux et les rend propres', () => {
    expect(normalizeReseau('facebook', 'facebook.com/monstudio')).toEqual({ url: 'https://facebook.com/monstudio' })
    expect(normalizeReseau('facebook', 'http://www.facebook.com/monstudio#about').url).toBe('https://www.facebook.com/monstudio')
    expect(normalizeReseau('linkedin', 'https://fr.linkedin.com/in/joris').url).toBe('https://fr.linkedin.com/in/joris')
    expect(normalizeReseau('tiktok', '@joris.photo').url).toBe('https://www.tiktok.com/@joris.photo')
    expect(normalizeReseau('youtube', '@monstudio').url).toBe('https://www.youtube.com/@monstudio')
    expect(normalizeReseau('google', 'https://maps.app.goo.gl/AbC123').url).toBe('https://maps.app.goo.gl/AbC123')
    expect(normalizeReseau('google', 'https://www.google.com/maps/place/Studio+Joris').url).toContain('google.com/maps/place')
    expect(normalizeReseau('google', 'https://g.page/r/abc').url).toBe('https://g.page/r/abc')
    expect(normalizeReseau('facebook', '')).toEqual({ url: null })
  })

  it('refuse un lien qui ne mène pas au bon réseau', () => {
    expect(normalizeReseau('facebook', 'https://evil.com/facebook.com').error).toBeTruthy()
    expect(normalizeReseau('facebook', 'https://facebook.com.evil.com/x').error).toBeTruthy()
    expect(normalizeReseau('linkedin', 'javascript:alert(1)').error).toBeTruthy()
    expect(normalizeReseau('google', 'https://www.google.com/search?q=photographe').error).toBeTruthy()
  })

  it('nettoie un formulaire complet', () => {
    const { value, errors } = cleanReseaux({ facebook: 'facebook.com/a', linkedin: 'https://x.com/a', youtube: '', autre: 'https://x.com' })
    expect(value).toEqual({ facebook: 'https://facebook.com/a' })
    expect(errors).toHaveLength(1)
    expect(readReseaux(null)).toEqual({})
    expect(readReseaux({ tiktok: 'https://www.tiktok.com/@a', facebook: 'https://pirate.com' })).toEqual({ tiktok: 'https://www.tiktok.com/@a' })
  })

  it('même liste que le site statique', () => {
    expect(PRO_RESEAUX.map((r: { key: string; hosts: string[]; icon: string }) => [r.key, r.hosts, r.icon]))
      .toEqual(RESEAUX.map(r => [r.key, r.hosts, r.icon]))
  })
})
