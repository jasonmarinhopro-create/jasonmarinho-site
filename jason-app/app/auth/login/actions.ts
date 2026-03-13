'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (
      error.message.includes('Email not confirmed') ||
      error.message.includes('email_not_confirmed')
    ) {
      return { error: 'EMAIL_NOT_CONFIRMED' as const }
    }
    return { error: 'INVALID_CREDENTIALS' as const }
  }

  return { success: true as const }
}
