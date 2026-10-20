import { describe, it, expect } from 'vitest'
import { proEmail, hoteEmail, hoteManuelEmail, adminEmail } from './emails'

const d = {
  metier: 'menage' as const, ville: 'Nantes', logement: 'Appartement T2', quand: 'Dès que possible', frequence: 'Entre deux voyageurs',
  budget: '50 à 80 €', message: 'Bonjour, <b>2 logements</b>\nlinge compris', nom: 'claire Martin', email: 'claire@example.com', telephone: '06 12 34 56 78',
}
const pros = [{ nom: 'Éclat Pro', ville: 'Nantes', url: 'https://jasonmarinho.com/annuaires/menage/eclat' }]
const all = () => [
  proEmail(d, { proPrenom: 'Léa', manuel: false, adequation: null, filtre: false, demandesUrl: 'https://app.jasonmarinho.com/x' }).html,
  hoteEmail(d, { pros, vague: 1, suiviUrl: 'https://jasonmarinho.com/ma-demande?t=a', sansProQui: 'd’équipe', guideUrl: 'g', partielNote: null }).html,
  hoteEmail(d, { pros: [], vague: 1, suiviUrl: null, sansProQui: 'd’équipe de ménage inscrite', guideUrl: 'https://g', partielNote: null }).html,
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
    expect(hoteEmail(d, { pros: [...pros, ...pros], vague: 1, suiviUrl: null, sansProQui: '', guideUrl: '', partielNote: null }).subject).toBe('Ta demande à Nantes est partie chez 2 pros')
  })
})
