import { describe, it, expect } from 'vitest'
import { hostJourney, hostFeed, type HostUsage } from './host-journey'

const zero = { n: 0, last: null }
const vide: HostUsage = {
  logements: zero, calendriers: { ...zero, enErreur: 0 }, reservationsImportees: 0, sejours: zero, voyageurs: zero,
  contrats: { ...zero, signes: 0 }, paiementsEnLigne: 'non', revenus: zero, charges: { ...zero, recurrentes: 0 },
  objectif: false, evenements: zero, declarations: zero, notifications: 0,
}

describe('hostJourney', () => {
  it('compte sans rien : bloqué au logement', () => {
    const j = hostJourney(vide)
    expect(j.done).toBe(0)
    expect(j.niveau).toBe('Pas encore commencé')
    expect(j.blocage?.step).toBe('logement')
  })
  it('logement sans calendrier ni réservation : bloqué au calendrier', () => {
    const j = hostJourney({ ...vide, logements: { n: 1, last: '2026-10-01T10:00:00Z' } })
    expect(j.blocage?.step).toBe('calendrier')
    expect(j.niveau).toBe('Premiers pas')
  })
  it('synchro en erreur passe avant le reste', () => {
    const j = hostJourney({ ...vide, logements: { n: 1, last: null }, calendriers: { n: 2, last: null, enErreur: 1 }, reservationsImportees: 4 })
    expect(j.steps.find(s => s.key === 'calendrier')).toMatchObject({ state: 'probleme', detail: '1 synchro en erreur sur 2' })
    expect(j.blocage?.step).toBe('calendrier')
  })
  it('finances seules (sans calendrier) : pas de blocage au calendrier si des séjours existent', () => {
    const j = hostJourney({ ...vide, logements: { n: 1, last: null }, sejours: { n: 3, last: '2026-10-02T10:00:00Z' }, revenus: { n: 5, last: '2026-11-02T10:00:00Z' } })
    expect(j.blocage).toBeNull()
    expect(j.steps.find(s => s.key === 'finances')).toMatchObject({ state: 'fait', detail: '5 revenus saisis' })
    expect(j.steps.find(s => s.key === 'reservations')?.detail).toBe('3 séjours avec montant')
  })
  it('contrat envoyé non signé, puis Stripe commencé', () => {
    const base = { ...vide, logements: { n: 1, last: null }, calendriers: { n: 1, last: null, enErreur: 0 } }
    expect(hostJourney({ ...base, contrats: { n: 2, last: null, signes: 0 } }).blocage?.step).toBe('contrats')
    expect(hostJourney({ ...base, paiementsEnLigne: 'commence' }).blocage?.step).toBe('paiements')
  })
})

describe('hostFeed', () => {
  it('trie de la plus récente à la plus ancienne et ignore les dates absentes', () => {
    const f = hostFeed({ ...vide, logements: { n: 1, last: '2026-08-17T10:00:00Z' }, revenus: { n: 1, last: '2026-11-02T09:00:00Z' } }, [{ label: 'Formation commencée', at: '2026-10-26T10:00:00Z' }])
    expect(f.map(x => x.label)).toEqual(['Revenu saisi', 'Formation commencée', 'Logement ajouté'])
  })
})
