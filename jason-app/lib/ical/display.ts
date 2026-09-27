// Réservations Airbnb / Booking / Vrbo importées par iCal, prêtes à afficher
// (accueil : « À faire aujourd'hui », prochaines arrivées et départs).
// Avant (sept. 2026), l'accueil affichait le titre brut (« Reserved ») sans le
// logement, prenait la dernière nuit pour le jour du départ (un jour trop tôt)
// et ignorait les réservations Booking exportées en « CLOSED - Not available »,
// contrairement au planning ménage. Mêmes règles que lib/menage/ical-occupations.ts.
import { isBlockedIcalEvent } from './blocked'
import {
  addDaysIso, icalNights, isBookingFeedUrl, normalizeIcalUrl, BOOKING_MAX_NIGHTS_AS_RESERVATION,
  type LogementIcalRow, type IcalEventRow,
} from '@/lib/menage/ical-occupations'

export interface DisplayFeedRow { id: string; url: string | null; name?: string | null }

export interface IcalDisplayReservation {
  id: string
  label: string
  logementName: string | null
  dateArrivee: string
  /** Jour du départ (dernière nuit + 1). */
  dateDepart: string
  platform: 'airbnb' | 'booking' | 'vrbo' | null
}

const PLATFORM_LABEL = { airbnb: 'Airbnb', booking: 'Booking', vrbo: 'Vrbo' } as const

export function icalPlatformOf(url: string | null | undefined): 'airbnb' | 'booking' | 'vrbo' | null {
  try {
    const host = new URL(normalizeIcalUrl(url)).hostname.toLowerCase()
    if (host.includes('airbnb')) return 'airbnb'
    if (host.includes('booking')) return 'booking'
    if (host.includes('vrbo') || host.includes('abritel') || host.includes('homeaway')) return 'vrbo'
    return null
  } catch { return null }
}

// Titres génériques des plateformes, sans nom de voyageur
const GENERIC_TITLE = /^(reserved|réservé|closed|airbnb \(not available\)|not available|unavailable|booked)\b/i

export function icalReservationsForDisplay(
  logements: LogementIcalRow[],
  feeds: DisplayFeedRow[],
  events: IcalEventRow[],
): IcalDisplayReservation[] {
  const nomByUrl = new Map<string, string>()
  for (const l of logements) {
    if (!l.nom) continue
    for (const u of [l.ical_airbnb, l.ical_booking, l.ical_vrbo, l.ical_autre]) {
      const k = normalizeIcalUrl(u)
      if (k) nomByUrl.set(k, l.nom)
    }
  }
  const feedById = new Map(feeds.map(f => [f.id, f]))

  const out: IcalDisplayReservation[] = []
  for (const e of events) {
    if (!e.start_date || !e.end_date) continue
    const feed = feedById.get(e.feed_id)
    if (isBlockedIcalEvent(e.title, e.description)) {
      const bookingResa = isBookingFeedUrl(feed?.url) && icalNights(e.start_date, e.end_date) <= BOOKING_MAX_NIGHTS_AS_RESERVATION
      if (!bookingResa) continue
    }
    const platform = icalPlatformOf(feed?.url)
    const title = (e.title ?? '').trim()
    out.push({
      id: e.id,
      label: !title || GENERIC_TITLE.test(title) ? `Réservation ${platform ? PLATFORM_LABEL[platform] : 'synchronisée'}` : title,
      platform,
      logementName: nomByUrl.get(normalizeIcalUrl(feed?.url)) ?? feed?.name ?? null,
      dateArrivee: e.start_date,
      dateDepart: addDaysIso(e.end_date, 1),
    })
  }
  return out
}
