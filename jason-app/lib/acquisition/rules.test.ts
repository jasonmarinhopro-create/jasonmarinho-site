import { describe, it, expect } from 'vitest'
import { PLAYBOOK } from '@/lib/outreach/playbook'
import {
  cleanAcquisition, acquisitionFromParams, normalizeDestination, makeLinkCode, trackedTarget,
  describeAcquisition, isPreviewBot, shortLinkUrl, shortenProspectionLinks, BUILTIN_LINKS, LINK_CHANNELS,
} from './rules'

describe('provenance', () => {
  it('nettoie ce que le navigateur envoie', () => {
    expect(cleanAcquisition(null)).toBeNull()
    expect(cleanAcquisition({ at: '2026-10-10T10:00:00Z' })).toBeNull()
    expect(cleanAcquisition({ source: ' Facebook ', medium: 'groupe', campaign: 'groupe-hotes-k3f9', ref: 'https://l.facebook.com/l.php?u=x', landing: '/annuaires/photographes?utm_source=facebook' }))
      .toEqual({ source: 'facebook', medium: 'groupe', campaign: 'groupe-hotes-k3f9', ref: 'l.facebook.com', landing: '/annuaires/photographes' })
    // Notre propre domaine n'est pas une provenance ; une page doit être un chemin
    expect(cleanAcquisition({ ref: 'jasonmarinho.com', landing: 'https://evil.com' })).toBeNull()
    expect(cleanAcquisition({ ref: 'www.google.fr' })).toEqual({ ref: 'www.google.fr' })
  })

  it('lit les paramètres posés par le site, sinon les utm, sinon fbclid', () => {
    const p = (q: string) => new URLSearchParams(q)
    expect(acquisitionFromParams(p('acq_s=facebook&acq_m=groupe&acq_c=abc-1234&acq_l=%2F'))).toMatchObject({ source: 'facebook', campaign: 'abc-1234', landing: '/' })
    expect(acquisitionFromParams(p('utm_source=prospection&utm_medium=email'))).toEqual({ source: 'prospection', medium: 'email' })
    expect(acquisitionFromParams(p('fbclid=IwAR123'))).toEqual({ source: 'facebook', medium: 'social' })
    expect(acquisitionFromParams(p('role=host'))).toBeNull()
  })

  it('liens suivis : destination sur nos domaines, code lisible, paramètres ajoutés', () => {
    expect(normalizeDestination('/blog/x')).toBe('https://jasonmarinho.com/blog/x')
    expect(normalizeDestination('www.jasonmarinho.com/tarifs?utm_source=a')).toBe('https://jasonmarinho.com/tarifs')
    expect(normalizeDestination('https://app.jasonmarinho.com/auth/register?role=host')).toBe('https://app.jasonmarinho.com/auth/register?role=host')
    expect(normalizeDestination('https://evil.com/')).toBeNull()
    expect(normalizeDestination('javascript:alert(1)')).toBeNull()
    expect(makeLinkCode('Groupe « Hôtes Airbnb France » post du 10/10', 'K3F9zz')).toBe('groupe-hotes-airbnb-france-p-k3f9')
    expect(makeLinkCode('!!!', 'ab')).toBe('lien-ab')
    expect(trackedTarget('https://app.jasonmarinho.com/auth/register?role=host', 'abc-1234', 'facebook_groupe'))
      .toBe('https://app.jasonmarinho.com/auth/register?role=host&utm_source=facebook&utm_medium=groupe&utm_campaign=abc-1234')
    expect(shortLinkUrl('abc-1234')).toBe('https://jasonmarinho.com/l/abc-1234')
  })

  it('aperçus Facebook et WhatsApp non comptés comme des clics', () => {
    expect(isPreviewBot('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true)
    expect(isPreviewBot('WhatsApp/2.23.20.0')).toBe(true)
    expect(isPreviewBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) [FBAN/FBIOS;FBAV/440.0]')).toBe(false)
  })

  it('décrit une provenance', () => {
    const links = new Map([['abc-1234', 'Groupe Hôtes Airbnb France']])
    expect(describeAcquisition(null)).toMatchObject({ kind: 'inconnu', label: 'Pas encore mesuré' })
    expect(describeAcquisition({ source: 'facebook', medium: 'groupe', campaign: 'abc-1234', landing: '/' }, links))
      .toEqual({ kind: 'lien', label: 'Lien suivi', detail: 'Groupe Hôtes Airbnb France', landing: '/' })
    expect(describeAcquisition({ source: 'facebook', medium: 'social' })).toMatchObject({ kind: 'facebook', detail: null })
    expect(describeAcquisition({ ref: 'www.google.fr', landing: '/blog/a' })).toMatchObject({ kind: 'google', landing: '/blog/a' })
    expect(describeAcquisition({ ref: 'chatgpt.com' })).toMatchObject({ kind: 'ia', detail: 'ChatGPT' })
    expect(describeAcquisition({ source: 'prospection', medium: 'email', campaign: 'x' })).toMatchObject({ kind: 'e-mail', detail: 'E-mail de prospection' })
    expect(describeAcquisition({ landing: '/' })).toMatchObject({ kind: 'direct' })
    expect(describeAcquisition({ ref: 'driing.co' })).toMatchObject({ kind: 'autre-site', detail: 'driing.co' })
  })
  it('liens courts dans les e-mails de prospection', () => {
    const u = 'utm_source=prospection&utm_medium=email&utm_campaign=photo_premier_contact'
    expect(shortenProspectionLinks(`L'inscription : https://jasonmarinho.com/annuaires/photographes/inscription?${u}\nÀ bientôt`))
      .toBe("L'inscription : https://jasonmarinho.com/l/photo-inscription\nÀ bientôt")
    expect(shortenProspectionLinks(`Voir https://jasonmarinho.com/annuaires/menage/?${u}.`)).toBe('Voir https://jasonmarinho.com/l/menage-annuaire.')
    expect(shortenProspectionLinks(`Essaie : https://app.jasonmarinho.com/auth/register?${u}`)).toBe('Essaie : https://jasonmarinho.com/l/hote-inscription')
    // Page inconnue ou lien sans prospection : inchangé
    expect(shortenProspectionLinks(`https://jasonmarinho.com/tarifs?${u}`)).toBe(`https://jasonmarinho.com/tarifs?${u}`)
    expect(shortenProspectionLinks('https://jasonmarinho.com/annuaires/menage')).toBe('https://jasonmarinho.com/annuaires/menage')
    // Liens d'office : codes valides et canaux connus
    for (const l of BUILTIN_LINKS) {
      expect(l.code).toMatch(/^[a-z0-9-]+$/)
      expect(LINK_CHANNELS.some(c => c.key === l.channel)).toBe(true)
    }
  })
  it('tous les liens des séquences proposées deviennent des liens courts', () => {
    for (const seq of PLAYBOOK) for (const step of seq.steps) {
      expect(shortenProspectionLinks(step.body)).not.toContain('utm_source=prospection')
    }
  })
})
