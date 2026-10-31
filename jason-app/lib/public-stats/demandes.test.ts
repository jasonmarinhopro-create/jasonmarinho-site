import { describe, it, expect } from 'vitest'
import {
  buildPublicDemandes, demandesOfCity, directItems, DEMANDES_DIRECTES, etatOfContact, etatOfDemande, fromTrouverUnPro, isTestEmail, parisMonth, OTHER_CITY, type DemandeItem,
} from './demandes'

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

describe('demandes publiques', () => {
  it('reconnaît les lignes créées par le formulaire', () => {
    expect(fromTrouverUnPro('https://jasonmarinho.com/trouver-un-pro#demande-abc')).toBe(true)
    expect(fromTrouverUnPro('https://jasonmarinho.com/annuaires/photographes/camille')).toBe(false)
    expect(fromTrouverUnPro(null)).toBe(false)
  })
  it('écarte les tests', () => {
    const admins = new Set(['jason@exemple.fr'])
    expect(isTestEmail('Jason@exemple.fr ', admins)).toBe(true)
    expect(isTestEmail('contact@jasonmarinho.com', admins)).toBe(true)
    expect(isTestEmail('hote@gmail.com', admins)).toBe(false)
  })
  it('états publics', () => {
    expect(etatOfContact('nouvelle')).toBe('transmise')
    expect(etatOfContact('repondue')).toBe('ouverte')
    expect(etatOfDemande('envoyee', ['nouvelle', 'devis_envoye'])).toBe('ouverte')
    expect(etatOfDemande('envoyee', ['nouvelle'])).toBe('transmise')
    expect(etatOfDemande('sans_pro', [])).toBe('sans_pro')
  })
  it('mois à Paris', () => {
    expect(parisMonth('2026-09-30T23:30:00Z')).toBe('2026-10')
  })
  it('zéro demande : tout à zéro, 6 mois vides', () => {
    const d = buildPublicDemandes([], { today: '2026-10-17', labelOf: label })
    expect(d.total).toBe(0)
    expect(d.since).toBeNull()
    expect(d.months).toHaveLength(6)
    expect(d.months[5]).toEqual({ month: '2026-10', count: 0, current: true })
    expect(d.months[0].month).toBe('2026-05')
    expect(d.fil).toEqual([])
  })
  it('compte, range par ville et garde le mois seulement', () => {
    const items: DemandeItem[] = [
      { at: '2026-10-14T10:00:00Z', metier: 'photographe', slug: 'lyon', source: 'formulaire', etat: 'ouverte' },
      { at: '2026-10-02T10:00:00Z', metier: 'menage', slug: null, source: 'fiche', etat: 'transmise' },
      { at: '2026-09-20T10:00:00Z', metier: 'menage', slug: 'lyon', source: 'fiche', etat: 'transmise' },
    ]
    const d = buildPublicDemandes(items, {
      today: '2026-10-17', labelOf: label,
      pros: { photographe: new Map([['lyon', 2]]), menage: new Map() },
    })
    expect(d.total).toBe(3)
    expect(d.since).toBe('2026-09')
    expect(d.byMetier).toEqual({ photographe: 1, menage: 2, depannage: 0 })
    expect(d.bySource).toEqual({ formulaire: 1, fiche: 2, direct: 0 })
    expect(d.byEtat).toEqual({ ouverte: 1, transmise: 2, sans_pro: 0 })
    expect(d.cities[0]).toEqual({ slug: 'lyon', label: 'Lyon', total: 2, photographe: 1, menage: 1, depannage: 0, pros: { photographe: 2, menage: 0, depannage: 0 } })
    expect(d.cities[1].label).toBe(OTHER_CITY)
    expect(d.months.slice(-2).map(m => m.count)).toEqual([1, 2])
    expect(d.fil[0]).toEqual({ month: '2026-10', metier: 'photographe', slug: 'lyon', label: 'Lyon', source: 'formulaire', etat: 'ouverte' })
    expect(JSON.stringify(d)).not.toContain('T10:00')
    expect(demandesOfCity(d, 'lyon')).toEqual({ total: 2, photographe: 1, menage: 1, depannage: 0 })
    expect(demandesOfCity(d, 'nice')).toEqual({ total: 0, photographe: 0, menage: 0, depannage: 0 })
  })
  it('demandes directes : mois seulement, villes connues', () => {
    const items = directItems()
    expect(items).toHaveLength(DEMANDES_DIRECTES.length)
    for (const it of items) { expect(it.source).toBe('direct'); expect(it.at).toMatch(/^\d{4}-\d{2}-01T/) }
    const d = buildPublicDemandes(items, { today: '2026-10-17', labelOf: label })
    expect(d.bySource.direct).toBe(items.length)
  })
})

describe('demandes publiques du dépannage (31/10/2026)', () => {
  it('compte une demande de dépannage sans casser les autres compteurs', () => {
    const d = buildPublicDemandes([{ at: '2026-10-31T10:00:00Z', metier: 'depannage', slug: 'nantes', source: 'formulaire', etat: 'sans_pro' }], { today: '2026-10-31', labelOf: s => s })
    expect(d.byMetier).toEqual({ photographe: 0, menage: 0, depannage: 1 })
    expect(d.cities[0]).toMatchObject({ slug: 'nantes', total: 1, depannage: 1 })
  })
})
