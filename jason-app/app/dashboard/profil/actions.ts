'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveProfileName(fullName: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() || null })
    .eq('id', session.user.id)

  if (error) return { error: 'Erreur lors de la sauvegarde. Réessaie.' }

  // Invalide le cache de TOUTES les routes du dashboard
  revalidatePath('/dashboard', 'layout')

  return {}
}
