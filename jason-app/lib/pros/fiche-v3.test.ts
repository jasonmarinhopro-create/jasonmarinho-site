import { describe, it, expect } from 'vitest'
import { v3Formules, v3Prix, telHref, ficheV3Html } from '../../../scripts/lib/fiche-v3.mjs'

const base = {
  name: 'Sandrine Morel', firstName: 'Sandrine', initials: 'SM', logoUrl: null, role: 'Équipe de ménage à Nantes', sub: 'Ménage · Nantes',
  crumbs: [{ href: '/', label: 'Accueil' }], badges: [], photos: [], videoHtml: '', facts: [{ v: 'Nantes', l: 'ville principale' }],
  formules: [], tarifMin: null, tarifMax: null, unite: 'le ménage', bio: '', offerTitle: 'Ce que l’équipe propose', offers: [],
  zoneHtml: '', links: [], reseauxHtml: '', telHtml: '', telHref: '', besoins: ['Un grand ménage'], placeholder: '',
  reco: null, guide: null, annuaire: { href: '/annuaires/menage', label: 'Toutes les équipes' }, disclaimer: 'x',
}

describe('fiche v3', () => {
  it('garde 3 formules nommées et ignore les prix vides', () => {
    expect(v3Formules([{ nom: ' A ', prix: 0 }, { nom: '' }, { nom: 'B', prix: 90 }, { nom: 'C' }, { nom: 'D' }])).toEqual([
      { nom: 'A', prix: null, detail: '' }, { nom: 'B', prix: 90, detail: '' }, { nom: 'C', prix: null, detail: '' },
    ])
  })
  it('affiche le plus petit prix, sinon « Sur devis »', () => {
    expect(v3Prix([{ nom: 'A', prix: 1200 }], 900, null)).toEqual({ v: 'dès 900 €', devis: false })
    expect(v3Prix([{ nom: 'A', prix: 1200 }], null, null).v).toBe('dès 1 200 €')
    expect(v3Prix([], null, 300).v).toBe('jusqu’à 300 €')
    expect(v3Prix(null, null, null)).toEqual({ v: 'Sur devis', devis: true })
  })
  it('ne fait un lien tel: qu’avec 8 chiffres au moins', () => {
    expect(telHref('06 12')).toBe('')
    expect(telHref('+33 6 12 34 56 78')).toBe('tel:+33612345678')
  })
  it('reste propre quand presque tout manque', () => {
    const h = ficheV3Html(base)
    expect(h).toContain('fx no-ph')
    expect(h).toContain('Sur devis')
    expect(h).not.toContain('id="formules"')
    expect(h).not.toContain('Présentation')
    expect(h).not.toContain('fx-bar-tel')
    expect(h).not.toContain('undefined')
  })
  it('échappe les textes du pro', () => {
    expect(ficheV3Html({ ...base, name: '<b>X</b>' })).not.toContain('<b>X</b>')
  })
})
