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
      { user_id: session.user.id, formation_id: formationId, progress: 0 },
      { onConflict: 'user_id,formation_id', ignoreDuplicates: true }
    )

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateFormationProgress(formationId: string, progress: number) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('user_formations')
    .update({ progress })
    .eq('user_id', session.user.id)
    .eq('formation_id', formationId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
