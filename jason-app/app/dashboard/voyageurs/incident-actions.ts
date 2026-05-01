'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type IncidentType =
  | 'linge_tache'
  | 'casse'
  | 'salete'
  | 'degradation'
  | 'vol'
  | 'retard_restitution'
  | 'plainte_voisin'
  | 'autre'

export type IncidentStatut = 'ouvert' | 'resolu' | 'rembourse' | 'annule'

export type SejourIncident = {
  id: string
  user_id: string
  sejour_id: string
  type: IncidentType
  description: string | null
  photo_url: string | null
  caution_montant: number | null
  statut: IncidentStatut
  notes_internes: string | null
  created_at: string
  resolved_at: string | null
  updated_at: string
}

export type IncidentInput = {
  sejour_id: string
  type: IncidentType
  description?: string | null
  photo_url?: string | null
  caution_montant?: number | null
  notes_internes?: string | null
}

async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return { supabase, session }
}

export async function listIncidentsBySejours(sejourIds: string[]): Promise<SejourIncident[]> {
  if (sejourIds.length === 0) return []
  const { supabase, session } = await getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('sejour_incidents')
    .select('*')
    .in('sejour_id', sejourIds)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as SejourIncident[]
}

export async function createIncident(
  voyageurId: string,
  input: IncidentInput,
): Promise<{ id?: string; error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifie.' }

  const { data, error } = await supabase
    .from('sejour_incidents')
    .insert({
      user_id: session.user.id,
      sejour_id: input.sejour_id,
      type: input.type,
      description: input.description ?? null,
      photo_url: input.photo_url ?? null,
      caution_montant: input.caution_montant ?? null,
      notes_internes: input.notes_internes ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return { id: data.id }
}

export async function updateIncident(
  id: string,
  voyageurId: string,
  patch: Partial<Omit<SejourIncident, 'id' | 'user_id' | 'sejour_id' | 'created_at' | 'updated_at'>>,
): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifie.' }

  const updateBody: Record<string, unknown> = {
    ...patch,
    updated_at: new Date().toISOString(),
  }
  if (patch.statut && patch.statut !== 'ouvert' && !patch.resolved_at) {
    updateBody.resolved_at = new Date().toISOString()
  }
  if (patch.statut === 'ouvert') {
    updateBody.resolved_at = null
  }

  const { error } = await supabase
    .from('sejour_incidents')
    .update(updateBody)
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return {}
}

export async function deleteIncident(id: string, voyageurId: string): Promise<{ error?: string }> {
  const { supabase, session } = await getSession()
  if (!session) return { error: 'Non authentifie.' }

  const { error } = await supabase
    .from('sejour_incidents')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/voyageurs/${voyageurId}`)
  return {}
}
