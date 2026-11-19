import { describe, it, expect } from 'vitest'
import { badgeHtml, badgeMetier, badgeTexte, isFicheUrl } from './badge'

const FICHE = 'https://jasonmarinho.com/annuaires/photographes/jean-dupont-lyon'

describe('badge du site des pros', () => {
  it('reconnaît le métier affiché par Ma fiche', () => {
    expect(badgeMetier('photographe')).toBe('photographe')
    expect(badgeMetier('ménage')).toBe('menage')
    expect(badgeMetier('dépannage')).toBe('depannage')
    expect(badgeMetier('autre')).toBeNull()
  })

  it('n’accepte que les fiches publiques de jasonmarinho.com', () => {
    expect(isFicheUrl(FICHE)).toBe(true)
    expect(isFicheUrl('https://jasonmarinho.com/annuaires/menage/eclat-paris')).toBe(true)
    expect(isFicheUrl('http://jasonmarinho.com/annuaires/photographes/x')).toBe(false)
    expect(isFicheUrl('https://evil.com/annuaires/photographes/x')).toBe(false)
    expect(isFicheUrl('https://jasonmarinho.com/annuaires/photographes/x?y=1"')).toBe(false)
    expect(isFicheUrl('pas une adresse')).toBe(false)
  })

  it('produit un lien vers la fiche avec l’image du métier', () => {
    const html = badgeHtml('photographe', FICHE, 'Jean Dupont')
    expect(html).toContain(`href="${FICHE}"`)
    expect(html).toContain('src="https://jasonmarinho.com/badge/photographe.svg"')
    expect(html).toContain('width="240" height="72"')
    expect(html).toContain("title=\"Jean Dupont sur l'annuaire Jason Marinho\"")
    expect(html).not.toContain('nofollow')
  })

  it('accorde « référencée » pour une équipe de ménage', () => {
    expect(badgeHtml('menage', 'https://jasonmarinho.com/annuaires/menage/eclat-paris', 'Éclat')).toContain('Équipe de ménage Airbnb référencée')
  })

  it('échappe le nom du pro', () => {
    const html = badgeHtml('depannage', 'https://jasonmarinho.com/annuaires/depannage/a-b', 'A "B" <C>')
    expect(html).toContain('title="A &quot;B&quot; &lt;C&gt; sur')
    expect(html).not.toContain('<C>')
  })

  it('refuse une adresse qui n’est pas une fiche', () => {
    expect(() => badgeHtml('photographe', 'https://evil.com', 'X')).toThrow()
    expect(() => badgeTexte('https://evil.com')).toThrow()
  })

  it('donne une version texte avec l’adresse de la fiche', () => {
    expect(badgeTexte(FICHE)).toBe(`Retrouve-moi sur l'annuaire Jason Marinho : ${FICHE}`)
  })

  it('garde un titre par défaut sans nom', () => {
    expect(badgeHtml('photographe', FICHE, '  ')).toContain("title=\"Ma fiche sur l'annuaire Jason Marinho\"")
  })
})
