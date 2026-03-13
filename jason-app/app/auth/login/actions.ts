'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(email: string, password: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
      return { error: 'EMAIL_NOT_CONFIRMED' }
    }
    return { error: 'INVALID_CREDENTIALS' }
  }

  redirect('/dashboard')
}
