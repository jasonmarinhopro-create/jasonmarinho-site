import { describe, it, expect } from 'vitest'
import {
  buildRevenueLines, buildChargeLines, buildOccupation, totaux, serieMensuelle, parCanal,
  perfStats, occupationMensuelle, periodOf, previousYearPeriod, monthsOf, inScope, nuitsDans,
  remplissageAVenir, canalOf,
} from './engine'

const TODAY = '2026-09-28'

const sejours = [
  // Airbnb passé, commission connue
  { id: 's1', logement: 'Studio', date_arrivee: '2026-09-10', date_depart: '2026-09-13', montant: 300, commission_montant: 46.5, contrat_plateforme: 'airbnb' },
  // Booking passé, commission inconnue
  { id: 's2', logement: 'Studio', date_arrivee: '2026-08-01', date_depart: '2026-08-05', montant: 400, commission_montant: null, contrat_plateforme: 'booking' },
  // À venir
  { id: 's3', logement: 'T2', date_arrivee: '2026-10-05', date_depart: '2026-10-08', montant: 500, contrat_plateforme: 'airbnb', commission_montant: 77.5 },
  // Lié à un contrat signé : ne doit compter qu'une fois (via le contrat)
  { id: 's4', logement: 'T2', date_arrivee: '2026-09-20', date_depart: '2026-09-22', montant: 250, contrat_plateforme: null },
  // Lié à un contrat pas encore signé : le séjour reste la ligne
  { id: 's5', logement: 'T2', date_arrivee: '2026-07-01', date_depart: '2026-07-03', montant: 180, contrat_plateforme: null },
]
const contracts = [
  { id: 'c1', sejour_id: 's4', statut: 'signe', montant_loyer: 250, date_arrivee: '2026-09-20', date_depart: '2026-09-22', logement_nom: 'T2', logement_id: 'l2', stripe_payment_enabled: true, stripe_payment_status: null },
  { id: 'c2', sejour_id: 's5', statut: 'en_attente', montant_loyer: 180, date_arrivee: '2026-07-01', date_depart: '2026-07-03', logement_nom: 'T2', logement_id: 'l2' },
]
const entries = [
  { id: 'e1', logement_nom: 'Studio', montant: 120, date_paiement: '2026-09-02', mode_paiement: 'virement', type_paiement: 'loyer', description: null },
  { id: 'e2', logement_nom: 'Studio', montant: 300, date_paiement: '2026-09-02', mode_paiement: 'virement', type_paiement: 'caution', description: null },
]
const charges = buildChargeLines([
  { id: 'k1', logement_nom: 'Studio', montant: 60, date_charge: '2026-09-05', categorie: 'menage' },
  { id: 'k2', logement_nom: 'Studio', montant: 1000, date_charge: '2026-01-10', categorie: 'amortissement', duree_amortissement_annees: 5 },
  { id: 'k3', logement_nom: 'T2', montant: 40, date_charge: '2026-10-02', categorie: 'energie' },
])

const lines = buildRevenueLines({ sejours, contracts, entries, today: TODAY })

describe('buildRevenueLines', () => {
  it('compte une seule fois un séjour lié à un contrat signé', () => {
    expect(lines.filter(l => l.date === '2026-09-20')).toHaveLength(1)
    expect(lines.find(l => l.id === 'contract:c1')?.statut).toBe('a_encaisser')
  })
  it("garde le séjour quand le contrat n'est pas signé", () => {
    expect(lines.find(l => l.id === 'sejour:s5')).toBeTruthy()
    expect(lines.find(l => l.id === 'contract:c2')).toBeUndefined()
  })
  it('séjour futur = à venir, caution hors revenus, commission inconnue = null', () => {
    expect(lines.find(l => l.id === 'sejour:s3')?.statut).toBe('a_venir')
    expect(lines.find(l => l.id === 'e2')?.horsRevenus).toBe(true)
    expect(lines.find(l => l.id === 'sejour:s2')?.commission).toBeNull()
    expect(lines.find(l => l.id === 'sejour:s5')?.commission).toBe(0)
  })
})

describe('totaux', () => {
  const p = periodOf('annee', TODAY)
  const t = totaux(lines, charges, [], p.start, p.end, TODAY)
  it('sépare revenus passés et à venir, ignore la caution', () => {
    // 300 + 400 + 250 + 180 + 120
    expect(t.revenus).toBe(1250)
    expect(t.aVenir).toBe(500)
    expect(t.aEncaisser).toBe(250)
  })
  it('commissions connues seulement, compte les manquantes', () => {
    expect(t.commissions).toBe(46.5)
    expect(t.sansCommission).toBe(1)
  })
  it('charges passées hors amortissement, bénéfice cohérent', () => {
    expect(t.charges).toBe(60)
    expect(t.benefice).toBe(1250 - 46.5 - 60)
  })
})

describe('séries et canaux', () => {
  it('série mensuelle = somme des totaux', () => {
    const p = periodOf('annee', TODAY)
    const serie = serieMensuelle(lines, charges, monthsOf(p), TODAY)
    const t = totaux(lines, charges, [], p.start, p.end, TODAY)
    expect(serie.reduce((s, m) => s + m.revenus, 0)).toBe(t.revenus)
    expect(serie.find(m => m.mois === '2026-10')?.aVenir).toBe(500)
  })
  it('par canal : net = brut − commission connue', () => {
    const c = parCanal(lines, '2026-01-01', '2026-12-31', TODAY)
    const airbnb = c.find(x => x.canal === 'airbnb')!
    expect(airbnb.brut).toBe(300)
    expect(airbnb.net).toBe(253.5)
    expect(c.find(x => x.canal === 'booking')?.sansCommission).toBe(1)
  })
})

describe('occupation', () => {
  const occ = buildOccupation(lines, [
    { id: 'i1', logementName: 'Studio', dateArrivee: '2026-09-10', dateDepart: '2026-09-13', platform: 'airbnb' }, // doublon du séjour s1
    { id: 'i2', logementName: 'Studio', dateArrivee: '2026-09-15', dateDepart: '2026-09-17', platform: 'airbnb' },
  ])
  it('ajoute les réservations iCal non saisies, sans doublon', () => {
    expect(occ.filter(o => o.arrivee === '2026-09-10')).toHaveLength(1)
    expect(occ.find(o => o.arrivee === '2026-09-15')?.avecMontant).toBe(false)
  })
  it('nuits dans une période', () => {
    expect(nuitsDans('2026-08-30', '2026-09-03', '2026-09-01', '2026-09-30')).toBe(2)
    expect(nuitsDans('2026-09-10', '2026-09-13', '2026-09-01', '2026-09-30')).toBe(3)
  })
  it('occupation du Studio en septembre jusqu’au 28', () => {
    const studio = occ.filter(o => inScope(o, { logement: { id: null, nom: 'studio' } }))
    const s = perfStats(lines.filter(l => inScope(l, { logement: { id: null, nom: 'Studio' } })), studio, 1, '2026-09-01', '2026-09-30', TODAY)
    // s1 3 nuits + i2 2 nuits sur 28 jours
    expect(s.nuitsReservees).toBe(5)
    expect(s.nuitsDispo).toBe(28)
    expect(s.adr).toBe(100)
    expect(s.revpar).toBeCloseTo(100 * 5 / 28, 1)
    const m = occupationMensuelle(studio, ['2026-09', '2026-10'], 1, TODAY)
    expect(m[1].occupation).toBeNull()
  })
  it('remplissage à venir', () => {
    expect(remplissageAVenir(occ.filter(o => o.logementNom === 'T2'), 30, 1, TODAY)).toBeCloseTo(3 / 30, 5)
  })
})

describe('périodes et portée', () => {
  it('périodes', () => {
    expect(periodOf('mois', TODAY)).toMatchObject({ start: '2026-09-01', end: '2026-09-30' })
    expect(periodOf('12mois', TODAY).start).toBe('2025-10-01')
    expect(periodOf('annee-1', TODAY)).toMatchObject({ start: '2025-01-01', end: '2025-12-31' })
    expect(previousYearPeriod(periodOf('annee', TODAY)).start).toBe('2025-01-01')
    expect(monthsOf(periodOf('3mois', TODAY))).toEqual(['2026-07', '2026-08', '2026-09'])
  })
  it('portée : par id ou par nom insensible à la casse', () => {
    expect(inScope({ logementId: 'l2', logementNom: 'X' }, { logement: { id: 'l2', nom: 'T2' } })).toBe(true)
    expect(inScope({ logementId: null, logementNom: ' t2 ' }, { logement: { id: 'l2', nom: 'T2' } })).toBe(true)
    expect(inScope({ logementId: null, logementNom: 'Studio' }, { logement: { id: 'l2', nom: 'T2' } })).toBe(false)
    expect(inScope({ logementId: null, logementNom: 'Studio' }, { logement: null })).toBe(true)
  })
  it('canaux', () => {
    expect(canalOf('Airbnb')).toBe('airbnb')
    expect(canalOf(null)).toBe('direct')
    expect(canalOf('abritel')).toBe('vrbo')
    expect(canalOf('leboncoin')).toBe('autre')
  })
})

describe('nuitsParJour', () => {
  it('compte chaque nuit sur son jour (lundi = 0)', async () => {
    const { nuitsParJour } = await import('./engine')
    // 2026-09-14 est un lundi : nuits lun, mar, mer
    const r = nuitsParJour([{ logementNom: 'S', logementId: null, arrivee: '2026-09-14', depart: '2026-09-17', canal: 'airbnb', avecMontant: true, createdAt: null }], '2026-09-01', '2026-09-30', '2026-09-28')
    expect(r).toEqual([1, 1, 1, 0, 0, 0, 0])
  })
})
