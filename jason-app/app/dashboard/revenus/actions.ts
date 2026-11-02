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
  // Uniquement pour categorie === 'amortissement' : nombre d'années sur
  // lesquelles étaler la déduction (mobilier 5-10 ans, travaux 10-15 ans,
  // bien immobilier hors terrain ~20-30 ans). Alimente le tableau
  // d'amortissement et la dotation annuelle utilisée dans l'estimation fiscale.
  duree_amortissement_annees?: number | null
  /** Charge récurrente : 'mensuelle' | 'trimestrielle' | 'annuelle', null = une fois */
  frequence?: string | null
  /** Dernière échéance (facultatif) */
  date_fin?: string | null
}

export async function createRevenusEntry(input: EntryInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('revenus_entries')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { entry: data }
}

// Annule un contrat directement depuis le journal (ex : contrat orphelin
// resté "en attente" après suppression du séjour lié) — même effet que
// cancelContract() dans voyageurs/contract-actions.ts, dupliqué ici pour
// éviter un aller-retour vers une autre page depuis le journal.
export async function cancelContractRevenus(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('contracts')
    .update({ statut: 'annule' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { success: true }
}

// Annule (soft, réversible) un séjour directement depuis le journal — même
// effet que cancelSejour() dans voyageurs/actions.ts. Contrairement à un
// contrat, on n'a pas besoin de voyageurId ici : uniquement revalidatePath.
export async function cancelSejourRevenus(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('sejours')
    .update({ annule_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { success: true }
}

export async function deleteRevenusEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('revenus_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { success: true }
}

export async function bulkImportRevenusEntries(entries: EntryInput[]) {
  if (!entries.length) return { error: 'Aucune ligne à importer' }
  if (entries.length > 500) return { error: 'Maximum 500 lignes par import' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const userId = user.id

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
  revalidatePath('/dashboard/finances', 'layout')
  return { inserted: data?.length ?? 0, skipped, entries: data ?? [] }
}

// ─── Charges & dépenses ──────────────────────────────────────────────────────

/** Colonnes de récurrence, seulement si renseignées (code tolérant tant que la migration 176 manque) */
function recurrence(input: Partial<ChargeInput>) {
  const freq = input.categorie === 'amortissement' ? null : (input.frequence ?? null)
  if (input.frequence === undefined && input.date_fin === undefined) return {}
  return { frequence: freq, date_fin: freq ? (input.date_fin || null) : null }
}

export async function createCharge(input: ChargeInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('revenus_charges')
    .insert({
      user_id: user.id,
      logement_nom: input.logement_nom,
      logement_id: input.logement_id ?? null,
      montant: input.montant,
      date_charge: input.date_charge,
      categorie: input.categorie,
      description: input.description ?? null,
      deductible: input.deductible ?? true,
      duree_amortissement_annees: input.categorie === 'amortissement' ? (input.duree_amortissement_annees ?? null) : null,
      ...recurrence(input),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { charge: data }
}

/** Frais des plateformes d'un import CSV (Airbnb, Booking) : une charge « Commission de plateforme » par séjour, sans doublon. */
export async function bulkImportPlatformFees(fees: Array<{ logement_nom: string; logement_id: string | null; montant: number; date_charge: string; description: string }>) {
  if (!fees.length) return { inserted: 0, skipped: 0 }
  if (fees.length > 500) return { error: 'Maximum 500 lignes par import' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  const { data: existing } = await supabase
    .from('revenus_charges')
    .select('logement_nom, montant, date_charge')
    .eq('user_id', user.id)
    .eq('categorie', 'commissions_plateforme')
  const keys = new Set((existing ?? []).map(e => `${e.logement_nom}|${e.date_charge}|${Number(e.montant)}`))
  const toInsert = fees
    .filter(f => f.montant > 0 && !keys.has(`${f.logement_nom}|${f.date_charge}|${f.montant}`))
    .map(f => ({ ...f, user_id: user.id, categorie: 'commissions_plateforme', deductible: true }))
  if (!toInsert.length) return { inserted: 0, skipped: fees.length }
  const { data, error } = await supabase.from('revenus_charges').insert(toInsert).select('id')
  if (error) return { error: error.message }
  revalidatePath('/dashboard/finances', 'layout')
  return { inserted: data?.length ?? 0, skipped: fees.length - (data?.length ?? 0) }
}

export async function updateCharge(id: string, input: Partial<ChargeInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const patch: any = { ...input, ...recurrence(input), updated_at: new Date().toISOString() }
  delete patch.id

  const { error } = await supabase
    .from('revenus_charges')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { success: true }
}

export async function deleteCharge(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('revenus_charges')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { success: true }
}

// ─── Flag 'à déclarer' ──────────────────────────────────────────────────────
// Permet d'exclure une entrée de l'estimation fiscale (cadeau, remboursement,
// usage perso). L'utilisateur reste seul responsable de sa déclaration légale.

export async function setEntryADeclarer(id: string, source: 'entry' | 'sejour', aDeclarer: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const table = source === 'sejour' ? 'sejours' : 'revenus_entries'
  const { error } = await supabase
    .from(table)
    .update({ a_declarer: aDeclarer })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { success: true }
}

// ─── Objectifs (Phase 8) ─────────────────────────────────────────────────────

export async function setObjectifAnnuel(montant: number | null, annee: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  if (montant === null || montant <= 0) {
    // Supprimer l'objectif
    const { error } = await supabase
      .from('revenus_objectifs')
      .delete()
      .eq('user_id', user.id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/revenus')
    revalidatePath('/dashboard/finances', 'layout')
    return { success: true }
  }

  const { error } = await supabase
    .from('revenus_objectifs')
    .upsert({
      user_id: user.id,
      objectif_ca_annuel: montant,
      annee,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/revenus')
  revalidatePath('/dashboard/finances', 'layout')
  return { success: true }
}
