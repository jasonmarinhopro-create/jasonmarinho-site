'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Marque une déclaration voyageur comme faite (depuis le widget dashboard).
 */
export async function markDeclarationDone(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('guest_declarations')
    .update({ statut: 'faite', declared_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Ignore une déclaration (faux positif : nationalité mal renseignée,
 * séjour annulé…). Réversible en DB mais pas exposé en v1.
 */
export async function ignoreDeclaration(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('guest_declarations')
    .update({ statut: 'ignoree' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { ok: true }
}
