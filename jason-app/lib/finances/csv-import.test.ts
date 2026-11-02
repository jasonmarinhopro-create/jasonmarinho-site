import { describe, it, expect } from 'vitest'
import { importPlatformCsv, parseDate, detectDateOrder, parseAmount, matchLogement } from './csv-import'

// Extrait anonymisé de l'export « Recettes » d'Airbnb en français (02/11/2026) :
// dates au format mois/jour, montants mêlant point et virgule.
const AIRBNB = `Date,Arrivée au plus tard le,Type,Code de confirmation,Date de réservation,Date de début,Date de fin,Nuits,Voyageur,Logement,Détails,Code de référence,Devise,Montant,Versé,Frais de service,Frais de Versement sur carte bancaire,Frais de ménage,Revenus bruts,Taxes reversées par Airbnb,Année des revenus
10/31/2026,11/06/2026,Payout,,,,,,,,"Transfert vers X , IBAN 0000 (EUR)",M-1,EUR,,287.34,,,,,,
10/31/2026,,Réservation,HMA,10/11/2026,10/30/2026,11/01/2026,2,Voyageur Un,Studio du port ,,,EUR,287.34,,"65,66",,70.00,353.00,"13,20",2026
08/09/2026,08/14/2026,Payout,,,,,,,,"Transfert vers X , IBAN 0000 (EUR)",M-2,EUR,,789.03,,,,,,
08/09/2026,,Régularisation de la résolution,HMB,,08/05/2026,08/08/2026,3,Voyageur Deux,Studio du port ,Régularisation,,EUR,-150.00,,,,,-150.00,,2026
08/06/2026,,Réservation,HMB,08/03/2026,08/05/2026,08/08/2026,3,Voyageur Deux,Studio du port ,,,EUR,380.64,,"86,98",,70.00,467.62,"19,80",2026
`

describe('import CSV Airbnb', () => {
  it('lit les dates au format mois/jour de l’export français', () => {
    const r = importPlatformCsv(AIRBNB)
    expect(r.platform).toBe('airbnb')
    expect(r.dateOrder).toBe('mdy')
    expect(r.problems).toEqual([])
    expect(r.payouts).toBe(2)
    expect(r.stays).toHaveLength(2)
    const a = r.stays.find(s => s.code === 'HMA')!
    expect(a).toMatchObject({ date: '2026-10-31', arrivee: '2026-10-30', depart: '2026-11-01', nuits: 2, logement: 'Studio du port', voyageur: 'Voyageur Un', brut: 353, frais: 65.66, verse: 287.34 })
  })
  it('déduit la régularisation du séjour qu’elle concerne', () => {
    const b = importPlatformCsv(AIRBNB).stays.find(s => s.code === 'HMB')!
    expect(b).toMatchObject({ brut: 317.62, regularisation: -150, verse: 230.64, frais: 86.98 })
  })
  it('garde à part une régularisation sans séjour dans le fichier', () => {
    const csv = AIRBNB.split('\n').filter(l => !l.includes(',Réservation,HMB')).join('\n')
    const r = importPlatformCsv(csv)
    expect(r.orphanAdjustments).toEqual([{ code: 'HMB', montant: -150, date: '2026-08-09' }])
  })
})

describe('dates et montants', () => {
  it('déduit l’ordre jour/mois ou mois/jour du fichier entier', () => {
    expect(detectDateOrder(['10/31/2026', '09/05/2026'], 'airbnb')).toBe('mdy')
    expect(detectDateOrder(['31/10/2026', '05/09/2026'], 'airbnb')).toBe('dmy')
    expect(detectDateOrder(['05/09/2026'], 'airbnb')).toBe('mdy')
    expect(detectDateOrder(['05/09/2026'], 'booking')).toBe('dmy')
  })
  it('refuse une date qui n’existe pas au lieu de l’envoyer à la base', () => {
    expect(parseDate('10/31/2026', 'dmy')).toBeNull()
    expect(parseDate('10/31/2026', 'mdy')).toBe('2026-10-31')
    expect(parseDate('2026-02-30', 'dmy')).toBeNull()
    expect(parseDate('29/02/2028', 'dmy')).toBe('2028-02-29')
  })
  it('lit les montants français et anglais', () => {
    expect(parseAmount('65,66')).toBe(65.66)
    expect(parseAmount('1 234,56 €')).toBe(1234.56)
    expect(parseAmount('1,234.56')).toBe(1234.56)
    expect(parseAmount('-150.00')).toBe(-150)
    expect(parseAmount('')).toBeNull()
  })
})

describe('Booking.com', () => {
  it('jour/mois, commission en charge', () => {
    const csv = 'Numéro de réservation;Nom du client;Arrivée;Départ;Statut;Prix;Montant de la commission;Type de logement\n123;Client A;14/07/2026;17/07/2026;ok;450,00;67,50;Studio\n124;Client B;20/07/2026;21/07/2026;annulée;90;0;Studio'
    const r = importPlatformCsv(csv)
    expect(r.platform).toBe('booking')
    expect(r.cancelled).toBe(1)
    expect(r.stays[0]).toMatchObject({ date: '2026-07-14', nuits: 3, brut: 450, frais: 67.5, verse: 382.5 })
  })
})

describe('matchLogement', () => {
  it('retrouve le logement de l’app à partir du nom de l’annonce', () => {
    expect(matchLogement('L’Atoll de Clécy - Suite romantique', ['L\'Atoll de Clécy', 'Autre'])).toBe('L\'Atoll de Clécy')
    expect(matchLogement('Studio du port', ['studio du port'])).toBe('studio du port')
    expect(matchLogement('Maison', ['Maison A', 'Maison B'])).toBeNull()
  })
})
