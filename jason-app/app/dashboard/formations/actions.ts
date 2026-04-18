'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function enrollInFormation(formationId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('user_formations')
    .upsert(
      { user_id: session.user.id, formation_id: formationId, progress: 0, completed_lessons: [] },
      { onConflict: 'user_id,formation_id', ignoreDuplicates: true }
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateFormationProgress(
  formationId: string,
  progress: number,
  completedLessons?: number[]
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const updateData: Record<string, unknown> = { progress }
  if (completedLessons !== undefined) {
    updateData.completed_lessons = completedLessons
  }

  // Upsert pour sauvegarder même si l'utilisateur n'a pas cliqué "S'inscrire"
  const { error } = await supabase
    .from('user_formations')
    .upsert(
      { user_id: session.user.id, formation_id: formationId, ...updateData },
      { onConflict: 'user_id,formation_id' }
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
