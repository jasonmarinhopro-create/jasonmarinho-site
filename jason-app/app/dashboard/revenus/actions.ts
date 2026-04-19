'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface EntryInput {
  logement_nom: string
  montant: number
  date_paiement: string
  mode_paiement: string
  type_paiement: string
  description: string | null
}

export async function createRevenusEntry(input: EntryInput) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('revenus_entries')
    .insert({ ...input, user_id: session.user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  return { entry: data }
}

export async function deleteRevenusEntry(id: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('revenus_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  return { success: true }
}
