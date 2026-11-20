// Garde-fous du gabarit commun et des e-mails purs (20/11/2026).
import { describe, it, expect } from 'vitest'
import { buildEmail, emailStats, formatPct, htmlToText, lightify, JASON_PHOTO_URL } from './template'
import { confirmationEmail, resetPasswordEmail } from './auth-emails'
import { contractFrom, contractInviteEmail, contractSignedGuestEmail, contractSignedHostEmail, depositOpenEmailContent, paymentReminderEmail, signDateLabel } from './contract-emails'
import { mentionEmail, paiementReceivedEmail } from './host'

const forbidden = (html: string) => {
  expect(html).not.toMatch(/—/)
  expect(html).not.toMatch(/\p{Extended_Pictographic}/u)
  // Plus aucune couleur de l'ancien thème sombre ni variable CSS (ignorées par les messageries)
  expect(html).not.toMatch(/#0d1f1a|#132b22|#e8ede8|#a5c4b0|var\(--/i)
}

const payments = { payUrl: 'https://app/pay', loyer: '450,00', depositUrl: null, caution: '300,00', depositLater: '12 décembre' }

describe('gabarit commun', () => {
  it('étiquette, titre, signature avec photo, pied', () => {
    const html = buildEmail({ title: 'Titre', body: '<p>x</p>', etiquette: 'Ta fiche', signature: true })
    expect(html).toContain('Ta fiche')
    expect(html).toContain(JASON_PHOTO_URL)
    expect(html).toContain('Fondateur de jasonmarinho.com')
    expect(html).toContain('app.jasonmarinho.com')
  })
  it('sans signature par défaut', () => {
    expect(buildEmail({ title: 'T', body: '' })).not.toContain(JASON_PHOTO_URL)
  })
  it('lightify ne touche pas le jaune de la marque hors ancien thème', () => {
    expect(lightify('<div style="background:#FFD56B">')).toContain('#FFD56B')
    expect(lightify('<div style="color:#e8ede8;background:#FFD56B">')).not.toContain('#FFD56B')
  })
  it('évolutions', () => {
    expect(formatPct(12.4).text).toBe('+12 %')
    expect(formatPct(-7.6).text).toBe('-8 %')
    expect(formatPct(0.2).text).toBe('=')
    expect(emailStats([{ label: 'A', value: '1', pct: 10 }, { label: 'B', value: '2', pct: null }])).toContain('+10 %')
  })
  it('version texte lisible, liens gardés', () => {
    const t = htmlToText(buildEmail({ title: 'Bonjour', body: '<p>Va <a href="https://x.fr/a">ici</a></p>', preview: 'caché' }))
    expect(t).toContain('Bonjour')
    expect(t).toContain('ici (https://x.fr/a)')
    expect(t).not.toContain('<')
    expect(t).not.toContain('caché')
  })
})

describe('e-mails du compte', () => {
  it('confirmation avec signature, reset sans', () => {
    const c = confirmationEmail({ fullName: 'Léa Martin', link: 'https://app/confirm', isInvestor: false, renvoi: false })
    expect(c.html).toContain('Bienvenue Léa')
    expect(c.html).toContain(JASON_PHOTO_URL)
    forbidden(c.html)
    const r = resetPasswordEmail('https://app/reset')
    expect(r.html).not.toContain(JASON_PHOTO_URL)
    forbidden(r.html)
  })
})

describe('e-mails des contrats', () => {
  it('expéditeur au nom de l’hôte, nettoyé', () => {
    expect(contractFrom('Anne "Dupont" <x>')).toBe('Anne Dupont x via Jason Marinho <contrats@jasonmarinho.com>')
    expect(contractFrom('  ')).toBe('Jason Marinho <contrats@jasonmarinho.com>')
  })
  it('heure de signature à Paris', () => {
    expect(signDateLabel(new Date('2026-11-20T22:30:00Z'), 'fr')).toContain('23:30')
  })
  it('invitation et contrat signé : langue du voyageur, pas de signature de Jason', () => {
    const inv = contractInviteEmail({ lang: 'pt', hostName: 'Ana', guestName: 'João', property: 'Casa', adresse: null, arrivee: '1', depart: '2', signUrl: 'https://s', cgv: true })
    expect(inv.subject).toContain('Contrato para assinar')
    expect(inv.html).toContain('lang="pt"')
    expect(inv.html).not.toContain(JASON_PHOTO_URL)
    forbidden(inv.html)
    const g = contractSignedGuestEmail({ lang: 'pt', hostName: 'Ana', guestName: 'João', property: 'Casa', signedAt: 'x', ip: '1.2.3.4', contractUrl: 'https://c', payments, virement: { iban: 'FR76', bic: null, beneficiaire: 'Ana', montant: '450,00', reference: 'REF' } })
    expect(g.subject).toContain('Contrato assinado')
    expect(g.html).toContain('FR76')
    expect(g.html).toContain('https://app/pay')
    forbidden(g.html)
  })
  it('hôte : déclaration obligatoire mise en avant', () => {
    const h = contractSignedHostEmail({ hostFirstName: 'Ana', guestName: 'João <b>', property: 'Casa', signedAt: 'x', ip: 'ip', loyer: '450,00', caution: null, paiementEnLigne: true, declaration: { label: 'SIBA', deadline: 'lundi 3 mars', note: 'n', portalUrl: 'https://siba' }, contractUrl: 'https://c', dashboardUrl: 'https://d' })
    expect(h.html).toContain('Déclaration obligatoire : SIBA')
    expect(h.html).toContain('João &lt;b&gt;')
    forbidden(h.html)
  })
  it('rappel de paiement et caution à J-2', () => {
    forbidden(paymentReminderEmail({ lang: 'fr', hostName: 'Ana', guestName: 'Léo', property: 'Gîte', contractUrl: 'https://c', payments, virement: null }).html)
    const d = depositOpenEmailContent({ lang: 'fr', hostName: 'Ana', guestName: 'Léo', property: 'Gîte', arrival: 'samedi', caution: '300,00', depositUrl: 'https://dep', contractUrl: 'https://c' })
    expect(d.html).toContain('https://dep')
    forbidden(d.html)
  })
})

describe('e-mails à l’hôte', () => {
  it('paiement reçu et Entre Hôtes', () => {
    const p = paiementReceivedEmail({ hostFirstName: 'Ana', guestFullName: 'Léo', type: 'caution', montant: 300 })
    expect(p.subject).toContain('Caution de Léo bloquée')
    forbidden(p.html)
    const m = mentionEmail({ recipientFirstName: 'Ana', actorFullName: 'Paul', type: 'accepted', postTitle: 'Taxe', postUrl: 'https://p' })
    forbidden(m.html)
  })
})
