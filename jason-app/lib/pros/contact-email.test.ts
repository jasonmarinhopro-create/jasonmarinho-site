import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { contactEmails, lireMessage, cleanPhone } = require('../../../scripts/lib/pro-contact-email.cjs')

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

describe('téléphone facultatif de la demande', () => {
  it('garde un numéro valable, écrit par paires en France', () => {
    expect(cleanPhone('0612345678')).toBe('06 12 34 56 78')
    expect(cleanPhone('06.12.34.56.78')).toBe('06 12 34 56 78')
    expect(cleanPhone('+33 6 12 34 56 78')).toBe('+33612345678')
  })
  it('ignore un numéro vide ou trop court', () => {
    expect(cleanPhone('')).toBe('')
    expect(cleanPhone('123')).toBe('')
    expect(cleanPhone(undefined)).toBe('')
  })
  it('le pro voit le numéro avec un lien pour appeler', () => {
    const base = { metier: 'photographe', proPrenom: 'Léa', proNom: 'Léa M.', proVille: 'Lyon', proSlug: 'lea', contactName: 'Sam', contactEmail: 'sam@example.com', message: 'Bonjour' }
    expect(contactEmails({ ...base, contactPhone: '06 12 34 56 78' }).pro.html).toContain('tel:0612345678')
    expect(contactEmails(base).pro.html).not.toContain('tel:')
    expect(contactEmails({ ...base, contactPhone: '06 12 34 56 78' }).hote.html).not.toContain('tel:')
  })
})
