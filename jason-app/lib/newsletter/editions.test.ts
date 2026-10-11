import { describe, it, expect } from 'vitest'
import { assignEditions, editionOfAccount, EDITION_CONFIG, EDITIONS } from './editions'
import { buildNewsletter } from './build'

const acc = (email: string, o: Partial<{ isInvestor: boolean; isAdmin: boolean; photographer: boolean; cleaner: boolean }> = {}) =>
  ({ email, isInvestor: false, isAdmin: false, photographer: false, cleaner: false, ...o })

describe('éditions de la lettre', () => {
  it('un compte, une édition : photographe, puis ménage, puis investisseur, puis hôte', () => {
    expect(editionOfAccount({ photographer: true, cleaner: true, isInvestor: true })).toBe('photographe')
    expect(editionOfAccount({ photographer: false, cleaner: true, isInvestor: true })).toBe('menage')
    expect(editionOfAccount({ photographer: false, cleaner: false, isInvestor: true })).toBe('investisseur')
    expect(editionOfAccount({ photographer: false, cleaner: false, isInvestor: false })).toBe('hote')
  })

  it('répartit les inscrits et ajoute les pros clients, sans désinscrits ni admin', () => {
    const r = assignEditions({
      subscribers: ['Hote@x.fr', 'inv@x.fr', 'photo@x.fr', 'inconnu@x.fr', 'stop@x.fr', 'admin@x.fr'],
      accounts: [acc('hote@x.fr'), acc('inv@x.fr', { isInvestor: true }), acc('photo@x.fr', { photographer: true }), acc('admin@x.fr', { isAdmin: true, photographer: true })],
      proClients: [{ email: 'menage@x.fr', metier: 'menage' }, { email: 'photo@x.fr', metier: 'photographe' }, { email: 'stop@x.fr', metier: 'menage' }, { email: 'both@x.fr', metier: 'menage' }, { email: 'both@x.fr', metier: 'photographe' }],
      suppressed: new Set(['STOP@x.fr']),
    })
    expect(r.hote.sort()).toEqual(['admin@x.fr', 'hote@x.fr', 'inconnu@x.fr'])
    expect(r.investisseur).toEqual(['inv@x.fr'])
    expect(r.photographe.sort()).toEqual(['both@x.fr', 'photo@x.fr'])
    expect(r.menage).toEqual(['menage@x.fr'])
    // Personne dans deux éditions
    const all = EDITIONS.flatMap(e => r[e])
    expect(new Set(all).size).toBe(all.length)
  })

  it('chaque édition a son contenu : outils, offres, question, lien vers son espace', () => {
    const actus = [
      { id: 'a', title: 'Airbnb change sa commission', summary: 'Résumé.', category: 'plateformes', source_url: null, published_at: null },
      { id: 'b', title: 'Nouvelle règle à Lyon', summary: 'Résumé.', category: 'reglementation', source_url: null, published_at: null },
      { id: 'c', title: 'Taxe de séjour 2027', summary: 'Résumé.', category: 'fiscalite', source_url: null, published_at: null },
    ]
    const articles = [
      { title: 'Devenir prestataire ménage', link: 'https://jasonmarinho.com/blog/menage', description: 'Le ménage en LCD', pubDate: '' },
      { title: 'Acheter pour louer', link: 'https://jasonmarinho.com/blog/achat', description: 'Rentabilité', pubDate: '' },
    ]
    const changes = [
      { title: 'Devis pour les pros', description: 'Les photographes et équipes de ménage font leurs devis.', date: '' },
      { title: 'Contrat plus complet', description: 'Pour les hôtes.', date: '' },
    ]
    const build = (edition: 'hote' | 'investisseur' | 'photographe' | 'menage') => buildNewsletter({ parisDate: '2026-11-02', actus, articles, changes, edition })!
    const hote = build('hote'), inv = build('investisseur'), photo = build('photographe'), menage = build('menage')
    expect(hote.html).toContain('La lettre des hôtes')
    expect(inv.html).toContain(EDITION_CONFIG.investisseur.tagline)
    expect(inv.html).toContain('dashboard/investir')
    // La une de l'édition investisseur vient des catégories qui la concernent
    expect(inv.subject).toBe('Nouvelle règle à Lyon')
    expect(photo.html).toContain('ma-fiche-photographe')
    expect(photo.html).toContain('utm_campaign=lettre-2026-11-photographe')
    expect(photo.html).not.toContain('Contrat plus complet')
    expect(photo.html).toContain('Devis pour les pros')
    expect(menage.html).toContain('Devenir prestataire ménage')
    expect(menage.html).toContain('ma-fiche-menage')
    expect(menage.html).toContain('annuaire des équipes de ménage')
    for (const n of [hote, inv, photo, menage]) {
      expect(n.html).toContain('signature-jason.jpg')
      expect(n.html).toContain('{{ unsubscribe }}')
    }
  })
})
