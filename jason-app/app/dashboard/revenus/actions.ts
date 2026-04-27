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

export interface ChargeInput {
  logement_nom: string
  logement_id?: string | null
  montant: number
  date_charge: string
  categorie: string
  description?: string | null
  deductible?: boolean
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

// ─── Charges & dépenses ──────────────────────────────────────────────────────

export async function createCharge(input: ChargeInput) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('revenus_charges')
    .insert({
      user_id: session.user.id,
      logement_nom: input.logement_nom,
      logement_id: input.logement_id ?? null,
      montant: input.montant,
      date_charge: input.date_charge,
      categorie: input.categorie,
      description: input.description ?? null,
      deductible: input.deductible ?? true,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  return { charge: data }
}

export async function updateCharge(id: string, input: Partial<ChargeInput>) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const patch: any = { ...input, updated_at: new Date().toISOString() }
  delete patch.id

  const { error } = await supabase
    .from('revenus_charges')
    .update(patch)
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  return { success: true }
}

export async function deleteCharge(id: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('revenus_charges')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  return { success: true }
}

// ─── Objectifs (Phase 8) ─────────────────────────────────────────────────────

export async function setObjectifAnnuel(montant: number | null, annee: number) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  if (montant === null || montant <= 0) {
    // Supprimer l'objectif
    const { error } = await supabase
      .from('revenus_objectifs')
      .delete()
      .eq('user_id', session.user.id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/revenus')
    return { success: true }
  }

  const { error } = await supabase
    .from('revenus_objectifs')
    .upsert({
      user_id: session.user.id,
      objectif_ca_annuel: montant,
      annee,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  return { success: true }
}
