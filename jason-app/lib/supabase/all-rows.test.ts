import { describe, expect, it } from 'vitest'
import { allRows, PAGE_SIZE } from './all-rows'

const table = Array.from({ length: 2345 }, (_, i) => i)
const page = (from: number, to: number) => Promise.resolve({ data: table.slice(from, Math.min(to + 1, from + PAGE_SIZE)), error: null })

describe('allRows', () => {
  it('lit toutes les pages au-delà de 1 000 lignes', async () => {
    const r = await allRows(page)
    expect(r.rows.length).toBe(2345)
    expect(r.rows[2344]).toBe(2344)
  })
  it('respecte le plafond', async () => {
    expect((await allRows(page, 2000)).rows.length).toBe(2000)
  })
  it('garde les lignes lues et l\'erreur', async () => {
    let n = 0
    const r = await allRows((from, to) => Promise.resolve(n++ ? { data: null, error: { message: 'x' } } : page(from, to).then(p => p)) as never)
    expect(r.rows.length).toBe(1000)
    expect(r.error?.message).toBe('x')
  })
})
