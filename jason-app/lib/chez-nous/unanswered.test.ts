import { describe, it, expect } from 'vitest'
import { unansweredQuestions, unansweredDigestEmail, newQuestionEmail, hoursLeft, type QuestionRow } from './unanswered'

const now = new Date('2026-09-27T12:00:00Z')
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()

const q = (over: Partial<QuestionRow>): QuestionRow => ({
  id: 'p1', author_id: 'u1', title: 'Taxe de séjour ?', category: 'reglementation',
  reply_count: 0, created_at: hoursAgo(30), ...over,
})

describe('unansweredQuestions', () => {
  it('garde les questions sans réponse depuis 24 h à 14 jours', () => {
    const posts = [
      q({ id: 'recent', created_at: hoursAgo(5) }),        // trop récente
      q({ id: 'due', created_at: hoursAgo(30) }),
      q({ id: 'old', created_at: hoursAgo(24 * 20) }),     // trop ancienne
      q({ id: 'answered', reply_count: 2 }),
      q({ id: 'admin', author_id: 'jason' }),             // post de Jason lui-même
    ]
    expect(unansweredQuestions(posts, new Set(['jason']), now).map(p => p.id)).toEqual(['due'])
  })

  it('trie de la plus ancienne à la plus récente', () => {
    const posts = [q({ id: 'b', created_at: hoursAgo(26) }), q({ id: 'a', created_at: hoursAgo(60) })]
    expect(unansweredQuestions(posts, new Set(), now).map(p => p.id)).toEqual(['a', 'b'])
  })
})

describe('emails', () => {
  it('rappel : délai restant ou retard par rapport aux 48 h', () => {
    expect(hoursLeft(hoursAgo(30), now)).toBe(18)
    const mail = unansweredDigestEmail([q({ id: 'x', created_at: hoursAgo(30) }), q({ id: 'y', created_at: hoursAgo(50) })], 'https://app.test', now)
    expect(mail.subject).toBe('2 questions sans réponse')
    expect(mail.text).toContain('il reste 18 h')
    expect(mail.text).toContain('en retard de 2 h')
    expect(mail.text).toContain('https://app.test/dashboard/chez-nous/x')
    expect(mail.text).toContain('Réglementation & Fiscal')
  })

  it('nouvelle question : titre en objet, extrait coupé', () => {
    const mail = newQuestionEmail({ authorName: 'Marie', title: 'Caution', body: 'a'.repeat(700), category: 'voyageurs', postUrl: 'https://app.test/p' })
    expect(mail.subject).toBe('Nouvelle question : Caution')
    expect(mail.text).toContain('Marie a posé une question (Voyageurs)')
    expect(mail.text).toContain('a'.repeat(600) + '…')
    expect(mail.text).not.toContain('a'.repeat(601))
  })
})
