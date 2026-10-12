import { describe, it, expect } from 'vitest'
import { buildPrivateMessage, aVille, formatPrenom, privateMessageUrl, PRIVATE_KINDS } from './messages'
import { BUILTIN_LINKS, PRIVATE_AUDIENCES, PRIVATE_PLATFORMS, privateLinkCode, trackedTarget, LINK_CHANNELS } from './rules'

describe('messages privés aux pros', () => {
  it('un lien suivi d\'office par métier et par messagerie', () => {
    for (const a of PRIVATE_AUDIENCES) for (const p of PRIVATE_PLATFORMS) {
      const code = privateLinkCode(a.key, p.key)
      const link = BUILTIN_LINKS.find(l => l.code === code)
      expect(link?.destination).toBe(a.destination)
      expect(LINK_CHANNELS.some(c => c.key === link?.channel)).toBe(true)
    }
    expect(privateMessageUrl('photographe', 'instagram')).toBe('https://jasonmarinho.com/l/mp-photo-instagram')
    expect(trackedTarget(PRIVATE_AUDIENCES[1].destination, 'mp-menage-facebook', 'prive_facebook'))
      .toBe('https://jasonmarinho.com/annuaires/menage/exemple-fiche?utm_source=facebook&utm_medium=prive&utm_campaign=mp-menage-facebook')
  })

  it('prénom et ville', () => {
    expect(formatPrenom('  marie-claire ')).toBe('Marie-Claire')
    expect(aVille('Lyon')).toBe(' à Lyon')
    expect(aVille('Le Mans')).toBe(' au Mans')
    expect(aVille("Les Sables-d'Olonne")).toBe(" aux Sables-d'Olonne")
    expect(aVille('La Rochelle')).toBe(' à La Rochelle')
    expect(aVille('')).toBe('')
  })

  it('premier message photographe : prénom, ville, lien de la messagerie', () => {
    const m = buildPrivateMessage({ audience: 'photographe', platform: 'linkedin', kind: 'premier', prenom: 'julie', ville: 'Lyon' })
    expect(m.startsWith('Bonjour Julie,')).toBe(true)
    expect(m).toContain('un bon photographe à Lyon.')
    expect(m).toContain('https://jasonmarinho.com/l/mp-photo-linkedin')
    expect(m).toContain('Tu fais ce type de shooting')
  })

  it('sans prénom ni ville, et au vouvoiement', () => {
    const m = buildPrivateMessage({ audience: 'menage', platform: 'whatsapp', kind: 'relance', vous: true })
    expect(m.startsWith('Bonjour,')).toBe(true)
    expect(m).toContain('mp-menage-whatsapp')
    expect(m).not.toMatch(/(?<!\p{L})(tu|te|toi|ton|ta|tes)(?!\p{L})/iu)
  })

  it('hôtes : vers l\'accueil, contrats présentés avec le Standard', () => {
    expect(privateMessageUrl('hote', 'facebook')).toBe('https://jasonmarinho.com/l/mp-hote-facebook')
    expect(BUILTIN_LINKS.find(l => l.code === 'mp-hote-facebook')?.destination).toBe('https://jasonmarinho.com/')
    const m = buildPrivateMessage({ audience: 'hote', platform: 'instagram', kind: 'premier', prenom: 'paul', ville: 'Le Mans' })
    expect(m.startsWith('Bonjour Paul,')).toBe(true)
    expect(m).toContain('Tu loues au Mans depuis longtemps ?')
    const r = buildPrivateMessage({ audience: 'hote', platform: 'instagram', kind: 'relance' })
    expect(r).toContain('la formule Standard ajoute les contrats signés en ligne, dès 19,98 € par an')
  })

  it('toutes les versions : sans tiret cadratin ni emoji, assez courtes pour une messagerie', () => {
    for (const a of PRIVATE_AUDIENCES) for (const p of PRIVATE_PLATFORMS) for (const k of PRIVATE_KINDS) for (const vous of [false, true]) {
      const m = buildPrivateMessage({ audience: a.key, platform: p.key, kind: k.key, prenom: 'Léa', ville: 'Nice', vous })
      expect(m).not.toMatch(/—/)
      expect(m).not.toMatch(/\p{Extended_Pictographic}/u)
      expect(m.length).toBeLessThan(1000)
      expect(m).toContain(privateMessageUrl(a.key, p.key))
    }
  })
})
