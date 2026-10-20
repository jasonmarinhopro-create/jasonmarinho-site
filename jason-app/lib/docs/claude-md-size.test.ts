import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// CLAUDE.md est chargé dans chaque session, routines comprises : au-delà, la routine
// Actualités (contexte plus court) n'a plus la place de travailler (incident du 20/10/2026).
const ROOT = join(__dirname, '..', '..', '..')

describe('CLAUDE.md reste un index court', () => {
  const md = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')
  it('moins de 25 Ko', () => {
    expect(Buffer.byteLength(md)).toBeLessThan(25_000)
  })
  it('chaque fichier cité dans docs/claude existe', () => {
    for (const f of md.match(/`[a-z-]+\.md`/g) ?? []) {
      const name = f.slice(1, -1)
      if (name === 'CONSIGNES.md') continue
      const inDocs = existsSync(join(ROOT, 'docs', 'claude', name))
      const elsewhere = existsSync(join(ROOT, 'docs', name))
      expect(inDocs || elsewhere, name).toBe(true)
    }
  })
})
