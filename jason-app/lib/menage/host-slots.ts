// Chargement des créneaux ménage d'un hôte (contrats + séjours + réservations
// iCal Airbnb/Booking/Vrbo), partagé par :
//   - /api/calendar/menage-feed (flux iCal envoyé à l'équipe),
//   - /dashboard/ma-fiche-menage/planning (espace de l'équipe).
// Le client Supabase est passé par l'appelant (service role : ces deux usages
// lisent les données d'un hôte qui n'est pas l'utilisateur connecté, après
// vérification du token de partage).

import type { SupabaseClient } from '@supabase/supabase-js'
import { computeMenageSlots, type Occupation, type LogementSettings, type MenageSlot } from './compute'
import { icalOccupationsForMenage } from './ical-occupations'

export async function loadHostMenageSlots(
  db: SupabaseClient,
  hostId: string,
  fromDate: string,
  toDate: string,
): Promise<MenageSlot[]> {
  const [
    { data: contractsRaw },
    { data: sejours },
    { data: logements },
    { data: icalFeeds },
    { data: icalEvents },
  ] = await Promise.all([
    // Statut filtré en JS : .neq('statut', 'annule') excluait aussi les
    // contrats au statut NULL (NULL <> 'annule' vaut NULL en SQL).
    db.from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, sejour_id, statut')
      .eq('user_id', hostId),
    db.from('sejours')
      .select('id, logement, date_arrivee, date_depart')
      .eq('user_id', hostId)
      .is('annule_at', null)
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    db.from('logements')
      .select('id, nom, adresse, menage_duree_min, menage_heure_defaut, menage_notes, contact_menage_nom, contact_menage_tel, frais_menage, ical_airbnb, ical_booking, ical_vrbo, ical_autre')
      .eq('user_id', hostId),
    db.from('ical_feeds').select('id, url').eq('user_id', hostId),
    db.from('ical_events')
      .select('id, feed_id, title, description, start_date, end_date')
      .eq('user_id', hostId)
      .gte('end_date', fromDate)
      .lte('start_date', toDate),
  ])

  const contracts = (contractsRaw ?? []).filter(c => c.statut !== 'annule')
  const sejourIdsWithContract = new Set(contracts.map(c => c.sejour_id as string | null).filter((v): v is string => !!v))

  const occupations: Occupation[] = []
  for (const c of contracts) {
    if (!c.date_arrivee || !c.date_depart) continue
    occupations.push({ sourceId: `contract-${c.id}`, source: 'contract', logementName: c.logement_nom ?? '', dateArrivee: c.date_arrivee, dateDepart: c.date_depart })
  }
  for (const s of (sejours ?? []) as Array<{ id: string; logement: string | null; date_arrivee: string; date_depart: string }>) {
    if (sejourIdsWithContract.has(s.id)) continue
    occupations.push({ sourceId: `sejour-${s.id}`, source: 'sejour', logementName: s.logement ?? '', dateArrivee: s.date_arrivee, dateDepart: s.date_depart })
  }
  // Après les séjours/contrats : à date égale, la saisie manuelle prime.
  occupations.push(...icalOccupationsForMenage(logements ?? [], icalFeeds ?? [], icalEvents ?? []))

  const settings: LogementSettings[] = (logements ?? []).map((l: any) => ({
    id: l.id,
    nom: l.nom ?? 'Logement',
    menageDureeMin: l.menage_duree_min ?? 180,
    menageHeureDefaut: l.menage_heure_defaut ?? '11:00',
    menageNotes: l.menage_notes ?? null,
    adresse: l.adresse ?? null,
    contactMenageNom: l.contact_menage_nom ?? null,
    contactMenageTel: l.contact_menage_tel ?? null,
    fraisMenage: l.frais_menage ?? null,
  }))

  return computeMenageSlots(occupations, settings, { fromDate, toDate })
}

/** Clé de rapprochement d'un créneau : date + nom de logement normalisé. */
export function menageKey(date: string, logementName: string): string {
  return `${date}|${logementName.trim().toLowerCase()}`
}
