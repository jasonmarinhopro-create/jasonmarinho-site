import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { choosePhoto, resolvePhotos, photoFields, writeUsed, readUsed } from '../../../scripts/social/photos.mjs'

describe('photos Pexels des publications', () => {
  it('écarte une photo publiée depuis moins de 60 jours', () => {
    const res = [{ id: 1 }, { id: 2 }, { id: 3 }]
    expect(choosePhoto(res, { 1: '2026-11-01' }, '2026-11-19')?.id).toBe(2)
    expect(choosePhoto(res, { 1: '2026-08-01' }, '2026-11-19')?.id).toBe(1)
    expect(choosePhoto(res, {}, '2026-11-19', new Set(['1', '2']))?.id).toBe(3)
    expect(choosePhoto(res, { 1: '2026-11-18', 2: '2026-11-18', 3: '2026-11-18' }, '2026-11-19')).toBeNull()
  })
  it('trouve les champs photo du post, des scènes et des stories', () => {
    const spec = { photo: 'a', slides: [{ photo: 'b' }, {}], story: { frames: [{ photo: 'c' }] } }
    expect(photoFields(spec).map(f => f.get())).toEqual(['a', 'b', 'c'])
  })
  it('télécharge la photo, ou garde le fond de la marque si Pexels échoue', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'px-'))
    const fetchFn = async (input: RequestInfo | URL) => {
      const u = String(input)
      if (u.includes('/search')) return new Response(JSON.stringify({ photos: [{ id: 7, src: { large2x: 'https://img/7.jpg' } }] }))
      if (u.endsWith('7.jpg')) return new Response(new Uint8Array([1, 2, 3]))
      return new Response('', { status: 500 })
    }
    const used: Record<string, string> = {}
    const spec: Record<string, unknown> = { photo: 'pexels:annecy lac', slides: [{ photo: 'pexels:12345' }, { photo: 'img/x.jpg' }] }
    const ids = await resolvePhotos(spec, { root, key: 'k', used, today: '2026-11-19', fetchFn })
    expect(ids).toEqual([7])
    expect(spec.photo).toBe('tmp-social/pexels-7.jpg')
    expect(fs.existsSync(path.join(root, 'tmp-social/pexels-7.jpg'))).toBe(true)
    expect((spec.slides as Record<string, unknown>[])[0].photo).toBeUndefined()
    expect((spec.slides as Record<string, unknown>[])[1].photo).toBe('img/x.jpg')
    expect(used).toEqual({ 7: '2026-11-19' })
    const f = path.join(root, 'u.json')
    writeUsed(f, { 7: '2026-11-19', 8: '2026-01-01' }, '2026-11-19')
    expect(readUsed(f)).toEqual({ 7: '2026-11-19' })
  })
})
