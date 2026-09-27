import { describe, it, expect } from 'vitest'
import { icalOccupationsForMenage, normalizeIcalUrl, addDaysIso } from './ical-occupations'
import { computeMenageSlots } from './compute'

const logements = [
  { nom: 'Studio Vieux-Port', ical_airbnb: 'https://www.airbnb.fr/calendar/ical/123.ics?s=abc', ical_booking: 'webcal://admin.booking.com/hotel/ical/9.ics' },
  { nom: 'T2 Panier', ical_airbnb: 'https://www.airbnb.fr/calendar/ical/456.ics?s=def' },
]
const feeds = [
  { id: 'f1', url: 'https://www.airbnb.fr/calendar/ical/123.ics?s=abc' },
  { id: 'f2', url: 'https://admin.booking.com/hotel/ical/9.ics' },   // webcal:// côté logement
  { id: 'f3', url: 'https://exemple.com/non-rattache.ics' },          // flux manuel sans logement
]

describe('icalOccupationsForMenage', () => {
  it('relie chaque événement au logement par l’URL du flux', () => {
    const occ = icalOccupationsForMenage(logements, feeds, [
      { id: 'e1', feed_id: 'f1', title: 'Reserved', description: 'Reservation URL: https://airbnb.fr/x', start_date: '2026-10-01', end_date: '2026-10-03' },
      { id: 'e2', feed_id: 'f2', title: 'Réservation', description: null, start_date: '2026-10-10', end_date: '2026-10-11' },
    ])
    expect(occ.map(o => [o.logementName, o.dateDepart])).toEqual([
      ['Studio Vieux-Port', '2026-10-04'],
      ['Studio Vieux-Port', '2026-10-12'],
    ])
  })

  it('ignore les blocages et les flux non rattachés à un logement', () => {
    const occ = icalOccupationsForMenage(logements, feeds, [
      { id: 'e3', feed_id: 'f1', title: 'Airbnb (Not available)', description: null, start_date: '2026-11-01', end_date: '2027-10-01' },
      { id: 'e4', feed_id: 'f3', title: 'Reserved', description: null, start_date: '2026-10-01', end_date: '2026-10-03' },
      { id: 'e5', feed_id: 'f1', title: 'Reserved', description: null, start_date: '2026-10-01', end_date: null },
    ])
    expect(occ).toEqual([])
  })

  it('passe de la dernière nuit (stockée en base) au jour du départ, y compris en fin de mois', () => {
    expect(addDaysIso('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('normalise webcal:// et le slash final', () => {
    expect(normalizeIcalUrl(' webcal://a.com/x.ics/ ')).toBe('https://a.com/x.ics')
  })

  it('produit un créneau ménage le jour du départ, sans doublon avec un séjour saisi à la main', () => {
    const occ = [
      { sourceId: 'sejour-1', source: 'sejour' as const, logementName: 'T2 Panier', dateArrivee: '2026-10-01', dateDepart: '2026-10-05' },
      ...icalOccupationsForMenage(logements, [{ id: 'f4', url: 'https://www.airbnb.fr/calendar/ical/456.ics?s=def' }], [
        { id: 'e6', feed_id: 'f4', title: 'Reserved', description: 'Reservation URL: x', start_date: '2026-10-01', end_date: '2026-10-04' },
      ]),
    ]
    const slots = computeMenageSlots(occ, [], { fromDate: '2026-09-01', toDate: '2026-12-31' })
    expect(slots.filter(s => s.logementName === 'T2 Panier')).toHaveLength(1)
  })
})
