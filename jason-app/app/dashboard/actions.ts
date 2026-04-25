'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAvisMoyen(note: number) {
  if (note < 1 || note > 5) return { error: 'Note invalide' }
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié' }
  const { error } = await supabase
    .from('profiles')
    .update({ avis_moyen: Math.round(note * 100) / 100 })
    .eq('id', session.user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
