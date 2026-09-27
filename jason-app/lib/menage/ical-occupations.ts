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
// ailleurs dans l'app (lib/ical/blocked.ts).
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
  for (const f of feeds) {
    const nom = nomByUrl.get(normalizeIcalUrl(f.url))
    if (nom) nomByFeed.set(f.id, nom)
  }

  const out: Occupation[] = []
  for (const e of events) {
    const nom = nomByFeed.get(e.feed_id)
    if (!nom || !e.start_date || !e.end_date) continue
    if (isBlockedIcalEvent(e.title, e.description)) continue
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
