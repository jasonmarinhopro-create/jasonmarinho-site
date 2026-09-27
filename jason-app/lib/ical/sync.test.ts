import { describe, it, expect } from 'vitest'
import { parseIcalText } from './sync'

const AIRBNB = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261001',
  'DTEND;VALUE=DATE:20261004',
  'UID:1418fb94e984-abc@airbnb.com',
  'SUMMARY:Reserved',
  'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABC\\nPhone Number (',
  ' Last 4 Digits): 1234',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20261110',
  'DTEND;VALUE=DATE:20261112',
  'UID:closed-1@booking.com',
  'SUMMARY:CLOSED - Not available',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

describe('parseIcalText', () => {
  it('lit les réservations Airbnb et Booking (dates, uid, titre)', () => {
    const ev = parseIcalText(AIRBNB)
    expect(ev).toHaveLength(2)
    expect(ev[0]).toMatchObject({ uid: '1418fb94e984-abc@airbnb.com', title: 'Reserved', startDate: '2026-10-01', endDate: '2026-10-03' }) // DTEND exclusif moins 1 jour : dernière nuit
    expect(ev[1]).toMatchObject({ title: 'CLOSED - Not available', startDate: '2026-11-10', endDate: '2026-11-11' })
  })

  it('recolle les lignes repliées (RFC 5545) dans la description', () => {
    const ev = parseIcalText(AIRBNB)
    expect(ev[0].description).toContain('Phone Number (Last 4 Digits): 1234')
  })

  it('renvoie une liste vide pour un contenu qui n’est pas un calendrier', () => {
    expect(parseIcalText('<html>404</html>')).toEqual([])
  })
})
