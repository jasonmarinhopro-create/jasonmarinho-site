import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // @supabase/ssr v0.3.x requires get/set/remove (not getAll/setAll)
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options } as any)
          supabaseResponse = NextResponse.next({ request })
          supabaseResponse.cookies.set({ name, value, ...options } as any)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options } as any)
          supabaseResponse = NextResponse.next({ request })
          supabaseResponse.cookies.set({ name, value: '', ...options } as any)
        },
      },
    }
  )

  // Optimisation : getSession() décode la JWT localement (pas de round-trip Supabase).
  // Suffisant pour la logique de redirection sur / et /auth/*.
  // Pour /dashboard/* on appelle getUser() ensuite qui valide + refresh la JWT
  // (indispensable pour ne pas avoir d'expired JWT sur les queries RLS).
  const path = request.nextUrl.pathname

  // Always allow access to reset-password page (needs unauthenticated access with token)
  if (path === '/auth/reset-password') {
    return supabaseResponse
  }

  // Pour les routes /dashboard/*, on fait getUser() (valide + refresh la JWT).
  // getUser() writes new tokens via cookies.set — nécessaire pour ne pas casser
  // les queries RLS server-side avec une JWT expirée.
  if (path.startsWith('/dashboard')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Pour / et /auth/*, getSession() suffit (pas de query RLS derrière à protéger).
  // Gain : −50 à −100 ms sur les pages login/register/reset-password.
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthed = !!session

  if (isAuthed && path.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (path === '/') {
    const url = request.nextUrl.clone()
    url.pathname = isAuthed ? '/dashboard' : '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // /sign/* routes are public (no auth required — voyageur signature page)
  matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
}
