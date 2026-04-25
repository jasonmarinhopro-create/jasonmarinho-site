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

export async function bulkImportRevenusEntries(entries: EntryInput[]) {
  if (!entries.length) return { error: 'Aucune ligne à importer' }
  if (entries.length > 500) return { error: 'Maximum 500 lignes par import' }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const userId = session.user.id

  // Check for duplicates against existing entries (same date + amount + logement)
  const { data: existing } = await supabase
    .from('revenus_entries')
    .select('logement_nom, montant, date_paiement')
    .eq('user_id', userId)

  const existingKeys = new Set(
    (existing ?? []).map(e => `${e.logement_nom}|${e.date_paiement}|${e.montant}`),
  )

  const toInsert = entries
    .filter(e => !existingKeys.has(`${e.logement_nom}|${e.date_paiement}|${e.montant}`))
    .map(e => ({ ...e, user_id: userId }))

  const skipped = entries.length - toInsert.length
  if (toInsert.length === 0) {
    return { inserted: 0, skipped, message: 'Toutes les lignes existent déjà.' }
  }

  const { data, error } = await supabase
    .from('revenus_entries')
    .insert(toInsert)
    .select()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  return { inserted: data?.length ?? 0, skipped, entries: data ?? [] }
}
