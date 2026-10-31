import { describe, expect, it } from 'vitest'
import { KINDS, METIERS, SPECIALITES_DEPANNAGE, isProKind, metierParSlug } from './metiers'
import * as site from '../../../scripts/lib/metiers.mjs'

describe('registre des métiers', () => {
  it('le site et l’espace décrivent les mêmes métiers', () => {
    for (const k of KINDS) {
      const a = METIERS[k], b = site.METIERS[k]
      expect(b, k).toBeTruthy()
      for (const champ of ['kind', 'slug', 'table', 'contactsTable', 'idColumn', 'nom', 'pro', 'pros', 'annuaire', 'ouvert'] as const) {
        expect(b[champ], `${k}.${champ}`).toEqual(a[champ])
      }
      expect(a.pageVille('lyon')).toBe('/' + b.villePrefixe + 'lyon')
    }
    expect(Object.keys(site.METIERS).sort()).toEqual([...KINDS].sort())
    expect(site.SPECIALITES_DEPANNAGE).toEqual(SPECIALITES_DEPANNAGE.map(x => ({ ...x })))
  })

  it('inscription du site ouverte ou fermée comme le registre (dépannage)', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../../../scripts/api-pro/depannage/signup.cjs', import.meta.url), 'utf8')
    const m = src.match(/const OUVERT = (true|false)/)
    expect(m?.[1]).toBe(String(METIERS.depannage.ouvert))
  })

  it('le routeur des pros du site connaît chaque métier', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(new URL('../../../api/pro/[kind]/[action].js', import.meta.url), 'utf8')
    for (const k of KINDS) expect(src, k).toContain(`scripts/api-pro/${k}/signup.cjs`)
  })

  it('slugs et tables uniques', () => {
    const vals = KINDS.map(k => METIERS[k])
    expect(new Set(vals.map(m => m.slug)).size).toBe(vals.length)
    expect(new Set(vals.map(m => m.table)).size).toBe(vals.length)
  })

  it('recherche par slug et garde de type', () => {
    expect(metierParSlug('menage')?.kind).toBe('cleaner')
    expect(metierParSlug('inconnu')).toBeNull()
    expect(isProKind('depannage')).toBe(true)
    expect(isProKind('plombier')).toBe(false)
  })

  it('aucun tiret cadratin dans les libellés', () => {
    const txt = KINDS.flatMap(k => [METIERS[k].nom, METIERS[k].pro, METIERS[k].pros, METIERS[k].leMetier])
    expect(txt.some(t => t.includes('—'))).toBe(false)
  })
})
