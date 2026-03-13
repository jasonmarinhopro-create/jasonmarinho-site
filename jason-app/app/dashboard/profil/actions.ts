'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveProfileName(fullName: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      email: session.user.email ?? '',
      full_name: fullName.trim() || null,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: `Erreur: ${error.message}` }

  // Invalide le cache de TOUTES les routes du dashboard
  revalidatePath('/dashboard', 'layout')

  return {}
}
