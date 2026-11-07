import { describe, it, expect } from 'vitest'
import { audiencesOf, groupsFor, groupLinkCode, groupOpenUrl, clientSearches, ficheShareUrl, proPostTemplates } from './groupes-clients'

describe('groupes des pros', () => {
  it('sans la colonne audiences, un groupe reste réservé aux hôtes', () => {
    expect(audiencesOf({})).toEqual(['hote'])
    expect(audiencesOf({ audiences: null })).toEqual(['hote'])
    expect(audiencesOf({ audiences: ['inconnu'] })).toEqual(['hote'])
    expect(audiencesOf({ audiences: ['menage', 'depannage'] })).toEqual(['menage', 'depannage'])
  })

  it('filtre les groupes par public', () => {
    const gs = [{ id: 'a' }, { id: 'b', audiences: ['photographe', 'hote'] }, { id: 'c', audiences: ['recrutement'] }]
    expect(groupsFor(gs, 'hote').map(g => g.id)).toEqual(['a', 'b'])
    expect(groupsFor(gs, 'photographe').map(g => g.id)).toEqual(['b'])
    expect(groupsFor(gs, 'menage')).toEqual([])
  })

  it('code de lien suivi stable et court, adresse de clic', () => {
    expect(groupLinkCode('6825bbbd-b3f6-44b1-b693-0bcfecc39284')).toBe('gfb-6825bbbdb3f6')
    expect(groupLinkCode('6825bbbd-b3f6-44b1-b693-0bcfecc39284')).toMatch(/^[a-z0-9-]+$/)
    expect(groupOpenUrl('abc', 'menage')).toBe('/api/groupes/ouvrir?g=abc&m=menage')
  })

  it('recherches Facebook de la ville du pro', () => {
    expect(clientSearches('photographe', null)).toEqual([])
    const s = clientSearches('photographe', 'Lyon')
    expect(s.map(x => x.label)).toEqual(['airbnb Lyon', 'conciergerie Lyon', 'location saisonnière Lyon', 'cherche photographe Lyon'])
    expect(s[0].url).toBe('https://www.facebook.com/search/groups/?q=airbnb%20Lyon')
  })

  it('lien de la fiche avec la provenance « groupe Facebook »', () => {
    expect(ficheShareUrl('menage', null)).toBeNull()
    expect(ficheShareUrl('menage', 'maison-clean')).toBe('https://jasonmarinho.com/annuaires/menage/maison-clean?utm_source=facebook&utm_medium=groupe&utm_campaign=fiche-pro')
  })

  it('messages prêts à publier : remplis, sans tiret cadratin ni emoji', () => {
    for (const m of ['photographe', 'menage', 'depannage'] as const) {
      const full = proPostTemplates(m, { prenom: 'Anne', ville: 'Nantes', lien: 'https://x.test/f' })
      expect(full).toHaveLength(3)
      for (const t of full) {
        expect(t.text).toContain('Anne')
        expect(t.text).toContain('https://x.test/f')
        expect(t.text).not.toContain('—')
        expect(t.text).not.toMatch(/\p{Extended_Pictographic}/u)
      }
      const empty = proPostTemplates(m, {})
      expect(empty[0].text).toContain('[TON PRÉNOM]')
      expect(empty[0].text).toContain('[LIEN DE TA FICHE]')
    }
  })
})
