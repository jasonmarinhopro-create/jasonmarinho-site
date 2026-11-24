import { describe, it, expect } from 'vitest'
import { toAdminPro, filterPros, sortPros, prosKpis, buildDemandes, buildActivity } from './admin-list'

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

describe('paiements à finaliser à part', () => {
  const list = [
    toAdminPro('cleaner', { ...base, id: 'p', status: 'pending_payment', stripe_subscription_status: 'incomplete', created_at: new Date().toISOString() }),
    toAdminPro('cleaner', { ...base, id: 'a' }),
  ]
  it('absents de la vue par défaut et des chiffres, visibles avec leur filtre', () => {
    expect(filterPros(list, { kind: 'tous', filtre: 'tous', q: '' }).map(p => p.id)).toEqual(['a'])
    expect(filterPros(list, { kind: 'tous', filtre: 'pending_payment', q: '' }).map(p => p.id)).toEqual(['p'])
    const k = prosKpis(list, 'tous')
    expect(k.total).toBe(1)
    expect(k.aFinaliser).toBe(1)
    expect(k.fondateurs).toBe(1)
  })
  it('une inscription Fondateur de moins de 7 jours garde sa place', () => {
    const k = prosKpis(list, 'tous')
    expect(k.placesFondateur.cleaner).toBe(2)
    expect(k.placesEnAttente).toBe(1)
  })
})

describe('demandes et activité', () => {
  it('sépare la fiche et Trouver un pro', () => {
    const d = buildDemandes([
      { created_at: '2026-11-01T00:00:00Z', source_url: 'https://jasonmarinho.com/trouver-un-pro?metier=menage', status: 'nouvelle' },
      { created_at: '2026-11-03T00:00:00Z', source_url: 'https://jasonmarinho.com/annuaires/menage/x', status: 'traitee' },
      { created_at: '2026-10-01T00:00:00Z', source_url: null, status: null },
    ])
    expect(d).toEqual({ fiche: 2, trouver: 1, enAttente: 2, derniere: '2026-11-03T00:00:00Z' })
  })
  it('garde la date la plus récente par libellé, du plus récent au plus ancien', () => {
    expect(buildActivity([
      { label: 'Devis', at: '2026-10-01T00:00:00Z' },
      { label: 'Devis', at: '2026-11-01T00:00:00Z' },
      { label: 'Visite', at: '2026-11-20T00:00:00Z' },
      { label: 'Client', at: null },
    ])).toEqual([{ label: 'Visite', at: '2026-11-20T00:00:00Z' }, { label: 'Devis', at: '2026-11-01T00:00:00Z' }])
  })
})
