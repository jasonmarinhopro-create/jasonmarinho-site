import { describe, expect, it } from 'vitest'
import { orFilter, parseQuery, phoneVariants, reportIdentifiers, verdictOf, voyageurIdentifiers, isPositive, ALL_INCIDENT_TYPES } from './identifiers'

describe('parseQuery', () => {
  it('reconnaît un e-mail et le met en minuscules', () => {
    expect(parseQuery('  Marie.Dupont@Gmail.com ')).toEqual({ ok: true, kind: 'email', values: ['marie.dupont@gmail.com'], label: 'marie.dupont@gmail.com' })
  })
  it('refuse un e-mail incomplet', () => {
    expect(parseQuery('marie@gmail').ok).toBe(false)
  })
  it('retrouve un numéro français sous toutes ses formes', () => {
    const p = parseQuery('06 12 34 56 78')
    expect(p.ok && p.kind).toBe('phone')
    if (p.ok) expect(p.values).toEqual(expect.arrayContaining(['+33612345678', '0612345678', '33612345678']))
  })
  it('accepte le format international', () => {
    const p = parseQuery('+33 6 12 34 56 78')
    if (!p.ok) throw new Error('attendu ok')
    expect(p.values).toContain('0612345678')
  })
  it('refuse un numéro trop court', () => {
    expect(parseQuery('06 12').ok).toBe(false)
  })
  it('exige prénom et nom pour une recherche par nom', () => {
    expect(parseQuery('mar').ok).toBe(false)
    expect(parseQuery('Marie').ok).toBe(false)
    const p = parseQuery('Marie Dupont')
    if (!p.ok) throw new Error('attendu ok')
    expect(p.kind).toBe('name')
    expect(p.values).toEqual(['marie dupont', 'dupont marie'])
  })
  it('nettoie les caractères spéciaux d\'un nom', () => {
    const p = parseQuery('Jean-Luc  O\'Neil%,()')
    if (!p.ok) throw new Error('attendu ok')
    expect(p.label).toBe("Jean-Luc O'Neil")
  })
})

describe('phoneVariants', () => {
  it('garde un numéro étranger', () => {
    expect(phoneVariants('+351 912 345 678')).toEqual(['+351912345678', '351912345678'])
  })
  it('vide si rien', () => {
    expect(phoneVariants('')).toEqual([])
  })
})

describe('voyageurIdentifiers', () => {
  it('inclut e-mail normalisé, formes du téléphone et saisie brute', () => {
    const ids = voyageurIdentifiers({ email: 'A@B.fr', telephone: '06 12 34 56 78' })
    expect(ids).toEqual(expect.arrayContaining(['a@b.fr', '+33612345678', '0612345678', '06 12 34 56 78']))
  })
})

describe('reportIdentifiers', () => {
  it('garde le téléphone en plus de l\'e-mail', () => {
    expect(reportIdentifiers({ email: 'x@y.fr', phone: '0612345678', full_name: 'Marie Dupont' })).toEqual({
      identifier: 'x@y.fr', identifier_type: 'email', extra: ['+33612345678'], name: 'Marie Dupont',
    })
  })
  it('téléphone seul', () => {
    expect(reportIdentifiers({ phone: '06.12.34.56.78' })?.identifier).toBe('+33612345678')
  })
  it('nom seul', () => {
    expect(reportIdentifiers({ full_name: ' Marie  Dupont ' })).toMatchObject({ identifier: 'Marie Dupont', identifier_type: 'name' })
  })
  it('rien', () => {
    expect(reportIdentifiers({})).toBeNull()
  })
})

describe('verdictOf', () => {
  it('lit le nombre de signalements négatifs', () => {
    expect(verdictOf(0, 0)).toBe('aucun')
    expect(verdictOf(0, 2)).toBe('positif')
    expect(verdictOf(1, 5)).toBe('vigilance')
    expect(verdictOf(3, 0)).toBe('risque')
    expect(verdictOf(4, 0)).toBe('eleve')
  })
})

describe('orFilter', () => {
  it('cherche aussi dans les identifiants secondaires', () => {
    expect(orFilter(['+33612345678', '0612345678'], 'phone', true))
      .toBe('identifier.in.("+33612345678","0612345678"),extra_identifiers.ov.{"+33612345678","0612345678"}')
  })
  it('sans la colonne secondaire', () => {
    expect(orFilter(['a@b.fr'], 'email', false)).toBe('identifier.in.("a@b.fr")')
  })
  it('nom : correspondance exacte insensible à la casse, sans jokers', () => {
    expect(orFilter(['marie dupont'], 'name', true))
      .toBe('identifier.in.("marie dupont"),identifier.ilike."marie dupont",name.ilike."marie dupont"')
  })
})

describe('motifs', () => {
  it('sépare positifs et négatifs', () => {
    expect(isPositive('Voyageur exemplaire')).toBe(true)
    expect(ALL_INCIDENT_TYPES.some(isPositive)).toBe(false)
  })
})
