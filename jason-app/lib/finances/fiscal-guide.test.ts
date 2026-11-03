import { describe, it, expect } from 'vitest'
import { FISCAL_RULES, OFFICIAL_HOSTS, fiscalRule } from './fiscal-guide'

describe('repères fiscaux', () => {
  it('chaque règle cite une source officielle', () => {
    for (const r of FISCAL_RULES) {
      const host = new URL(r.source.url).hostname
      expect(OFFICIAL_HOSTS, `${r.key} : ${host}`).toContain(host)
      expect(r.source.label.length).toBeGreaterThan(5)
    }
  })
  it('clés uniques, sans tiret cadratin', () => {
    expect(new Set(FISCAL_RULES.map(r => r.key)).size).toBe(FISCAL_RULES.length)
    for (const r of FISCAL_RULES) expect(`${r.title} ${r.text}`).not.toContain('—')
    expect(fiscalRule('credit').title).toMatch(/intérêts/)
  })
})
