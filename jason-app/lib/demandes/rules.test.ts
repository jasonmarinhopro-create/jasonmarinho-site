import { describe, it, expect } from 'vitest'
import { cleanDemande, proximite, choisirPros, messagePourPro, anonymizedNeed, prochaineAction, type DemandeInput } from './rules'

const base = { metier: 'photographe', ville: 'Lyon', nom: 'Paul Martin', email: 'Paul@Exemple.fr', consent: true }

describe('formulaire', () => {
  it('valide et nettoie', () => {
    const r = cleanDemande({ ...base, logement: 'T2 ou T3', quand: 'Dans le mois', frequence: 'x', telephone: '06 12 34 56 78', message: '  Bonjour   ' })
    expect('value' in r && r.value).toMatchObject({ metier: 'photographe', email: 'paul@exemple.fr', logement: 'T2 ou T3', quand: 'Dans le mois', frequence: null, telephone: '06 12 34 56 78', message: 'Bonjour' })
  })
  it('refuse sans consentement, e-mail ou ville', () => {
    expect('error' in cleanDemande({ ...base, consent: false })).toBe(true)
    expect('error' in cleanDemande({ ...base, email: 'paul@' })).toBe(true)
    expect('error' in cleanDemande({ ...base, ville: '' })).toBe(true)
    expect('error' in cleanDemande({ ...base, metier: 'plombier' })).toBe(true)
  })
  it('valeurs hors liste ignorées, fréquence seulement pour le ménage', () => {
    const r = cleanDemande({ ...base, metier: 'menage', logement: 'Château', frequence: 'Des ménages réguliers entre deux voyageurs' })
    expect('value' in r && r.value.logement).toBe(null)
    expect('value' in r && r.value.frequence).toBe('Des ménages réguliers entre deux voyageurs')
  })
})

describe('pros les plus proches', () => {
  const pros = [
    { id: 'a', ville: 'Lyon', zone_couverte: 'Lyon + 60 km', contacts_count: 5 },
    { id: 'b', ville: 'Villeurbanne', zone_couverte: null, villes_couvertes: ['Lyon'], contacts_count: 0 },
    { id: 'c', ville: 'Lyon 6e', zone_couverte: null, contacts_count: 1 },
    { id: 'd', ville: 'Annecy', zone_couverte: 'Haute-Savoie, Lyon', contacts_count: 0 },
    { id: 'e', ville: 'Bordeaux', zone_couverte: 'Gironde', contacts_count: 0 },
    { id: 'f', ville: 'Lyon', zone_couverte: null, contacts_count: 0 },
  ]
  it('ville exacte d’abord, puis villes couvertes, puis zone', () => {
    expect(proximite(pros[0], 'lyon')).toBe(100)
    expect(proximite(pros[2], 'Lyon')).toBe(90)
    expect(proximite(pros[1], 'Lyon')).toBe(80)
    expect(proximite(pros[3], 'Lyon')).toBe(50)
    expect(proximite(pros[4], 'Lyon')).toBe(0)
    expect(proximite({ id: 'x', ville: 'Saint-Malo', zone_couverte: null }, 'St Malo')).toBe(100)
  })
  it('3 au plus, les moins sollicités d’abord à égalité, sans ceux déjà sollicités', () => {
    expect(choisirPros(pros, 'Lyon', new Set()).map(p => p.id)).toEqual(['f', 'a', 'c'])
    expect(choisirPros(pros, 'Lyon', new Set(['f', 'a', 'c'])).map(p => p.id)).toEqual(['b', 'd'])
    expect(choisirPros(pros, 'Brest', new Set())).toEqual([])
  })
})

describe('textes', () => {
  const d: DemandeInput = { metier: 'menage', ville: 'Bordeaux', logement: 'T2 ou T3', quand: 'Au plus vite', frequence: 'Des ménages réguliers entre deux voyageurs', budget: '80 € le ménage', message: 'Code 1234, appelez-moi', nom: 'Paul Martin', email: 'paul@exemple.fr', telephone: '0612345678', source: null }
  it('message du pro complet', () => {
    const m = messagePourPro(d)
    expect(m).toContain('une équipe de ménage à Bordeaux')
    expect(m).toContain('Téléphone : 0612345678')
    expect(m).toContain('Code 1234')
  })
  it('besoin anonymisé : ni nom, ni e-mail, ni téléphone, ni message', () => {
    const a = anonymizedNeed(d)
    expect(a).toBe('Un hôte cherche une équipe de ménage à Bordeaux : T2 ou T3, des ménages réguliers entre deux voyageurs, au plus vite, budget 80 € le ménage.')
    for (const s of ['Paul', 'exemple.fr', '0612', '1234']) expect(a).not.toContain(s)
  })
})

describe('relances', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  const d = { status: 'envoyee' as const, created_at: '2026-10-17T10:00:00Z', last_round_at: '2026-10-17T10:00:00Z', sent_to: [{ id: 'a', contact_id: 'c1', round: 1 }, { id: 'b', contact_id: 'c2', round: 1 }] }
  it('élargit après 48 h si personne n’a touché à la demande', () => {
    expect(prochaineAction(d, new Map([['c1', 'nouvelle'], ['c2', 'nouvelle']]), now)).toBe('elargir')
    expect(prochaineAction(d, new Map([['c1', 'repondue']]), now)).toBe('rien')
    expect(prochaineAction({ ...d, last_round_at: '2026-10-19T20:00:00Z' }, new Map(), now)).toBe('rien')
  })
  it('3 vagues au plus ; sans pro : nouveaux pros pendant 30 jours', () => {
    expect(prochaineAction({ ...d, sent_to: [{ id: 'x', contact_id: 'c', round: 3 }] }, new Map(), now)).toBe('rien')
    expect(prochaineAction({ ...d, status: 'sans_pro', sent_to: [] }, new Map(), now)).toBe('nouveaux_pros')
    expect(prochaineAction({ ...d, status: 'sans_pro', created_at: '2026-09-01T00:00:00Z', sent_to: [] }, new Map(), now)).toBe('rien')
  })
})
