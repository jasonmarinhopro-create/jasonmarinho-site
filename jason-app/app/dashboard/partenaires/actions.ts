'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Toggle l'intérêt d'un utilisateur pour un outil du catalogue Écosystème LCD.
 * - Si déjà voté → retire le vote
 * - Sinon → ajoute le vote
 */
export async function toggleToolInterest(toolSlug: string) {
  if (!toolSlug) return { error: 'Slug manquant' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifie si déjà voté
  const { data: existing } = await supabase
    .from('tool_interests')
    .select('id')
    .eq('user_id', user.id)
    .eq('tool_slug', toolSlug)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('tool_interests')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/dashboard/partenaires')
    return { success: true, voted: false }
  }

  const { error } = await supabase
    .from('tool_interests')
    .insert({ user_id: user.id, tool_slug: toolSlug })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/partenaires')
  return { success: true, voted: true }
}
