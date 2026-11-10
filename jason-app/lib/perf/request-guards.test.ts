// Garde-fous des fondations Supabase (10/11/2026, docs/claude/technique.md,
// « Fondations Supabase »). Chaque règle vient d'une lenteur mesurée.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../..')
function walk(dir: string, ext: string[]): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p, ext)
    return ext.some(x => p.endsWith(x)) ? [p] : []
  })
}
const rel = (f: string) => path.relative(ROOT, f)

describe('pages admin', () => {
  const pages = walk(path.join(ROOT, 'app/dashboard/admin'), ['page.tsx'])

  it('aucune page admin ne refait getUser() (requireAdmin ou getProfile, déjà lus par le layout)', () => {
    // getUser() = un aller-retour vers le serveur d'authentification, 4 à 8 s
    // mesurés quand la base est chargée, en plus de la lecture du layout
    const offenders = pages.filter(f => /auth\.getUser\(\)/.test(fs.readFileSync(f, 'utf8'))).map(rel)
    expect(offenders).toEqual([])
  })

  it('chaque page admin vérifie le rôle côté serveur', () => {
    const offenders = pages.filter(f => {
      const s = fs.readFileSync(f, 'utf8')
      // Page qui ne fait que rediriger : rien à protéger
      if (/^\s*redirect\(/m.test(s) && !/getServiceClient|createClient|load[A-Z]/.test(s)) return false
      return !(/requireAdmin\(\)/.test(s) || /role !== 'admin'/.test(s))
    }).map(rel)
    expect(offenders).toEqual([])
  })
})

describe('pages du dashboard', () => {
  it('aucune page ni layout du dashboard ne refait getUser() (getAuthIdentity ou getProfile)', () => {
    // Même raison que pour l'admin : le layout a déjà vérifié la session
    const files = [...walk(path.join(ROOT, 'app/dashboard'), ['page.tsx', 'layout.tsx'])]
    const offenders = files.filter(f => /auth\.getUser\(\)/.test(fs.readFileSync(f, 'utf8'))).map(rel)
    expect(offenders).toEqual([])
  })
})

describe('préchargement des liens', () => {
  it('tout <Link> vers une adresse à paramètres porte prefetch={false}', () => {
    // Next 14 calcule la page entière pour précharger une adresse à « ? » :
    // une visite de Provenance lançait 9 rendus complets (10/11/2026)
    const files = [...walk(path.join(ROOT, 'app'), ['.tsx']), ...walk(path.join(ROOT, 'components'), ['.tsx'])]
    const offenders: string[] = []
    for (const f of files) {
      const s = fs.readFileSync(f, 'utf8')
      const tags = s.match(/<Link\b[^>]*?>/g) ?? []
      for (const tag of tags) {
        const href = tag.match(/href=(\{`[^`]*`\}|"[^"]*"|\{'[^']*'\})/)?.[1] ?? ''
        if (href.includes('?') && !/prefetch=\{false\}/.test(tag)) offenders.push(`${rel(f)} : ${href.slice(0, 60)}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
