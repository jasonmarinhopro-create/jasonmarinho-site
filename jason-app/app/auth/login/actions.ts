'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function loginAction(email: string, password: string) {
  const cookieStore = await cookies()

  // @supabase/ssr v0.3.x requires get/set/remove (not getAll/setAll)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
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

  if (!data.session) {
    return { error: 'EMAIL_NOT_CONFIRMED' as const }
  }

  return { success: true as const }
}

/**
 * Détermine la page d'atterrissage post-login en fonction du rôle de
 * l'utilisateur. Lecture via service role pour bypass les RLS (la table
 * profiles n'a pas de policy SELECT pour l'utilisateur courant côté
 * client).
 */
export async function getPostLoginPathAction(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set(name, value, options) },
          remove(name: string, options: CookieOptions) { cookieStore.set(name, '', { ...options, maxAge: 0 }) },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return '/dashboard'

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role === 'photographer') return '/dashboard/ma-fiche-photographe'
    if (profile?.role === 'cleaner') return '/dashboard/ma-fiche-menage'
    return '/dashboard'
  } catch {
    return '/dashboard'
  }
}

