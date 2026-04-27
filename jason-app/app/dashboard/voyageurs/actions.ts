'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type VoyageurData = {
  prenom: string
  nom: string
  email?: string
  telephone?: string
  notes?: string

  // Phase 1 — enrichissement
  tags?: string[]
  source?: string | null
  date_naissance?: string | null
  nationalite?: string | null
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  pays?: string | null
  id_verifie?: boolean
  id_url?: string | null
  id_type?: string | null
  preferences?: string[]
  note_privee?: number | null
  bloque?: boolean
  bloque_motif?: string | null
}

export type SejourData = {
  voyageur_id: string
  logement?: string
  date_arrivee: string
  date_depart: string
  montant?: number | null
  contrat_statut: 'signe' | 'en_attente' | 'non_requis' | 'nouveau' // non_requis conservé pour compatibilité avec les anciens séjours
  contrat_date_signature?: string | null
  contrat_lien?: string | null
}

async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return { supabase, session }
}

// ─── Check si un email/tel est signalé par la communauté ────────────────
// Utilisé à la création d'un voyageur pour alerter le hôte avant ajout
export async function checkVoyageurSignale(input: { email?: string; telephone?: string }): Promise<{
  signale: boolean
  count?: number
  motifs?: string[]
}> {
  const { supabase, session } = await getSession()
  if (!session) return { signale: false }

  const identifiers: string[] = []
  if (input.email?.trim()) identifiers.push(input.email.trim().toLowerCase())
  if (input.telephone?.trim()) identifiers.push(input.telephone.trim())
  if (identifiers.length === 0) return { signale: false }

  const { data } = await supabase
    .from('reported_guests')
    .select('incident_type')
    .in('identifier', identifiers)
    .eq('is_validated', true)
    .limit(10)

  if (!data || data.length === 0) return { signale: false }
  const motifs = Array.from(new Set(data.map((r: any) => r.incident_type as string).filter(Boolean)))
  return { signale: true, count: data.length, motifs }
}

// ─── Voyageurs ────────────────────────────────────────────────────────────────

export async function addVoyageur(data: VoyageurData): Promise<{ id?: string; error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data: row, error } = await supabase
    .from('voyageurs')
    .insert({ ...data, user_id: session.user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/voyageurs')
  return { id: row.id }
}

export async function updateVoyageur(id: string, data: VoyageurData): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('voyageurs')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/voyageurs')
  revalidatePath(`/dashboard/voyageurs/${id}`)
  return {}
}

export async function deleteVoyageur(id: string): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('voyageurs')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/voyageurs')
  return {}
}

// ─── Séjours ──────────────────────────────────────────────────────────────────

export async function addSejour(data: SejourData): Promise<{ id?: string; error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data: row, error } = await supabase
    .from('sejours')
    .insert({ ...data, user_id: session.user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${data.voyageur_id}`)
  return { id: row.id }
}

export async function updateSejour(
  id: string,
  voyageurId: string,
  data: Partial<SejourData>
): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('sejours')
    .update(data)
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return {}
}

export async function deleteSejour(id: string, voyageurId: string): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('sejours')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return {}
}
