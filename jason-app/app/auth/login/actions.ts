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
    // Multi-espaces : on détecte les fiches pro liées au user. Si UNE
    // seule existe ET pas de logements, on redirige vers cette fiche
    // (le pro veut aller direct chez lui). Sinon → dashboard hôte par
    // défaut, et le sélecteur header lui permet de switcher.
    const [{ data: ph }, { data: cl }, { count: logementsCount }] = await Promise.all([
      admin.from('photographers').select('id').eq('user_id', user.id).maybeSingle(),
      admin.from('cleaners').select('id').eq('user_id', user.id).maybeSingle(),
      admin.from('logements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    const hasLogements = (logementsCount ?? 0) > 0
    const hasPhoto = !!ph
    const hasCleaner = !!cl

    // Si le user n'a qu'un seul espace pro et pas de logements → direct
    if (!hasLogements && hasPhoto && !hasCleaner) return '/dashboard/ma-fiche-photographe'
    if (!hasLogements && hasCleaner && !hasPhoto) return '/dashboard/ma-fiche-menage'
    // Sinon (hôte, ou multi-espaces) → dashboard hôte par défaut
    return '/dashboard'
  } catch {
    return '/dashboard'
  }
}

