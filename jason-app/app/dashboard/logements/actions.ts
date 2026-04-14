'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/queries/profile'

export type LogementData = {
  nom: string
  adresse: string
  telephone?: string
  description?: string
  capacite_max: number
  reglement_interieur?: string
  conditions_annulation?: string
  animaux_acceptes: boolean
  fumeur_accepte: boolean
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
