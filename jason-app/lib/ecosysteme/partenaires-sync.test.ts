import { describe, expect, it } from 'vitest'
import { OUTILS, CATEGORIES } from '../../../scripts/data/partenaires.mjs'
import { PARTNERS, PARTNER_CATEGORIES, PARTNER_OFFERS } from './partenaires'

// La copie JSON du dashboard doit suivre la source du site : sinon lancer
// `node scripts/build-partenaires.mjs` depuis la racine du dépôt.
describe('catalogue partenaires du dashboard', () => {
  it('est synchronisé avec scripts/data/partenaires.mjs', () => {
    expect(PARTNERS.map(p => p.nom)).toEqual((OUTILS as Array<{ nom: string }>).map(o => o.nom))
    expect(PARTNER_CATEGORIES.map(c => c.id)).toEqual((CATEGORIES as Array<{ id: string }>).map(c => c.id))
  })

  it('garde des liens absolus et signale les liens rémunérés', () => {
    for (const p of PARTNERS) for (const l of p.liens) expect(l.href).toMatch(/^https:\/\//)
    for (const o of PARTNER_OFFERS.filter(p => p.badge === 'affilie' || p.badge === 'parrainage')) {
      expect(o.liens.some(l => l.sponsored)).toBe(true)
    }
  })
})
