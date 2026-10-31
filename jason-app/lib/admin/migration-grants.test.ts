import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// 31/10/2026 : les tables du dépannage (migration 170) n'avaient reçu aucun
// droit : le projet Supabase ne les donne plus d'office aux nouvelles tables.
// Build du site en échec (« permission denied for view public_depannage_view »),
// client service sans accès. Toute table ou vue créée à partir de la
// migration 170 doit recevoir ses droits (au moins service_role) dans une migration.
const DIR = join(__dirname, '../../supabase/migrations')
const DEPUIS = '20261031_170'

describe('droits des nouvelles tables (migrations)', () => {
  it('chaque table ou vue créée depuis la migration 170 a un grant pour service_role', () => {
    const files = readdirSync(DIR).filter(f => f.endsWith('.sql')).sort()
    const all = files.map(f => readFileSync(join(DIR, f), 'utf8')).join('\n')
    const recentes = files.filter(f => f >= DEPUIS).map(f => readFileSync(join(DIR, f), 'utf8')).join('\n')
    const crees = [...recentes.matchAll(/create\s+(?:or\s+replace\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?public\.(\w+)/gi)].map(m => m[1])
    const sansDroit = [...new Set(crees)].filter(t => !new RegExp(`grant[^;]*\\bon\\s+(?:table\\s+)?public\\.${t}\\b[^;]*\\bservice_role\\b`, 'i').test(all))
    expect(sansDroit).toEqual([])
  })
})
