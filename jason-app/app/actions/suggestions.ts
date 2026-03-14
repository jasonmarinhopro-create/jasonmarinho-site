'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveSuggestion(
  type: 'formation' | 'partner',
  message: string
): Promise<{ success?: boolean; error?: string }> {
  if (!message || message.trim().length < 2) {
    return { error: 'Le message est trop court.' }
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', session.user.id)
    .maybeSingle()

  const { error } = await supabase.from('suggestions').insert({
    type,
    message: message.trim(),
    user_id: session.user.id,
    user_email: profile?.email ?? session.user.email ?? null,
  })

  if (error) {
    // Si la table n'existe pas encore, indiquer clairement
    if (error.code === '42P01') {
      return { error: 'La base de données n\'est pas encore configurée. Exécute supabase-migration.sql dans le dashboard Supabase.' }
    }
    return { error: `Erreur Supabase : ${error.message}` }
  }
  return { success: true }
}
