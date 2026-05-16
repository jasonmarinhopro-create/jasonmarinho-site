import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Purge les cookies Supabase quand une session est corrompue (décodable
// localement mais refusée par le serveur). Sans ça → boucle infinie de
// redirections, l'utilisateur doit clear ses cookies manuellement.
function clearAuthCookies(response: NextResponse) {
  // Supabase SSR : cookies préfixés sb-<project-ref>-auth-token, parfois
  // fragmentés en .0 / .1 / .2 quand le token est trop gros pour un seul cookie.
  response.cookies.getAll().forEach(c => {
    if (c.name.startsWith('sb-') && c.name.includes('auth-token')) {
      response.cookies.set({ name: c.name, value: '', maxAge: 0, path: '/' })
    }
  })
}

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

  const path = request.nextUrl.pathname

  // Always allow access to reset-password page (needs unauthenticated access with token)
  if (path === '/auth/reset-password') {
    return supabaseResponse
  }

  // Source de vérité unique : getUser() valide la JWT contre le serveur
  // Supabase. On évite getSession() (décodage local) qui peut diverger du
  // serveur et causer ERR_TOO_MANY_REDIRECTS quand les cookies sont
  // partiellement expirés / révoqués / corrompus.
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const isAuthed = !!user

  // Détection de session "fantôme" : un cookie auth présent mais refusé
  // par le serveur. On le purge pour casser la boucle.
  const hasAuthCookie = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('auth-token') && c.value
  )
  if (!isAuthed && hasAuthCookie && authError) {
    // Si déjà sur /auth/* on laisse passer (pour permettre login) après purge
    if (path.startsWith('/auth')) {
      clearAuthCookies(supabaseResponse)
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const res = NextResponse.redirect(url)
    clearAuthCookies(res)
    return res
  }

  // Routes /dashboard/* : nécessitent un user valide
  if (path.startsWith('/dashboard')) {
    if (!isAuthed) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

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
  // /sign/* routes are public (no auth required, voyageur signature page)
  matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
}
