'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(email: string, password: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
      return { error: 'EMAIL_NOT_CONFIRMED' }
    }
    return { error: 'INVALID_CREDENTIALS' }
  }

  return { success: true }
}
