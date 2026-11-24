import { describe, it, expect } from 'vitest'
import { toAdminPro, filterPros, sortPros, prosKpis } from './admin-list'

const base = { id: '1', full_name: 'Camille Durand', pseudo: null, email: 'c@x.fr', ville: 'Lyon', villes_couvertes: ['lyon', 'villeurbanne'], tier: 'fondateur', status: 'active', slug: 'camille', created_at: '2026-10-01T10:00:00Z', views_count: 40, contacts_count: 3, instagram_clicks_count: 2, stripe_subscription_status: 'active' }

describe('toAdminPro', () => {
  it('ramène une fiche payée à la forme commune', () => {
    const p = toAdminPro('photographer', { ...base, metier: 'photo', tarif_min: 150, tarif_max: 300, portfolio_clicks_count: 5, portfolio_photos: ['a.jpg'] })
    expect(p.etat).toBe('active')
    expect(p.paid).toBe(true)
    expect(p.annual).toBeCloseTo(39.98)
    expect(p.villes).toBe(2)
    expect(p.clicks).toBe(7)
    expect(p.photo).toBe('a.jpg')
    expect(p.tarif).toBe('150 € à 300 €')
  })
  it('une fiche active jamais payée passe en paiement à finaliser', () => {
    const p = toAdminPro('cleaner', { ...base, stripe_subscription_status: 'incomplete', tarif_heure: 25 })
    expect(p.etat).toBe('pending_payment')
    expect(p.unpaid).toBe(true)
    expect(p.annual).toBe(0)
    expect(p.tarif).toBe('25 € de l’heure')
  })
  it('dépannage : libellés des spécialités', () => {
    const p = toAdminPro('depannage', { ...base, specialites: ['plomberie', 'inconnu'] })
    expect(p.detail).toBe('Plomberie, inconnu')
  })
})

describe('filtres, tri et chiffres', () => {
  const list = [
    toAdminPro('photographer', { ...base, id: 'a', views_count: 10 }),
    toAdminPro('cleaner', { ...base, id: 'b', full_name: 'Bruno', ville: 'Nice', tier: 'standard', status: 'hidden', views_count: 99, created_at: '2026-11-01T10:00:00Z' }),
    toAdminPro('cleaner', { ...base, id: 'c', status: 'cancelled', stripe_subscription_status: 'canceled' }),
  ]
  it('filtre par métier, état et recherche', () => {
    expect(filterPros(list, { kind: 'cleaner', filtre: 'tous', q: '' }).map(p => p.id)).toEqual(['b', 'c'])
    expect(filterPros(list, { kind: 'tous', filtre: 'hidden', q: '' }).map(p => p.id)).toEqual(['b'])
    expect(filterPros(list, { kind: 'tous', filtre: 'fondateur', q: '' }).map(p => p.id)).toEqual(['a'])
    expect(filterPros(list, { kind: 'tous', filtre: 'tous', q: 'nice' }).map(p => p.id)).toEqual(['b'])
  })
  it('trie par vues puis par date', () => {
    expect(sortPros(list, 'vues')[0].id).toBe('b')
    expect(sortPros(list, 'recent')[0].id).toBe('b')
  })
  it('compte les places Fondateur par métier, résiliées exclues', () => {
    const k = prosKpis(list, 'tous')
    expect(k.placesFondateur).toEqual({ photographer: 1, cleaner: 0, depannage: 0 })
    expect(k.enLigne).toBe(1)
    expect(k.masquees).toBe(1)
    expect(k.resiliees).toBe(1)
  })
})
