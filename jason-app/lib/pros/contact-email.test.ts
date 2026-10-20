import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { contactEmails, lireMessage } = require('../../../scripts/lib/pro-contact-email.cjs')

const o = { metier: 'menage', proPrenom: 'Léa', proNom: 'Clean & Co', proVille: 'Nantes', proSlug: 'clean', contactName: 'claire Martin', contactEmail: 'claire@x.fr',
  message: 'Ce qu’il me faut : Entre deux voyageurs\nLogement : Appartement\n\n<b>Bonjour</b>' }

describe('e-mails du bouton Contacter des fiches', () => {
  it('lit les lignes du formulaire guidé', () => {
    expect(lireMessage(o.message)).toEqual({ rows: [['Besoin', 'Entre deux voyageurs'], ['Logement', 'Appartement']], texte: '<b>Bonjour</b>' })
    expect(lireMessage('Bonjour : je cherche').rows).toEqual([])
  })
  it('échappe, prénom en majuscule, pas de tiret cadratin', () => {
    const m = contactEmails(o)
    expect(m.pro.subject).toBe('Claire veut te contacter via ta fiche')
    expect(m.pro.html).toContain('Répondre à Claire')
    expect(m.pro.html).not.toContain('<b>Bonjour</b>')
    expect(m.hote.html).toContain('/annuaires/menage/clean')
    for (const h of [m.pro.html, m.hote.html]) expect(h).not.toContain('—')
  })
})
