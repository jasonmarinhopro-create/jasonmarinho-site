import { describe, expect, it } from 'vitest'
import { icalCalendarDisplay } from './calendar-label'

describe('icalCalendarDisplay', () => {
  it('remplace « Reserved » par la plateforme de l\'URL', () => {
    expect(icalCalendarDisplay({ title: 'Reserved', feedUrl: 'https://www.airbnb.fr/calendar/ical/123.ics?s=x', feedColor: '#FF5A5F' }))
      .toEqual({ platformLabel: 'Airbnb', color: '#E0475B', title: 'Réservation Airbnb' })
  })
  it('Booking n\'est plus bleu', () => {
    const d = icalCalendarDisplay({ title: 'CLOSED - Not available', feedUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=1', feedColor: '#003B95' })
    expect(d.color).toBe('#D97706')
    expect(d.platformLabel).toBe('Booking')
  })
  it('garde un vrai titre', () => {
    expect(icalCalendarDisplay({ title: 'Marie Dupont', feedUrl: 'https://www.vrbo.com/icalendar/abc.ics' }).title).toBe('Marie Dupont')
  })
  it('flux inconnu : nom du flux et couleur choisie, sauf bleu', () => {
    expect(icalCalendarDisplay({ title: 'Reserved', feedUrl: 'https://exemple.fr/cal.ics', feedName: 'Gîtes de France', feedColor: '#2F9E5B' }))
      .toEqual({ platformLabel: null, color: '#2F9E5B', title: 'Réservation Gîtes de France' })
    expect(icalCalendarDisplay({ title: '', feedUrl: null, feedColor: 'var(--info)' }).color).toBe('#8B6D5E')
  })
})
