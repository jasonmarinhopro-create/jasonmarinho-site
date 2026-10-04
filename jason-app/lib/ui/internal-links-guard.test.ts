// Garde-fou (04/10/2026) : un <a href="/dashboard…"> recharge toute l'app
// (session, menu, cloche, parcours : 20 à 40 requêtes) au lieu de ne
// charger que la page. Constaté sur les fiches membres et pros de l'admin.
// Toujours <Link> de next/link pour une page du dashboard.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../..')
function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p)
    return p.endsWith('.tsx') ? [p] : []
  })
}

describe('liens internes du dashboard', () => {
  it('aucun <a href="/dashboard…"> (utiliser <Link>)', () => {
    const offenders = [...walk(path.join(ROOT, 'app/dashboard')), ...walk(path.join(ROOT, 'components'))]
      .filter(f => {
        // Ouverture dans un nouvel onglet (target="_blank") : <a> voulu
        const tags = fs.readFileSync(f, 'utf8').match(/<a\s+href=(\{`|"|\{')\/dashboard[^]*?>/g) ?? []
        return tags.some(tag => !tag.includes('target="_blank"'))
      })
      .map(f => path.relative(ROOT, f))
    expect(offenders).toEqual([])
  })
})
