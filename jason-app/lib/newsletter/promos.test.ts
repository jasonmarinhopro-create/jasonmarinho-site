import { describe, it, expect } from 'vitest'
import { promoPartner } from './promos'
import { PARTNER_OFFERS } from './template'

const sansLodgify = PARTNER_OFFERS.filter(p => p.name !== 'Lodgify')

describe('promoPartner', () => {
  it('rien avant le 1er novembre ni après le 12 décembre', () => {
    expect(promoPartner('2026-10-31', PARTNER_OFFERS)).toBeNull()
    expect(promoPartner('2026-12-13', PARTNER_OFFERS)).toBeNull()
  })
  it('annonce avant le 12 novembre, offre active ensuite', () => {
    expect(promoPartner('2026-11-03', PARTNER_OFFERS)?.offer).toContain('du 12 novembre au 12 décembre')
    expect(promoPartner('2026-11-12', PARTNER_OFFERS)?.offer).toContain('jusqu\'au 12 décembre')
    expect(promoPartner('2026-12-12', PARTNER_OFFERS)?.desc).toContain('JASON65')
  })
  it('garde le lien de la page partenaire', () => {
    expect(promoPartner('2026-11-20', PARTNER_OFFERS)?.url).toBe('https://jasonmarinho.com/partenaires/lodgify')
  })
  it('jamais dans une édition qui ne propose pas Lodgify', () => {
    expect(promoPartner('2026-11-20', sansLodgify)).toBeNull()
  })
})
