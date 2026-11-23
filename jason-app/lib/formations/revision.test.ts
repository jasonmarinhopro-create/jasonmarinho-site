import { describe, it, expect } from 'vitest'
import { pickRevision, weekStartParis } from './revision'

const content = {
  title: 'Bon prix',
  modules: [{ lessons: [
    { id: 1, content: ':::quiz\n? Q1\n- a\n* b\n= car\n:::\n:::quiz\n? Q2\n* oui\n- non\n:::' },
    { id: 2, content: ':::quiz\n? Q3\n* x\n- y\n:::' },
  ] }],
}
const map = new Map([['f1', { slug: 'bon-prix', content }]])
const now = new Date('2026-11-23T12:00:00Z')

describe('pickRevision', () => {
  it('7 jours au moins, une question par leçon, plus anciennes d\'abord', () => {
    const r = pickRevision([
      { formation_id: 'f1', lesson_id: 1, question: 1, answered_at: '2026-11-10T10:00:00Z' },
      { formation_id: 'f1', lesson_id: 1, question: 0, answered_at: '2026-11-11T10:00:00Z' },
      { formation_id: 'f1', lesson_id: 2, question: 0, answered_at: '2026-11-20T10:00:00Z' },
    ], map, now)
    expect(r.map(q => q.text)).toEqual(['Q2'])
  })
  it('ignore formation ou question inconnue, limite le nombre', () => {
    expect(pickRevision([{ formation_id: 'zz', lesson_id: 1, question: 0, answered_at: '2026-11-01T00:00:00Z' }], map, now)).toEqual([])
    expect(pickRevision([{ formation_id: 'f1', lesson_id: 1, question: 9, answered_at: '2026-11-01T00:00:00Z' }], map, now)).toEqual([])
    const r = pickRevision([
      { formation_id: 'f1', lesson_id: 1, question: 0, answered_at: '2026-11-01T00:00:00Z' },
      { formation_id: 'f1', lesson_id: 2, question: 0, answered_at: '2026-11-02T00:00:00Z' },
    ], map, now, 1)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ slug: 'bon-prix', lessonId: 1, explanation: 'car' })
  })
})

describe('weekStartParis', () => {
  it('lundi minuit à Paris, hiver et été', () => {
    expect(weekStartParis(new Date('2026-11-25T10:00:00Z'))).toBe('2026-11-22T23:00:00.000Z')
    expect(weekStartParis(new Date('2026-11-23T00:30:00Z'))).toBe('2026-11-22T23:00:00.000Z')
    expect(weekStartParis(new Date('2026-07-05T10:00:00Z'))).toBe('2026-06-28T22:00:00.000Z')
  })
})
