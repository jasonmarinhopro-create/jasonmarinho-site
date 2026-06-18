'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'
import { syncLogementIcalUrls } from '@/lib/ical/sync'
import { invalidateDashboardPrefill } from '@/lib/lcd/dashboard-prefill'

export type LogementData = {
  // Identité
  nom: string
  adresse: string
  telephone?: string
  description?: string
  type_logement?: string | null
  capacite_max: number

  // Caractéristiques physiques
  surface_m2?: number | null
  nb_chambres?: number | null
  nb_lits?: number | null
  nb_sdb?: number | null

  // Conformité & classement
  numero_enregistrement?: string | null
  classement_etoiles?: number | null
  dpe?: string | null

  // Tarifs
  tarif_nuitee_moyen?: number | null
  frais_menage?: number | null
  caution?: number | null

  // Équipements (slugs : wifi, parking, piscine, climatisation, lave-linge, lave-vaisselle, tv, jardin, terrasse, pmr, chauffage, ascenseur)
  equipements?: string[]

  // Liens annonces
  lien_airbnb?: string | null
  lien_booking?: string | null
  lien_gmb?: string | null
  lien_site_direct?: string | null
  lien_driing?: string | null

  // Photos
  photo_couverture_url?: string | null
  photos_urls?: string[]

  // Contacts utiles
  contact_urgence_nom?: string | null
  contact_urgence_tel?: string | null
  contact_menage_nom?: string | null
  contact_menage_tel?: string | null

  // Statut
  actif?: boolean

  // Spécifique conciergerie
  proprietaire_nom?: string | null
  proprietaire_email?: string | null
  proprietaire_telephone?: string | null
  honoraires_pct?: number | null

  // Conditions & règlement
  reglement_interieur?: string
  conditions_annulation?: string
  animaux_acceptes: boolean
  fumeur_accepte: boolean
  methodes_paiement?: string

  // Infos pratiques
  heure_arrivee?: string
  heure_depart?: string
  code_acces?: string
  wifi_nom?: string
  wifi_mdp?: string

  // Synchronisation calendrier (iCal)
  ical_airbnb?:  string | null
  ical_booking?: string | null
  ical_vrbo?:    string | null
  ical_autre?:   string | null

  // Pays + spécificités internationales
  pays?:         string | null  // ISO-2 ; default 'FR' côté DB
  numero_al?:    string | null  // Numéro Alojamento Local (PT)

  // Infos pratiques étendues (JSONB) : poubelles, restos, transports, urgences,
  // etc. Source pour l'auto-fill des gabarits voyageur. Voir
  // `lib/logements/infos-pratiques.ts` pour la forme exacte.
  infos_pratiques?: import('@/lib/logements/infos-pratiques').InfosPratiques | null
}

export type Logement = LogementData & {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export async function getLogements(): Promise<Logement[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('logements')
    .select('*')
    .eq('user_id', profile.userId)
    .order('created_at', { ascending: false })

  return (data ?? []) as Logement[]
}

export async function createLogement(data: LogementData): Promise<{ error?: string; id?: string }> {
  const profile = await getProfile()
  if (!profile) return { error: 'Non authentifié.' }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('logements')
    .insert({ ...data, user_id: profile.userId })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Bridge iCal : si des URLs sont fournies, on crée les feeds et on lance la sync
  const hasIcal = data.ical_airbnb || data.ical_booking || data.ical_vrbo || data.ical_autre
  if (hasIcal) {
    await syncLogementIcalUrls(supabase, profile.userId, data.nom, {
      ical_airbnb: data.ical_airbnb,
      ical_booking: data.ical_booking,
      ical_vrbo: data.ical_vrbo,
      ical_autre: data.ical_autre,
    })
    revalidatePath('/dashboard/calendrier')
  }

  revalidatePath('/dashboard/logements')
  await invalidateDashboardPrefill(profile.userId)
  return { id: row.id }
}

export async function updateLogement(id: string, data: Partial<LogementData>): Promise<{ error?: string }> {
  const profile = await getProfile()
  if (!profile) return { error: 'Non authentifié.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('logements')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', profile.userId)

  if (error) return { error: error.message }

  // Bridge iCal : si l'update touche au moins une URL iCal, on resync
  const touchesIcal =
    'ical_airbnb' in data || 'ical_booking' in data || 'ical_vrbo' in data || 'ical_autre' in data
  if (touchesIcal) {
    // Re-fetch le logement pour avoir le nom + l'ensemble des URLs (data ne contient
    // que les champs modifiés)
    const { data: full } = await supabase
      .from('logements')
      .select('nom, ical_airbnb, ical_booking, ical_vrbo, ical_autre')
      .eq('id', id)
      .eq('user_id', profile.userId)
      .single()
    if (full) {
      await syncLogementIcalUrls(supabase, profile.userId, full.nom, {
        ical_airbnb: full.ical_airbnb,
        ical_booking: full.ical_booking,
        ical_vrbo: full.ical_vrbo,
        ical_autre: full.ical_autre,
      })
      revalidatePath('/dashboard/calendrier')
    }
  }

  revalidatePath('/dashboard/logements')
  revalidatePath(`/dashboard/logements/${id}`)
  await invalidateDashboardPrefill(profile.userId)
  return {}
}

// ─── Sync iCal d'un logement (appelé depuis la fiche détail) ────────────────

export type LogementIcalFeedStatus = {
  source: 'airbnb' | 'booking' | 'vrbo' | 'autre'
  label: string
  url: string
  feedId: string | null
  lastSynced: string | null
  eventsCount: number
}

/**
 * Liste les URLs iCal du logement avec leur statut de sync (feed associé,
 * dernière synchro, nombre d'événements importés).
 */
export async function getLogementIcalStatus(logementId: string): Promise<LogementIcalFeedStatus[]> {
  const profile = await getProfile()
  if (!profile) return []

  const supabase = await createClient()
  const { data: logement } = await supabase
    .from('logements')
    .select('ical_airbnb, ical_booking, ical_vrbo, ical_autre')
    .eq('id', logementId)
    .eq('user_id', profile.userId)
    .single()
  if (!logement) return []

  const sources: Array<{ key: 'airbnb' | 'booking' | 'vrbo' | 'autre'; label: string; url: string | null }> = [
    { key: 'airbnb',  label: 'Airbnb',          url: logement.ical_airbnb },
    { key: 'booking', label: 'Booking.com',     url: logement.ical_booking },
    { key: 'vrbo',    label: 'Vrbo / Abritel',  url: logement.ical_vrbo },
    { key: 'autre',   label: 'Autre',           url: logement.ical_autre },
  ]

  const results: LogementIcalFeedStatus[] = []
  for (const s of sources) {
    if (!s.url) continue

    const { data: feed } = await supabase
      .from('ical_feeds')
      .select('id, last_synced')
      .eq('user_id', profile.userId)
      .eq('url', s.url)
      .maybeSingle()

    let eventsCount = 0
    if (feed?.id) {
      const { count } = await supabase
        .from('ical_events')
        .select('id', { count: 'exact', head: true })
        .eq('feed_id', feed.id)
        .eq('user_id', profile.userId)
      eventsCount = count ?? 0
    }

    results.push({
      source: s.key,
      label: s.label,
      url: s.url,
      feedId: feed?.id ?? null,
      lastSynced: feed?.last_synced ?? null,
      eventsCount,
    })
  }

  return results
}

/**
 * Force la synchro de toutes les URLs iCal d'un logement.
 * (Re-)crée les feeds manquants et lance fetchAndUpsertIcalFeed.
 */
export async function syncLogementIcalFeeds(
  logementId: string,
): Promise<{ synced: number; errors: string[]; error?: string }> {
  const profile = await getProfile()
  if (!profile) return { synced: 0, errors: [], error: 'Non authentifié.' }

  const supabase = await createClient()
  const { data: logement } = await supabase
    .from('logements')
    .select('nom, ical_airbnb, ical_booking, ical_vrbo, ical_autre')
    .eq('id', logementId)
    .eq('user_id', profile.userId)
    .single()
  if (!logement) return { synced: 0, errors: [], error: 'Logement introuvable.' }

  const result = await syncLogementIcalUrls(supabase, profile.userId, logement.nom, {
    ical_airbnb: logement.ical_airbnb,
    ical_booking: logement.ical_booking,
    ical_vrbo: logement.ical_vrbo,
    ical_autre: logement.ical_autre,
  })

  revalidatePath('/dashboard/calendrier')
  revalidatePath(`/dashboard/logements/${logementId}`)
  return result
}

export async function deleteLogement(id: string): Promise<{ error?: string }> {
  const profile = await getProfile()
  if (!profile) return { error: 'Non authentifié.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('logements')
    .delete()
    .eq('id', id)
    .eq('user_id', profile.userId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/logements')
  await invalidateDashboardPrefill(profile.userId)
  return {}
}

// ─── Stratégie tarifaire (prix par plateforme + saisonnalité) ──────────
export type PricingStrategy = {
  prix_airbnb_nuit?: number | null
  prix_booking_nuit?: number | null
  prix_direct_nuit?: number | null
  prix_saison_basse_pct?: number | null
  prix_saison_haute_pct?: number | null
}

/**
 * Met à jour la stratégie tarifaire d'un logement (prix par plateforme +
 * multiplicateurs saison). Ownership vérifié par user_id.
 *
 * Valide :
 *  - Prix : numérique positif ou null (= "non défini, j'utilise pas
 *    cette plateforme")
 *  - Pourcentages : entiers entre 30 et 200 (-70% à +100% du prix base)
 */
export async function updateLogementPricing(
  id: string,
  strategy: PricingStrategy,
): Promise<{ error?: string }> {
  const profile = await getProfile()
  if (!profile) return { error: 'Non authentifié.' }

  const clean: Record<string, number | null | string> = {
    prix_strategie_updated_at: new Date().toISOString(),
  }

  const priceFields = ['prix_airbnb_nuit', 'prix_booking_nuit', 'prix_direct_nuit'] as const
  for (const f of priceFields) {
    const v = strategy[f]
    if (v === null || v === undefined || v === ('' as unknown)) {
      clean[f] = null
    } else {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0 || n > 10000) {
        return { error: `${f} : valeur invalide (doit être entre 0 et 10 000 €).` }
      }
      clean[f] = Math.round(n * 100) / 100
    }
  }

  const pctFields = ['prix_saison_basse_pct', 'prix_saison_haute_pct'] as const
  for (const f of pctFields) {
    const v = strategy[f]
    if (v === null || v === undefined) continue
    const n = Number(v)
    if (!Number.isInteger(n) || n < 30 || n > 200) {
      return { error: `${f} : valeur invalide (doit être entre 30 et 200 %).` }
    }
    clean[f] = n
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('logements')
    .update(clean)
    .eq('id', id)
    .eq('user_id', profile.userId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calculateurs')
  revalidatePath('/dashboard/logements')
  await invalidateDashboardPrefill(profile.userId)
  return {}
}
