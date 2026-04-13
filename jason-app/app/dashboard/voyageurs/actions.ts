'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type VoyageurData = {
  prenom: string
  nom: string
  email?: string
  telephone?: string
  notes?: string
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
