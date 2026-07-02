import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import ReservationsView from './ReservationsView'
import type { Reservation, LogementLite } from './types'
import { computeMenageSlots, mergeAutoAndManual, type LogementSettings, type Occupation, type MenageSlot } from '@/lib/menage/compute'

export const metadata = { title: 'Mes réservations' }
export const revalidate = 30

/**
 * Page "Mes réservations" (Étape 7bis du refactor dashboard).
 * Detachee du /calendrier — page dediee au pilotage des reservations
 * avec stats, filtres, tri, vues cartes/tableau et drawer de detail.
 *
 * Fusionne contracts + sejours en un modele unique de Reservation. Les
 * contracts prevalent : si un sejour est deja rattache a un contrat via
 * sejour_id, on garde uniquement le contract (evite les doublons).
 */
export default async function ReservationsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  const supabase = await createClient()
  const userId = profile.userId

  // Fields aligned with real DB schema. Notes :
  // - contracts n'a PAS : source, nb_voyageurs, logement_id
  // - sejours n'a PAS : logement_id, nb_voyageurs — logement est en texte libre
  // - voyageurs.source contient la plateforme (Airbnb/Booking/Direct/...)
  //   → source de verite fiable pour badger la source de la resa.
  const [
    { data: contracts },
    { data: sejoursRaw },
    { data: logementsRaw },
    { data: events },
    { data: profileRow },
  ] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, logement_nom, date_arrivee, date_depart, statut, checklist_status, sejour_id, montant_loyer, locataire_prenom, locataire_nom, locataire_email, locataire_telephone, stripe_payment_status, stripe_payment_enabled')
      .eq('user_id', userId)
      .neq('statut', 'annule')
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    supabase
      .from('sejours')
      .select('id, voyageur_id, logement, date_arrivee, date_depart, montant, contrat_statut, contrat_plateforme, voyageurs(prenom, nom, email, telephone, source)')
      .eq('user_id', userId)
      .not('date_arrivee', 'is', null)
      .not('date_depart', 'is', null),
    // Logements avec settings menage (heure defaut, duree, notes) — necessaires
    // pour computeMenageSlots + le modal Planning menage.
    supabase
      .from('logements')
      .select('id, nom, adresse, menage_duree_min, menage_heure_defaut, menage_notes, contact_menage_nom, contact_menage_tel, frais_menage')
      .eq('user_id', userId)
      .order('nom'),
    // Events "menage" manuels (via +Evenement dans le calendrier).
    supabase
      .from('calendar_events')
      .select('id, title, date, end_date, start_time, end_time, description, category')
      .eq('user_id', userId)
      .eq('category', 'menage'),
    // profile.ical_token + full_name pour le modal (lien iCal + signature PDF).
    supabase
      .from('profiles')
      .select('ical_token, full_name')
      .eq('id', userId)
      .maybeSingle(),
  ])

  // Contracts qui pointent sur un sejour → on skip le sejour pour ne pas dupliquer
  const sejourIdsWithContract = new Set(
    (contracts ?? [])
      .map(c => (c as any).sejour_id as string | null)
      .filter((v): v is string => !!v),
  )

  const reservations: Reservation[] = []

  // Contracts d'abord (plus riche : contrat signe, paiement, etc.)
  // NB : la source d'un contrat manuel = 'direct' (pas de champ dedie).
  ;(contracts ?? []).forEach(c => {
    const nom = [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ').trim() || 'Voyageur'
    reservations.push({
      id: `contract-${c.id}`,
      source: 'contract',
      sourceId: c.id,
      voyageur_id: null,
      voyageur_name: nom,
      voyageur_email: c.locataire_email ?? null,
      voyageur_phone: c.locataire_telephone ?? null,
      logement_id: null,
      logement_name: c.logement_nom ?? 'Logement',
      date_arrivee: c.date_arrivee,
      date_depart: c.date_depart,
      montant: c.montant_loyer ?? null,
      nb_voyageurs: null,
      platform: 'direct',
      contract_status: c.statut ?? null,
      payment_status: c.stripe_payment_enabled ? (c.stripe_payment_status ?? null) : null,
      checklist_status: (c.checklist_status as Record<string, boolean>) ?? null,
    })
  })

  // Puis les sejours (uniquement ceux sans contract lie)
  ;(sejoursRaw ?? [])
    .filter((s: any) => !sejourIdsWithContract.has(s.id))
    .forEach((s: any) => {
      const v = s.voyageurs as { prenom?: string; nom?: string; email?: string; telephone?: string; source?: string } | null
      const nom = v ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || 'Voyageur' : 'Voyageur'
      // Detection source : priorite au champ voyageurs.source (source de
      // verite renseignee par les syncs iCal Airbnb/Booking), fallback
      // sur sejours.contrat_plateforme.
      const rawSource = v?.source ?? s.contrat_plateforme ?? null
      reservations.push({
        id: `sejour-${s.id}`,
        source: 'sejour',
        sourceId: s.id,
        voyageur_id: s.voyageur_id ?? null,
        voyageur_name: nom,
        voyageur_email: v?.email ?? null,
        voyageur_phone: v?.telephone ?? null,
        logement_id: null,
        logement_name: s.logement ?? 'Logement',
        date_arrivee: s.date_arrivee,
        date_depart: s.date_depart,
        montant: s.montant ?? null,
        nb_voyageurs: null,
        platform: normalizePlatform(rawSource),
        contract_status: s.contrat_statut ?? null,
        payment_status: null,
        checklist_status: null,
      })
    })

  const logements: LogementLite[] = (logementsRaw ?? []).map((l: any) => ({
    id: l.id, nom: l.nom ?? 'Logement',
  }))

  // ─── Planning menage — meme calcul que /calendrier ──────────────────
  // Fusionne contracts + sejours (sans doublons via sejourIdsWithContract)
  // en Occupation[], puis computeMenageSlots + mergeAutoAndManual pour
  // integrer les menages manuels du calendrier.
  const logementSettings: LogementSettings[] = (logementsRaw ?? []).map((l: any) => ({
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

  const occupations: Occupation[] = []
  for (const c of contracts ?? []) {
    if (!c.date_arrivee || !c.date_depart) continue
    occupations.push({
      sourceId: `contract-${c.id}`,
      source: 'contract',
      logementName: c.logement_nom ?? '',
      dateArrivee: c.date_arrivee,
      dateDepart: c.date_depart,
      voyageurLabel: [c.locataire_prenom, c.locataire_nom].filter(Boolean).join(' ').trim() || null,
    })
  }
  for (const s of (sejoursRaw ?? []) as any[]) {
    if (!s.date_arrivee || !s.date_depart) continue
    if (sejourIdsWithContract.has(s.id)) continue
    const v = s.voyageurs as { prenom?: string; nom?: string } | null
    const voyageurLabel = v
      ? `${v.prenom ?? ''} ${v.nom ?? ''}`.trim() || null
      : null
    occupations.push({
      sourceId: `sejour-${s.id}`,
      source: 'sejour',
      logementName: s.logement ?? '',
      dateArrivee: s.date_arrivee,
      dateDepart: s.date_depart,
      voyageurLabel,
    })
  }

  const autoSlots = computeMenageSlots(occupations, logementSettings)
  const manualMenageEvents = (events ?? []).map(e => ({
    id: e.id, date: e.date,
    startTime: e.start_time, endTime: e.end_time,
    title: e.title, description: e.description,
  }))
  const menageSlots: MenageSlot[] = mergeAutoAndManual(autoSlots, manualMenageEvents, logementSettings)

  // done_ids : slots deja marques FAIT via un calendar_event dedie
  // (description contient [FAIT]) — meme logique que dans le calendrier.
  const doneIds: string[] = []
  for (const slot of menageSlots) {
    const logementLow = slot.logementName.trim().toLowerCase()
    const isDone = (events ?? []).some(e =>
      e.date === slot.date
      && (e.title ?? '').toLowerCase().includes(logementLow)
      && (e.description ?? '').includes('[FAIT]'),
    )
    if (isDone) doneIds.push(slot.id)
  }

  const logementNames: string[] = logementSettings.map(l => l.nom).filter(Boolean)
  const logementIdByName: Record<string, string> = {}
  for (const l of logementSettings) {
    if (l.nom) logementIdByName[l.nom] = l.id
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
  const icalToken = (profileRow as any)?.ical_token ?? null
  const hostName = (profileRow as any)?.full_name ?? null

  return (
    <ReservationsView
      reservations={reservations}
      logements={logements}
      menageSlots={menageSlots}
      menageDoneIds={doneIds}
      menageLogementNames={logementNames}
      menageLogementIdByName={logementIdByName}
      appUrl={appUrl}
      icalToken={icalToken}
      hostName={hostName}
    />
  )
}

/** Normalise n'importe quel champ source/plateforme vers un identifiant clair. */
function normalizePlatform(raw: string | null | undefined): Reservation['platform'] {
  if (!raw) return 'direct'
  const s = String(raw).toLowerCase()
  if (s.includes('airbnb')) return 'airbnb'
  if (s.includes('booking')) return 'booking'
  if (s.includes('driing')) return 'driing'
  if (s.includes('vrbo') || s.includes('abritel')) return 'vrbo'
  return 'direct'
}
