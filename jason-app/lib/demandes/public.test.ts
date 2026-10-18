import { describe, it, expect } from 'vitest'
import { cartePro, photoDuPro, apercuPhrase, suiviVue, isSuiviToken, initiales, type SuiviRow } from './public'

const UUID = '11111111-2222-3333-4444-555555555555'
const PID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

describe('photoDuPro', () => {
  it('prend la vignette de la première photo récente, sinon le logo', () => {
    expect(photoDuPro({ portfolio_photos: [`${PID}/v2-${UUID}.jpg`] }, 'https://x.supabase.co'))
      .toBe(`https://x.supabase.co/storage/v1/object/public/pro-portfolio/${PID}/v2-${UUID}-t.jpg`)
    expect(photoDuPro({ portfolio_photos: ['ancienne.jpg'], logo_url: 'https://cdn.example/logo.png' }, 'https://x.supabase.co')).toBe('https://cdn.example/logo.png')
    expect(photoDuPro({ portfolio_photos: null, logo_url: 'javascript:alert(1)' }, 'https://x.supabase.co')).toBeNull()
  })
})

describe('cartePro', () => {
  const base = { id: '1', slug: 'camille', full_name: 'Camille Martin', pseudo: null, ville: 'Lyon', zone_couverte: null }
  it('nom, métier, lien de la fiche et adéquation', () => {
    const c = cartePro({ ...base, metier: 'photo', options: [] }, 'photographe', 'Une vidéo avec vues au drone', '')
    expect(c.nom).toBe('Camille Martin')
    expect(c.initiales).toBe('CM')
    expect(c.metier).toBe('Photographe')
    expect(c.href).toBe('https://jasonmarinho.com/annuaires/photographes/camille')
    expect(c.adequation).toBe(0)
    expect(cartePro({ ...base, metier: 'photo_video', options: ['drone'] }, 'photographe', 'Une vidéo avec vues au drone', '').adequation).toBe(2)
    expect(cartePro(base, 'menage', null, '').href).toBe('https://jasonmarinho.com/annuaires/menage/camille')
  })
  it('initiales sans chiffres ni signes', () => {
    expect(initiales('Éclat Ménage Bordeaux')).toBe('ÉM')
    expect(initiales('')).toBe('?')
  })
})

describe('apercuPhrase', () => {
  it('dit la vérité quand personne ne travaille dans la zone', () => {
    expect(apercuPhrase('photographe', 0, 'Rennes', 'Une vidéo')).toContain('Pas encore de vidéaste inscrit près de Rennes')
    expect(apercuPhrase('menage', 0, 'Pau', null)).toContain('équipe de ménage inscrite')
    expect(apercuPhrase('photographe', 3, 'Lyon', 'Des photos')).toBe('3 photographes de l’annuaire recevront ta demande.')
  })
})

describe('suiviVue', () => {
  const now = new Date('2026-10-20T10:00:00Z')
  const row: SuiviRow = {
    metier: 'photographe', ville: 'Lyon', logement: 'T2 ou T3', quand: 'Au plus vite', frequence: 'Des photos', budget: null,
    nom: 'Marie Durand', status: 'envoyee', created_at: '2026-10-19T10:00:00Z', last_round_at: '2026-10-19T10:00:00Z',
    sent_to: [{ id: 'p1', contact_id: 'c1', round: 1 }, { id: 'p2', contact_id: 'c2', round: 1 }],
  }
  const fiches = new Map([['p1', { nom: 'Camille', initiales: 'C', photo: null, metier: 'Photographe', ville: 'Lyon', href: 'x' }]])

  it('envoyée : relais 48 h après la dernière vague, fiche disparue affichée sans nom', () => {
    const v = suiviVue(row, new Map(), fiches, now)
    expect(v.etat).toBe('envoyee')
    expect(v.relais).toBe('2026-10-21T10:00:00.000Z')
    expect(v.pros[1].nom).toBe('Pro de l’annuaire')
    expect(v.prenom).toBe('Marie')
    expect(v.besoin.map(b => b[0])).toEqual(['Ville', 'Logement', 'Prestation', 'Quand'])
  })
  it('prise en main : plus de relais annoncé', () => {
    const v = suiviVue(row, new Map([['c1', 'repondue']]), fiches, now)
    expect(v.etat).toBe('prise_en_main')
    expect(v.relais).toBeNull()
    expect(v.pros[0].priseEnMain).toBe(true)
  })
  it('sans pro, puis terminée au-delà de 30 jours ; fermée par l’hôte', () => {
    const sp = { ...row, status: 'sans_pro' as const, sent_to: [] }
    expect(suiviVue(sp, new Map(), fiches, now).etat).toBe('sans_pro')
    expect(suiviVue(sp, new Map(), fiches, new Date('2026-12-01T00:00:00Z')).etat).toBe('terminee')
    expect(suiviVue({ ...row, status: 'close', host_closed_at: now.toISOString() }, new Map(), fiches, now).titre).toBe('Demande fermée')
  })
})

describe('isSuiviToken', () => {
  it('32 caractères hexadécimaux seulement', () => {
    expect(isSuiviToken('a'.repeat(32))).toBe(true)
    expect(isSuiviToken('A'.repeat(32))).toBe(false)
    expect(isSuiviToken("' or 1=1")).toBe(false)
  })
})
