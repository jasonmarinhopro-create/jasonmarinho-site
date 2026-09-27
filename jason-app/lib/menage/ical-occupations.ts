// Transforme les réservations importées par iCal (Airbnb, Booking, Vrbo…) en
// occupations pour le calcul des ménages (lib/menage/compute.ts).
//
// Les flux iCal ne sont pas liés à un logement en base (ical_feeds n'a pas de
// logement_id) : on retrouve le logement par l'URL, qui est celle saisie sur
// la fiche logement (logements.ical_airbnb / ical_booking / ical_vrbo /
// ical_autre). Un flux ajouté à la main dans le Calendrier sans être rattaché
// à une fiche logement est ignoré (impossible de savoir quel logement nettoyer).
//
// Les blocages (« Not available », « Closed »…) sont ignorés, comme partout
// ailleurs dans l'app (lib/ical/blocked.ts), SAUF sur les flux Booking.com :
// Booking exporte ses vraies réservations sous le titre « CLOSED - Not
// available », indiscernables d'un blocage manuel. Règle retenue (sept. 2026) :
// sur un flux Booking, un « CLOSED » de 30 nuits ou moins compte comme une
// réservation (un ménage est prévu au départ) ; au-delà, c'est une fermeture
// du logement. Contrepartie assumée : un blocage manuel court crée un créneau
// ménage en trop, que l'hôte peut supprimer.
//
// ATTENTION dates : parseIcalText (lib/ical/sync.ts) stocke end_date comme la
// DERNIÈRE NUIT (DTEND iCal exclusif moins 1 jour), alors que le calcul des
// ménages attend le jour du départ (= jour du ménage). On rajoute donc 1 jour.

import { isBlockedIcalEvent } from '@/lib/ical/blocked'
import type { Occupation } from './compute'

export interface LogementIcalRow {
  nom: string | null
  ical_airbnb?: string | null
  ical_booking?: string | null
  ical_vrbo?: string | null
  ical_autre?: string | null
}
export interface FeedRow { id: string; url: string | null }
export interface IcalEventRow {
  id: string
  feed_id: string
  title: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
}

/** 'YYYY-MM-DD' + n jours (calcul en UTC, sans décalage de fuseau). */
export function addDaysIso(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

export const BOOKING_MAX_NIGHTS_AS_RESERVATION = 30

export function isBookingFeedUrl(u: string | null | undefined): boolean {
  try {
    const host = new URL(normalizeIcalUrl(u)).hostname.toLowerCase()
    return host === 'booking.com' || host.endsWith('.booking.com')
  } catch { return false }
}

function nights(start: string, lastNight: string): number {
  const a = Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10))
  const b = Date.UTC(+lastNight.slice(0, 4), +lastNight.slice(5, 7) - 1, +lastNight.slice(8, 10))
  return Math.round((b - a) / 86_400_000) + 1
}

export function normalizeIcalUrl(u: string | null | undefined): string {
  return (u ?? '').trim().replace(/^webcal:\/\//i, 'https://').replace(/\/+$/, '')
}

export function icalOccupationsForMenage(
  logements: LogementIcalRow[],
  feeds: FeedRow[],
  events: IcalEventRow[],
): Occupation[] {
  const nomByUrl = new Map<string, string>()
  for (const l of logements) {
    if (!l.nom) continue
    for (const u of [l.ical_airbnb, l.ical_booking, l.ical_vrbo, l.ical_autre]) {
      const k = normalizeIcalUrl(u)
      if (k) nomByUrl.set(k, l.nom)
    }
  }
  const nomByFeed = new Map<string, string>()
  const bookingFeeds = new Set<string>()
  for (const f of feeds) {
    const nom = nomByUrl.get(normalizeIcalUrl(f.url))
    if (nom) nomByFeed.set(f.id, nom)
    if (isBookingFeedUrl(f.url)) bookingFeeds.add(f.id)
  }

  const out: Occupation[] = []
  for (const e of events) {
    const nom = nomByFeed.get(e.feed_id)
    if (!nom || !e.start_date || !e.end_date) continue
    if (isBlockedIcalEvent(e.title, e.description)) {
      const bookingResa = bookingFeeds.has(e.feed_id) && nights(e.start_date, e.end_date) <= BOOKING_MAX_NIGHTS_AS_RESERVATION
      if (!bookingResa) continue
    }
    out.push({
      sourceId: `ical-${e.id}`,
      source: 'ical',
      logementName: nom,
      dateArrivee: e.start_date,
      dateDepart: addDaysIso(e.end_date, 1),
    })
  }
  return out
}
