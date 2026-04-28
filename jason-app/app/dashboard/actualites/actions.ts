'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Marque une actualité comme lue par l'utilisateur courant.
 * Idempotent : si déjà lue, ne fait rien (clé unique user_id+actualite_id).
 */
export async function markActualiteRead(actualiteId: string) {
  if (!actualiteId) return { error: 'ID manquant' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // upsert : si déjà lu, ignore l'insertion
  const { error } = await supabase
    .from('user_actualite_reads')
    .upsert(
      { user_id: user.id, actualite_id: actualiteId },
      { onConflict: 'user_id,actualite_id', ignoreDuplicates: true },
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard/actualites')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Marque toutes les actualités visibles comme lues.
 * Utile pour le bouton "Tout marquer lu".
 */
export async function markAllActualitesRead(actualiteIds: string[]) {
  if (!actualiteIds.length) return { error: 'Aucun article' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const rows = actualiteIds.map(id => ({ user_id: user.id, actualite_id: id }))
  const { error } = await supabase
    .from('user_actualite_reads')
    .upsert(rows, { onConflict: 'user_id,actualite_id', ignoreDuplicates: true })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/actualites')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Toggle favori : ajoute ou retire selon état actuel.
 */
export async function toggleActualiteFavorite(actualiteId: string) {
  if (!actualiteId) return { error: 'ID manquant' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifie si déjà favori
  const { data: existing } = await supabase
    .from('user_actualite_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('actualite_id', actualiteId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('user_actualite_favorites')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/actualites')
    revalidatePath('/dashboard/actualites/favoris')
    return { success: true, favorited: false }
  }

  const { error } = await supabase
    .from('user_actualite_favorites')
    .insert({ user_id: user.id, actualite_id: actualiteId })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/actualites')
  revalidatePath('/dashboard/actualites/favoris')
  return { success: true, favorited: true }
}
