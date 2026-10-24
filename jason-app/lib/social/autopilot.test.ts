import { describe, it, expect } from 'vitest'
import { postFormat, autoSlug, coverOf, statsByFormat } from './autopilot'

const base = 'https://x.supabase.co/storage/v1/object/public/social-post-media'

describe('pilote automatique des réseaux', () => {
  it('reconnaît le format et le sujet d’un post', () => {
    expect(postFormat([`${base}/auto/2026-10-24-a/reel.mp4`, `${base}/auto/2026-10-24-a/cover.jpg`])).toBe('reel')
    expect(postFormat(['a.png', 'b.png'])).toBe('carrousel')
    expect(postFormat(['a.png'])).toBe('photo')
    expect(postFormat([])).toBe('texte')
    expect(autoSlug([`${base}/auto/2026-10-24-photographe-hotel-4-points/slide-01.png`])).toBe('photographe-hotel-4-points')
    expect(autoSlug([`${base}/manuel/photo.png`])).toBeNull()
    expect(coverOf(['v.mp4', 'c.jpg'])).toBe('c.jpg')
  })
  it('classe les formats par engagement moyen', () => {
    const t = (l: number, c: number) => ({ status: 'published', like_count: l, comment_count: c })
    const res = statsByFormat([
      { media_urls: ['a.png', 'b.png'], targets: [t(4, 1), t(3, 0)] },
      { media_urls: ['v.mp4'], targets: [t(10, 2)] },
      { media_urls: ['p.png'], targets: [{ status: 'failed', like_count: 0, comment_count: 0 }] },
    ])
    expect(res.map(r => r.format)).toEqual(['reel', 'carrousel'])
    expect(res[1]).toMatchObject({ posts: 1, likes: 7, comments: 1, perPost: 8 })
  })
})
