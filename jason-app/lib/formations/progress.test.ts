import { describe, it, expect } from 'vitest'
import { flatLessons, firstIncomplete, lessonFromParam, percent, quizScore } from './progress'

const modules = [
  { id: 1, lessons: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] },
  { id: 2, lessons: [{ id: 11, title: 'C' }] },
]

describe('progression', () => {
  const all = flatLessons(modules)
  it('aplatit dans l\'ordre avec le module', () => {
    expect(all.map(l => `${l.moduleId}-${l.lessonId}`)).toEqual(['1-1', '1-2', '2-11'])
  })
  it('reprise : première leçon non terminée', () => {
    expect(firstIncomplete(all, [1])?.lessonId).toBe(2)
    expect(firstIncomplete(all, [1, 2, 11])).toBeNull()
    expect(firstIncomplete(all, [2])?.lessonId).toBe(1)
  })
  it('leçon de l\'adresse', () => {
    expect(lessonFromParam(all, '11')?.moduleId).toBe(2)
    expect(lessonFromParam(all, '99')).toBeNull()
    expect(lessonFromParam(all, 'abc')).toBeNull()
    expect(lessonFromParam(all, null)).toBeNull()
  })
  it('pourcentage sans doublon, plafonné', () => {
    expect(percent([1, 1, 2], 3)).toBe(67)
    expect(percent([1, 2, 11, 99], 3)).toBe(100)
    expect(percent([], 0)).toBe(0)
  })
  it('score', () => {
    expect(quizScore([{ correct: true }, { correct: false }, { correct: true }])).toEqual({ good: 2, total: 3 })
  })
})
