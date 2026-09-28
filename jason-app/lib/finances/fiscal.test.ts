import { describe, it, expect } from 'vitest'
import { buildRevenueLines, buildChargeLines, type LogementFin } from './engine'
import { estimerFR, estimerPT, fiscalCategory, dotationAnnuelle, impotEstime } from './fiscal'

const TODAY = '2026-09-28'
const lg = (id: string, nom: string, extra: Partial<LogementFin> = {}): LogementFin => ({
  id, nom, pays: 'FR', ville: null, typeLogement: 'appartement', classementEtoiles: null, objectif: null, ...extra,
})

function sejour(id: string, logement: string, date: string, montant: number, plateforme = 'airbnb', commission: number | null = null) {
  return { id, logement, date_arrivee: date, date_depart: date, montant, contrat_plateforme: plateforme, commission_montant: commission }
}

describe('catégorie fiscale', () => {
  it('chambres d’hôtes, classé, non classé', () => {
    expect(fiscalCategory({ typeLogement: 'chambres-hotes', classementEtoiles: null })).toBe('cdh')
    expect(fiscalCategory({ typeLogement: 'appartement', classementEtoiles: 3 })).toBe('classe')
    expect(fiscalCategory({ typeLogement: 'appartement', classementEtoiles: 0 })).toBe('nonClasse')
  })
})

describe('estimerFR', () => {
  it('micro-BIC sur les recettes brutes (commissions non déduites)', () => {
    const lines = buildRevenueLines({ sejours: [sejour('a', 'Studio', '2026-03-01', 10000, 'airbnb', 1550)], contracts: [], entries: [], today: TODAY })
    const f = estimerFR({ lines, charges: [], logements: [lg('l1', 'Studio')], year: 2026, today: TODAY })
    expect(f.recettesAnnee).toBe(10000)
    expect(f.baseMicro).toBe(7000) // 30 % d'abattement sur 10 000
    expect(f.microEligible).toBe(true)
    expect(f.verdict).toBe('micro_a_completer') // pas d'amortissement saisi
  })

  it('non classé au-delà de 15 000 € : réel, ou micro si classement', () => {
    const lines = buildRevenueLines({ sejours: [sejour('a', 'Studio', '2026-03-01', 20000)], contracts: [], entries: [], today: TODAY })
    const f = estimerFR({ lines, charges: [], logements: [lg('l1', 'Studio')], year: 2026, today: TODAY })
    expect(f.microEligible).toBe(false)
    expect(f.verdict).toBe('reel_ou_classement')
  })

  it('classé : 50 % jusqu’à 83 600 €, au-delà réel obligatoire', () => {
    const lines = buildRevenueLines({ sejours: [sejour('a', 'Studio', '2026-03-01', 40000)], contracts: [], entries: [], today: TODAY })
    const f = estimerFR({ lines, charges: [], logements: [lg('l1', 'Studio', { classementEtoiles: 3 })], year: 2026, today: TODAY })
    expect(f.microEligible).toBe(true)
    expect(f.baseMicro).toBe(20000)
    const big = buildRevenueLines({ sejours: [sejour('b', 'Studio', '2026-03-01', 90000)], contracts: [], entries: [], today: TODAY })
    expect(estimerFR({ lines: big, charges: [], logements: [lg('l1', 'Studio', { classementEtoiles: 3 })], year: 2026, today: TODAY }).verdict).toBe('reel_obligatoire')
  })

  it('plafonds sur le foyer : tous les logements additionnés', () => {
    const lines = buildRevenueLines({
      sejours: [sejour('a', 'Studio', '2026-03-01', 9000), sejour('b', 'T2', '2026-04-01', 9000)],
      contracts: [], entries: [], today: TODAY,
    })
    const f = estimerFR({ lines, charges: [], logements: [lg('l1', 'Studio'), lg('l2', 'T2')], year: 2026, today: TODAY })
    expect(f.parCat.nonClasse).toBe(18000)
    expect(f.microEligible).toBe(false)
  })

  it('réel : recettes − commissions − charges − amortissements', () => {
    const lines = buildRevenueLines({ sejours: [sejour('a', 'Studio', '2026-03-01', 12000, 'airbnb', 1800)], contracts: [], entries: [], today: TODAY })
    const charges = buildChargeLines([
      { id: 'c1', logement_nom: 'Studio', montant: 2000, date_charge: '2026-02-01', categorie: 'menage', deductible: true },
      { id: 'c2', logement_nom: 'Studio', montant: 50000, date_charge: '2024-06-01', categorie: 'amortissement', duree_amortissement_annees: 25 },
    ])
    const f = estimerFR({ lines, charges, logements: [lg('l1', 'Studio')], year: 2026, today: TODAY })
    expect(f.amortissements).toBe(2000)
    expect(f.baseReel).toBe(12000 - 1800 - 2000 - 2000)
    expect(f.verdict).toBe('reel_conseille') // 6 200 < 8 400
  })

  it('ignore les lignes « ne pas déclarer » et les cautions', () => {
    const lines = buildRevenueLines({
      sejours: [{ ...sejour('a', 'Studio', '2026-03-01', 1000), a_declarer: false }],
      contracts: [], today: TODAY,
      entries: [{ id: 'e', logement_nom: 'Studio', montant: 500, date_paiement: '2026-03-02', type_paiement: 'caution' }],
    })
    const f = estimerFR({ lines, charges: [], logements: [lg('l1', 'Studio')], year: 2026, today: TODAY })
    expect(f.recettesAnnee).toBe(0)
    expect(f.exclues).toBe(1)
  })

  it('amortissement : dotation sur la durée seulement', () => {
    const [c] = buildChargeLines([{ id: 'x', logement_nom: 'S', montant: 1000, date_charge: '2024-05-01', categorie: 'amortissement', duree_amortissement_annees: 2 }])
    expect(dotationAnnuelle(c, 2024)).toBe(500)
    expect(dotationAnnuelle(c, 2025)).toBe(500)
    expect(dotationAnnuelle(c, 2026)).toBe(0)
  })

  it('impôt estimé = base × (tranche + 18,6 %)', () => {
    expect(impotEstime(10000, 0.3)).toBe(4860)
  })
})

describe('estimerPT', () => {
  it('coefficient 0,35 et seuil IVA 15 000 €', () => {
    const lines = buildRevenueLines({ sejours: [sejour('a', 'Casa', '2026-05-01', 12000)], contracts: [], entries: [], today: TODAY })
    const f = estimerPT({ lines, logements: [lg('p1', 'Casa', { pays: 'PT' })], year: 2026, today: TODAY })
    expect(f.base).toBe(4200)
    expect(f.seuilIva).toBe(15000)
    expect(f.sousSeuilIva).toBe(true)
  })
})
