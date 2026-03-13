'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function loginAction(email: string, password: string) {
  const cookieStore = await cookies()

  // Create client directly here — does NOT use the shared createClient() which has
  // a silent try/catch{} that swallows cookie-setting errors.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (
      error.message.includes('Email not confirmed') ||
      error.message.includes('email_not_confirmed')
    ) {
      return { error: 'EMAIL_NOT_CONFIRMED' as const }
    }
    return { error: 'INVALID_CREDENTIALS' as const }
  }

  // Supabase returned success but no session (edge case: unconfirmed email)
  if (!data.session) {
    return { error: 'EMAIL_NOT_CONFIRMED' as const }
  }

  return { success: true as const }
}
