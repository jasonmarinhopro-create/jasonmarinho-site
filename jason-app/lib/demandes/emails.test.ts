import { describe, it, expect } from 'vitest'
import { proEmail, hoteEmail, hoteManuelEmail, adminEmail, hoteMultiEmail, adminMultiEmail } from './emails'

const d = {
  metier: 'menage' as const, ville: 'Nantes', logement: 'Appartement T2', quand: 'Dès que possible', frequence: 'Entre deux voyageurs',
  budget: '50 à 80 €', message: 'Bonjour, <b>2 logements</b>\nlinge compris', nom: 'claire Martin', email: 'claire@example.com', telephone: '06 12 34 56 78',
}
const pros = [{ nom: 'Éclat Pro', ville: 'Nantes', url: 'https://jasonmarinho.com/annuaires/menage/eclat' }]
const all = () => [
  proEmail(d, { proPrenom: 'Léa', manuel: false, adequation: null, filtre: false, demandesUrl: 'https://app.jasonmarinho.com/x' }).html,
  hoteEmail(d, { pros, vague: 1, suiviUrl: 'https://jasonmarinho.com/ma-demande?t=a', sansProQui: 'd’équipe', guideUrl: 'g', partielNote: null, inscriptionUrl: 'https://i' }).html,
  hoteEmail(d, { pros: [], vague: 1, suiviUrl: null, sansProQui: 'd’équipe de ménage inscrite', guideUrl: 'https://g', partielNote: null, inscriptionUrl: 'https://i' }).html,
  hoteManuelEmail(d, pros[0], null).html,
  adminEmail(d, { etiquette: 'Nouvelle demande', title: 'Un hôte cherche', texte: 'Partie', pros: [], qgUrl: 'https://q' }),
]

describe('e-mails de la demande', () => {
  it('échappe le message et garde les retours à la ligne', () => {
    const html = all()[0]
    expect(html).not.toContain('<b>2 logements</b>')
    expect(html).toContain('&lt;b&gt;2 logements&lt;/b&gt;<br>linge compris')
  })
  it('bouton de réponse au prénom de l’hôte, téléphone cliquable', () => {
    const { html, subject } = proEmail(d, { proPrenom: 'Léa', manuel: true, adequation: null, filtre: false, demandesUrl: 'x' })
    expect(subject).toBe('Un hôte cherche une équipe de ménage à Nantes')
    expect(html).toContain('Répondre à Claire')
    expect(html).toContain('href="tel:0612345678"')
    expect(html).toContain('te transmet sa demande')
  })
  it('bouton « Je m’en occupe » et version texte', () => {
    const r = proEmail(d, { proPrenom: 'Léa', manuel: false, adequation: null, filtre: false, demandesUrl: 'x', priseUrl: 'https://app.example/demande/prise/abc' })
    expect(r.html).toContain('href="https://app.example/demande/prise/abc"')
    expect(r.html).toContain('Je m’en occupe')
    expect(r.text).toContain('Je m’en occupe : https://app.example/demande/prise/abc')
    expect(r.text).toContain('Claire')
  })
  it('jamais de tiret cadratin', () => {
    for (const h of all()) expect(h).not.toContain('—')
  })
  it('e-mail à Jason sans les coordonnées de l’hôte', () => {
    const h = all()[4]
    expect(h).not.toContain('claire@example.com')
    expect(h).not.toContain('06 12')
    expect(h).not.toContain('linge compris')
  })
  it('hôte : sans pro, guide si pas de suivi ; sujet au pluriel', () => {
    expect(all()[2]).toContain('https://g')
    expect(hoteEmail(d, { pros: [...pros, ...pros], vague: 1, suiviUrl: null, sansProQui: '', guideUrl: '', partielNote: null, inscriptionUrl: 'https://i' }).subject).toBe('Ta demande à Nantes est partie chez 2 pros')
  })
})

describe('e-mails d’une demande en plusieurs villes', () => {
  const d = { metier: 'photographe' as const, etablissement: 'conciergerie', ville: 'Annecy', logement: 'T4 et plus', quand: 'Au plus vite', frequence: 'Des photos', budget: null, message: null, nom: 'camille durand', email: 'c@exemple.fr', telephone: null }
  const villes = [
    { ville: 'Annecy', pros: [], suiviUrl: 'https://jasonmarinho.com/ma-demande?t=a' },
    { ville: 'Chambéry', pros: [{ nom: 'Studio Lac', ville: 'Chambéry', url: 'https://jasonmarinho.com/photographes/studio-lac' }], suiviUrl: 'https://jasonmarinho.com/ma-demande?t=b' },
  ]
  it('hôte : un seul e-mail, une partie par ville avec son lien de suivi', () => {
    const { subject, html } = hoteMultiEmail(d, villes, { inscriptionUrl: 'https://jasonmarinho.com/annuaires/photographes/inscription' })
    expect(subject).toBe('Ta demande dans 2 villes : Annecy, Chambéry')
    expect(html).toContain('Suivre la demande à Annecy')
    expect(html).toContain('Suivre la demande à Chambéry')
    expect(html).toContain('Studio Lac')
    expect(html).toContain('En file d’attente')
    expect(html).not.toMatch(/undefined|null|NaN|—/)
  })
  it('Jason : l’état de chaque ville, sans les coordonnées de l’hôte', () => {
    const html = adminMultiEmail(d, [{ ville: 'Annecy', pros: [], qgUrl: 'https://app.jasonmarinho.com/q/1' }, { ville: 'Chambéry', pros: ['Studio Lac'], qgUrl: 'https://app.jasonmarinho.com/q/2' }])
    expect(html).toContain('sans pro, à transmettre')
    expect(html).toContain('envoyée à Studio Lac')
    expect(html).not.toContain('c@exemple.fr')
    expect(html).not.toMatch(/undefined|NaN/)
  })
})
