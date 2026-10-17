import { describe, it, expect } from 'vitest'
import { METIERS_VISUELS, OPTIONS_VISUELLES, readMetier, metierLabel, readOptions, normalizeVideoUrl, videoEmbed } from './visuel'
import * as site from '../../../scripts/lib/pro-visuel.mjs'

describe('métier visuel', () => {
  it('photographe par défaut', () => {
    expect(readMetier(null)).toBe('photo')
    expect(readMetier('nimporte')).toBe('photo')
    expect(metierLabel('photo_video')).toBe('Photographe et vidéaste')
    expect(metierLabel('video')).toBe('Vidéaste')
  })
  it('options connues seulement, dans l\'ordre de la liste', () => {
    expect(readOptions(['reels', 'drone', 'x'])).toEqual(['drone', 'reels'])
    expect(readOptions(null)).toEqual([])
  })
  it('même liste que le site', () => {
    expect(site.METIERS_VISUELS).toEqual(METIERS_VISUELS)
    expect(site.OPTIONS_VISUELLES).toEqual(OPTIONS_VISUELLES)
  })
})

describe('lien vidéo', () => {
  it('ajoute https et refuse un texte qui n\'est pas une adresse', () => {
    expect(normalizeVideoUrl('youtube.com/@marie')).toEqual({ url: 'https://youtube.com/@marie' })
    expect(normalizeVideoUrl('')).toEqual({ url: null })
    expect(normalizeVideoUrl('ma chaîne').error).toBeTruthy()
  })
  it('reconnaît les vidéos YouTube et Vimeo, comme le site', () => {
    const cases = [
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', { kind: 'youtube', id: 'dQw4w9WgXcQ' }],
      ['https://youtu.be/dQw4w9WgXcQ?t=3', { kind: 'youtube', id: 'dQw4w9WgXcQ' }],
      ['https://youtube.com/shorts/abcdefGHI12', { kind: 'youtube', id: 'abcdefGHI12' }],
      ['https://vimeo.com/123456789', { kind: 'vimeo', id: '123456789' }],
      ['https://www.youtube.com/@marie', null],
      ['https://www.instagram.com/reel/xyz', null],
    ] as const
    for (const [url, want] of cases) {
      expect(videoEmbed(url)).toEqual(want)
      const s = site.videoEmbed(url)
      expect(s ? { kind: s.kind, id: s.id } : null).toEqual(want)
    }
  })
})
