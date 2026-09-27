import { describe, expect, it } from 'vitest'
import { icalReservationsForDisplay } from './display'

const logements = [{ nom: 'Casa do Pedreiro', ical_airbnb: 'https://www.airbnb.fr/calendar/ical/1.ics?s=x', ical_booking: 'https://admin.booking.com/hotel/ical.ics?t=y' }]
const feeds = [
  { id: 'air', url: 'https://www.airbnb.fr/calendar/ical/1.ics?s=x', name: 'Airbnb Casa' },
  { id: 'bk', url: 'https://admin.booking.com/hotel/ical.ics?t=y', name: 'Booking Casa' },
  { id: 'free', url: 'https://www.airbnb.fr/calendar/ical/2.ics', name: 'Studio (sans fiche)' },
]
const ev = (id: string, feed_id: string, title: string, start: string, end: string) =>
  ({ id, feed_id, title, description: null, start_date: start, end_date: end })

describe('icalReservationsForDisplay', () => {
  it('nomme la plateforme et le logement, départ = dernière nuit + 1', () => {
    const [r] = icalReservationsForDisplay(logements, feeds, [ev('1', 'air', 'Reserved', '2026-10-03', '2026-10-04')])
    expect(r).toMatchObject({ label: 'Réservation Airbnb', logementName: 'Casa do Pedreiro', dateArrivee: '2026-10-03', dateDepart: '2026-10-05' })
  })

  it('garde les « CLOSED » Booking courts comme réservations, ignore les blocages Airbnb', () => {
    const r = icalReservationsForDisplay(logements, feeds, [
      ev('b', 'bk', 'CLOSED - Not available', '2026-10-10', '2026-10-12'),
      ev('x', 'air', 'Airbnb (Not available)', '2026-10-10', '2026-10-12'),
    ])
    expect(r.map(x => x.id)).toEqual(['b'])
    expect(r[0].label).toBe('Réservation Booking')
  })

  it('retombe sur le nom du flux quand il n’est relié à aucune fiche logement', () => {
    const [r] = icalReservationsForDisplay(logements, feeds, [ev('f', 'free', 'Reserved', '2026-10-01', '2026-10-01')])
    expect(r.logementName).toBe('Studio (sans fiche)')
  })
})
