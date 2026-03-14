'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveSuggestion(
  type: 'formation' | 'partner',
  message: string
): Promise<{ success?: boolean; error?: string }> {
  if (!message || message.trim().length < 5) {
    return { error: 'Le message est trop court.' }
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Non authentifié.' }

  // Récupère l'email depuis le profil
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

  if (error) return { error: 'Erreur lors de l\'envoi. Réessaie.' }
  return { success: true }
}
