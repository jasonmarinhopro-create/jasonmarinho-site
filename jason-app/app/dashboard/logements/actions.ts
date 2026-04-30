'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'

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
  revalidatePath('/dashboard/logements')
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
  revalidatePath('/dashboard/logements')
  return {}
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
  return {}
}
