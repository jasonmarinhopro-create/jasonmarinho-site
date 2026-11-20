import { describe, it, expect, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/service', () => ({ getServiceClient: () => null }))
vi.mock('@/lib/logger', () => ({ logger: () => ({ info() {}, warn() {}, error() {} }) }))
import { emailCatalogue } from './catalogue'

describe('aperçu des e-mails (admin)', () => {
  it('chaque e-mail se prépare, sans tiret cadratin ni emoji, identifiants uniques', () => {
    const items = emailCatalogue()
    expect(items.length).toBeGreaterThan(20)
    expect(new Set(items.map(i => i.id)).size).toBe(items.length)
    for (const it of items) {
      const m = it.render()
      expect(m.subject.length, it.id).toBeGreaterThan(5)
      expect(m.html, it.id).toContain('</html>')
      expect(m.html + m.subject, it.id).not.toMatch(/—|\p{Extended_Pictographic}/u)
    }
  })
})
