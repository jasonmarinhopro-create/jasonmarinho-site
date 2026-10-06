import { describe, it, expect } from 'vitest'
import {
  addDaysIso, isoWeekday, nextAllowedDay, scheduleStep, afterSend, renderTemplate, guessFirstName,
  replySubject, complianceFooter, textToHtml, signatureToHtml, DEFAULT_SIGNATURE, SIGNATURE_PHOTO_URL, cleanTag, normalizeTag, mergeTags, daysWithoutNews, extractEmails, bestEmail, bouncedAddresses, isBounceSender,
} from './engine'

const WEEK = [1, 2, 3, 4, 5]
const rules = { repeat_after_days: null, max_repeats: 0, then_sequence_id: null, end_stage: null }

describe('dates', () => {
  it('jour de la semaine ISO', () => {
    expect(isoWeekday('2026-09-28')).toBe(1) // lundi
    expect(isoWeekday('2026-10-04')).toBe(7) // dimanche
  })
  it('report au prochain jour ouvré', () => {
    expect(nextAllowedDay('2026-10-03', WEEK)).toBe('2026-10-05') // samedi → lundi
    expect(nextAllowedDay('2026-10-01', WEEK)).toBe('2026-10-01')
  })
  it('J+2 un jeudi tombe le lundi', () => {
    expect(scheduleStep('2026-10-01', 2, WEEK)).toBe('2026-10-05')
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('afterSend', () => {
  it('passe à l\'étape suivante avec son délai', () => {
    expect(afterSend(0, [0, 3, 7], rules, 0, '2026-09-29', WEEK)).toEqual({ kind: 'next', next_step: 1, next_send_on: '2026-10-02' })
  })
  it('termine et enchaîne après la dernière étape', () => {
    expect(afterSend(2, [0, 3, 7], { ...rules, then_sequence_id: 'seq-b', end_stage: 'pas_interesse' }, 0, '2026-09-29', WEEK))
      .toEqual({ kind: 'done', chain_to: 'seq-b', end_stage: 'pas_interesse' })
  })
  it('boucle tant qu\'il reste des tours', () => {
    const r = { ...rules, repeat_after_days: 60, max_repeats: 1 }
    expect(afterSend(1, [0, 4], r, 0, '2026-09-29', WEEK)).toEqual({ kind: 'loop', next_step: 0, next_send_on: '2026-11-30', loop_count: 1 })
    expect(afterSend(1, [0, 4], r, 1, '2026-09-29', WEEK).kind).toBe('done')
  })
})

describe('gabarits', () => {
  it('remplace les variables', () => {
    expect(renderTemplate('Bonjour {prenom}, tu es à {ville} ?', { prenom: 'Marie', ville: 'Lyon' })).toBe('Bonjour Marie, tu es à Lyon ?')
  })
  it('variable vide sans espace orphelin', () => {
    expect(renderTemplate('Bonjour {prenom},\nMerci', { prenom: '' })).toBe('Bonjour,\nMerci')
    expect(renderTemplate('Des hôtes{ à ville} cherchent', {})).toBe('Des hôtes cherchent')
    expect(renderTemplate('Des hôtes{ à ville} cherchent', { ville: 'Nice' })).toBe('Des hôtes à Nice cherchent')
  })
  it('prénom deviné seulement quand c\'est plausible', () => {
    expect(guessFirstName(null, 'MARIE DUPONT')).toBe('Marie')
    expect(guessFirstName(null, 'Studio Lumière')).toBe('')
    expect(guessFirstName(null, 'Dupont')).toBe('')
    expect(guessFirstName('jean-luc', null)).toBe('Jean-Luc')
    // Noms d'entreprise : pas de faux prénom (« Bonjour The, »)
    expect(guessFirstName(null, 'The Paris Photographer')).toBe('')
    expect(guessFirstName(null, 'Noir Noir')).toBe('')
    expect(guessFirstName(null, 'Pink Studio')).toBe('')
    expect(guessFirstName(null, 'Equinoxe')).toBe('')
    expect(guessFirstName(null, "Dimitri LAMOUR - photographe d'architecture")).toBe('Dimitri')
    expect(guessFirstName(null, 'David Ferrière')).toBe('David')
    expect(guessFirstName(null, 'Hélène Martin')).toBe('Hélène')
    expect(guessFirstName(null, 'Jean-Luc Photo')).toBe('')
    expect(guessFirstName(null, 'Jean-Luc Bernard')).toBe('Jean-Luc')
    expect(renderTemplate('Bonjour {prenom},', { prenom: guessFirstName(null, 'The Paris Photographer') })).toBe('Bonjour,')
  })
  it('objet de relance', () => {
    expect(replySubject('Ta fiche')).toBe('Re: Ta fiche')
    expect(replySubject('Re: Ta fiche')).toBe('Re: Ta fiche')
  })
})

describe('information et désinscription', () => {
  it('premier message : origine + lien', () => {
    const f = complianceFooter({ source: 'google', firstMessage: true, unsubscribeUrl: 'https://x/d/1' })
    expect(f).toContain('Google Maps')
    expect(f).toContain('https://x/d/1')
  })
  it('relance : lien seul', () => {
    const f = complianceFooter({ source: 'google', firstMessage: false, unsubscribeUrl: 'https://x/d/1' })
    expect(f).not.toContain('Google')
    expect(f).toContain('https://x/d/1')
  })
  it('HTML échappé avec liens cliquables', () => {
    const h = textToHtml('Salut <b>\n\nVoir https://jasonmarinho.com/tarifs.', 'Stop : https://x/d/1')
    expect(h).toContain('&lt;b&gt;')
    expect(h).toContain('<a href="https://jasonmarinho.com/tarifs">')
    expect(h).toContain('<a href="https://x/d/1">')
  })
  it('signature mise en forme comme dans Gmail', () => {
    const h = signatureToHtml(DEFAULT_SIGNATURE)
    expect(h).toContain('font-weight:700;">Jason Marinho</div>')
    expect(h).toContain('href="mailto:contact@jasonmarinho.com"')
    expect(h).toContain('href="tel:0630212592"')
    expect(h).toContain('href="https://jasonmarinho.com"')
    expect(h).toContain('>75015 Paris</div>')
    expect(signatureToHtml('<script>')).toContain('&lt;script&gt;')
    expect(textToHtml('Salut', 'Stop', DEFAULT_SIGNATURE)).toContain('Entrepreneur')
  })
})

describe('e-mails d\'un site', () => {
  it('extrait et filtre', () => {
    const html = '<a href="mailto:Contact@Studio-Marie.fr">écrire</a> logo@2x.png noreply@wix.com bonjour [at] studio-marie.fr x@sentry.io'
    const list = extractEmails(html)
    expect(list).toContain('contact@studio-marie.fr')
    expect(list).toContain('bonjour@studio-marie.fr')
    expect(list.some(e => e.includes('noreply') || e.includes('sentry') || e.includes('@2x'))).toBe(false)
  })
  it('préfère le domaine du site', () => {
    expect(bestEmail(['marie@gmail.com', 'contact@studio-marie.fr'], 'https://www.studio-marie.fr/')).toBe('contact@studio-marie.fr')
    expect(bestEmail(['rgpd@x.fr', 'hello@x.fr'], 'https://x.fr')).toBe('hello@x.fr')
    expect(bestEmail([], 'https://x.fr')).toBeNull()
  })
})

describe('rebonds', () => {
  it('lit les adresses en échec', () => {
    const dsn = 'Final-Recipient: rfc822; old@studio.fr\nAction: failed\nX-Failed-Recipients: autre@studio.fr'
    expect(bouncedAddresses(dsn).sort()).toEqual(['autre@studio.fr', 'old@studio.fr'])
  })
  it('reconnaît un expéditeur de rebond', () => {
    expect(isBounceSender('Mail Delivery Subsystem <mailer-daemon@googlemail.com>')).toBe(true)
    expect(isBounceSender('Marie <marie@studio.fr>')).toBe(false)
  })
})

describe('pipeline : étiquettes et relances', () => {
  it('étiquettes nettoyées, comparées sans casse ni accents, sans doublon', () => {
    expect(cleanTag('  Salon   Lyon ')).toBe('Salon Lyon')
    expect(normalizeTag('Recommandé')).toBe(normalizeTag('recommande'))
    expect(mergeTags(['Chaud'], ['chaud', ' Salon Lyon', ''])).toEqual(['Chaud', 'Salon Lyon'])
  })
  it('jours sans nouvelle : dernier e-mail, dernière réponse ou ajout', () => {
    const now = new Date('2026-09-29T12:00:00Z').getTime()
    expect(daysWithoutNews({ created_at: '2026-09-19T10:00:00Z', last_contacted_at: null, replied_at: null }, now)).toBe(10)
    expect(daysWithoutNews({ created_at: '2026-09-01T10:00:00Z', last_contacted_at: '2026-09-26T10:00:00Z', replied_at: '2026-09-28T09:00:00Z' }, now)).toBe(1)
  })
  it('signature avec photo : tableau photo à gauche, sans photo : texte seul', () => {
    const withPhoto = signatureToHtml(DEFAULT_SIGNATURE, SIGNATURE_PHOTO_URL)
    expect(withPhoto).toContain(`src="${SIGNATURE_PHOTO_URL}"`)
    expect(withPhoto).toContain('width="64"')
    expect(withPhoto).toContain('alt="Jason Marinho"')
    expect(signatureToHtml(DEFAULT_SIGNATURE)).not.toContain('<img')
    expect(SIGNATURE_PHOTO_URL).toMatch(/^https:\/\/jasonmarinho\.com\/.+\.jpg$/)
  })
})

import { matchReply, messageIdsOf, uniqueProDomains, proDomainOf } from './engine'

describe('reconnaître une réponse', () => {
  const known = new Set(['contact@studio-lumiere.fr', 'jean@gmail.com', 'a@agence.fr', 'b@agence.fr'])
  const byThread = new Map([['abc123@jasonmarinho.com', 'contact@studio-lumiere.fr']])
  const byDomain = uniqueProDomains(known)
  it('adresse, fil de discussion puis domaine pro', () => {
    expect(messageIdsOf('<ABC123@jasonmarinho.com> <x@y>')).toEqual(['abc123@jasonmarinho.com', 'x@y'])
    expect(matchReply({ from: 'Jean@Gmail.com' }, known, byThread, byDomain)).toEqual({ email: 'jean@gmail.com', how: 'adresse' })
    expect(matchReply({ from: 'perso@gmail.com', inReplyTo: '<abc123@jasonmarinho.com>' }, known, byThread, byDomain)).toEqual({ email: 'contact@studio-lumiere.fr', how: 'fil' })
    expect(matchReply({ from: 'perso@gmail.com', references: '<z@z> <abc123@jasonmarinho.com>' }, known, byThread, byDomain)?.how).toBe('fil')
    expect(matchReply({ from: 'marc@studio-lumiere.fr' }, known, byThread, byDomain)).toEqual({ email: 'contact@studio-lumiere.fr', how: 'domaine' })
    // Domaine partagé par deux contacts, ou webmail : rien
    expect(matchReply({ from: 'c@agence.fr' }, known, byThread, byDomain)).toBeNull()
    expect(matchReply({ from: 'autre@gmail.com' }, known, byThread, byDomain)).toBeNull()
    expect(proDomainOf('x@orange.fr')).toBeNull()
  })
})
