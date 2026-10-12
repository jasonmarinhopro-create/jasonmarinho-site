import { describe, it, expect } from 'vitest'
import { etatAdmin, aTraiter, texteAPartager, prosAProposer, proximiteLabel, type DemandeAdminRow } from './admin'

const now = new Date('2026-10-20T12:00:00Z')
const base: DemandeAdminRow = {
  id: 'd1', created_at: '2026-10-19T10:00:00Z', metier: 'photographe', ville: 'Lyon',
  logement: 'T2 ou T3', quand: 'Dans le mois', frequence: null, budget: '250 €',
  status: 'envoyee', sent_to: [{ id: 'p1', contact_id: 'c1', round: 1 }, { id: 'p2', contact_id: 'c2', round: 1 }],
  last_round_at: '2026-10-19T10:00:00Z', admin_seen_at: null, admin_done_at: null,
}

describe('état vu de l’admin', () => {
  it('attente, ouverte par un pro, sans pro, traitée', () => {
    expect(etatAdmin(base, new Map())).toBe('attente')
    expect(etatAdmin(base, new Map([['c2', 'repondue']]))).toBe('repondue')
    expect(etatAdmin({ ...base, status: 'sans_pro', sent_to: [] }, new Map())).toBe('sans_pro')
    expect(etatAdmin({ ...base, admin_done_at: '2026-10-20T09:00:00Z' }, new Map([['c2', 'repondue']]))).toBe('traitee')
  })
  it('à traiter : pas vue, sans pro, ou rien depuis 4 jours', () => {
    expect(aTraiter(base, new Map(), now)).toBe(true)
    const vue = { ...base, admin_seen_at: '2026-10-19T11:00:00Z' }
    expect(aTraiter(vue, new Map(), now)).toBe(false)
    expect(aTraiter({ ...vue, status: 'sans_pro', sent_to: [] }, new Map(), now)).toBe(true)
    expect(aTraiter({ ...vue, last_round_at: '2026-10-15T10:00:00Z' }, new Map(), now)).toBe(true)
    expect(aTraiter({ ...vue, last_round_at: '2026-10-15T10:00:00Z' }, new Map([['c1', 'devis']]), now)).toBe(false)
    expect(aTraiter({ ...base, admin_done_at: '2026-10-20T09:00:00Z' }, new Map(), now)).toBe(false)
  })
})

describe('texte à partager', () => {
  it('le besoin seul et le lien pour s’inscrire, tutoiement ou vouvoiement', () => {
    const t = texteAPartager(base)
    expect(t).toContain('Un hôte cherche un photographe à Lyon : T2 ou T3, dans le mois, budget 250 €.')
    expect(t).toContain('https://jasonmarinho.com/devenir-photographe-lcd')
    expect(t).not.toMatch(/—/)
    expect(texteAPartager({ ...base, metier: 'menage' }, false)).toContain('créez votre fiche')
  })
})

describe('pros à proposer', () => {
  const pros = [
    { id: 'p1', nom: 'Anna', slug: 'anna', ville: 'Lyon', zone_couverte: null },
    { id: 'p3', nom: 'Zoé', slug: 'zoe', ville: 'Bordeaux', zone_couverte: 'Gironde' },
    { id: 'p4', nom: 'Bruno', slug: 'bruno', ville: 'Villeurbanne', zone_couverte: null, villes_couvertes: ['Lyon'] },
    { id: 'p5', nom: 'Alix', slug: 'alix', ville: 'Annecy', zone_couverte: null },
  ]
  it('sans les pros déjà sollicités, les plus proches d’abord, recherche sans accents', () => {
    expect(prosAProposer(pros, base).map(p => p.id)).toEqual(['p4', 'p5', 'p3'])
    expect(prosAProposer(pros, base, 'zoe').map(p => p.id)).toEqual(['p3'])
    expect(proximiteLabel(80)).toBe('Couvre la ville')
    expect(proximiteLabel(0)).toBe('Autre ville')
  })
})
