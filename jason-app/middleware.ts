import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isTransientAuthError } from '@/lib/supabase/session-cookies'

// Purge les cookies Supabase quand une session est corrompue (décodable
// localement mais refusée par le serveur). Sans ça → boucle infinie de
// redirections, l'utilisateur doit clear ses cookies manuellement.
function clearAuthCookies(request: NextRequest, response: NextResponse) {
  // Supabase SSR : cookies préfixés sb-<project-ref>-auth-token, parfois
  // fragmentés en .0 / .1 / .2 quand le token est trop gros pour un seul cookie.
  // Lus sur la requête (ceux du navigateur) : la réponse n'en porte aucun.
  request.cookies.getAll().forEach(c => {
    if (c.name.startsWith('sb-') && c.name.includes('auth-token')) {
      response.cookies.set({ name: c.name, value: '', maxAge: 0, path: '/' })
    }
  })
}

const AUTH_FETCH_TIMEOUT_MS = 8_000
const AUTH_CHECK_TIMEOUT_MS = 10_000

// Propagate cancellation and abort a stalled Auth fetch before Vercel's limit.
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()
  const timeout = setTimeout(abortFromCaller, AUTH_FETCH_TIMEOUT_MS)
  if (init?.signal?.aborted) abortFromCaller()
  else init?.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
    init?.signal?.removeEventListener('abort', abortFromCaller)
  }
}

function authUnavailableResponse() {
  return new NextResponse(
    '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Connexion temporairement indisponible</title><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:15vh auto;padding:0 1.5rem;color:#222"><h1>Connexion temporairement indisponible</h1><p>Le service de connexion ne répond pas assez vite. Tes identifiants sont conservés. Réessaie dans quelques instants.</p><button onclick="location.reload()" style="padding:.7rem 1rem;cursor:pointer">Réessayer</button></body></html>',
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '5',
      },
    },
  )
}

function isInvalidAuthSession(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const authError = error as { status?: unknown; name?: unknown; code?: unknown }
  return authError.status === 401
    || authError.name === 'AuthSessionMissingError'
    || authError.code === 'session_not_found'
    || authError.code === 'bad_jwt'
    || authError.code === 'refresh_token_not_found'
}

export async function middleware(request: NextRequest) {
  // Injecte le pathname courant dans un header pour que les layouts
  // server components puissent y accéder (Next.js ne le passe pas par défaut).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const pendingCookies = new Map<string, Record<string, unknown>>()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout },
      // @supabase/ssr v0.3.x requires get/set/remove (not getAll/setAll)
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // 10/11/2026 (Jason : « la connexion a pris au moins 1 minute ») :
        // le cookie de session est coupé en deux morceaux (.0 et .1) et la
        // bibliothèque appelle set() une fois par morceau. La réponse était
        // recréée à chaque appel et ne gardait donc que le DERNIER morceau :
        // après un renouvellement, le navigateur conservait l'ancien jeton
        // (morceau .0) et chaque requête suivante redemandait un
        // renouvellement à Supabase (46 en 20 s relevés dans les journaux
        // Auth, 0,4 à 4,7 s chacun). On garde tous les morceaux et on les
        // repose tous sur la réponse.
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options } as any)
          pendingCookies.set(name, { name, value, ...options })
          supabaseResponse = NextResponse.next({ request })
          pendingCookies.forEach(c => supabaseResponse.cookies.set(c as any))
        },
        // Jamais d'effacement ici (07/11/2026) : la bibliothèque efface la
        // session dès qu'un renouvellement échoue, y compris quand Supabase
        // refuse un doublon (409, plusieurs préchargements en même temps) ou
        // tarde. Une session vraiment invalide est purgée plus bas
        // (clearAuthCookies + redirection vers la connexion).
        remove() {},
      },
    }
  )

  const path = request.nextUrl.pathname

  // Always allow access to reset-password page (needs unauthenticated access with token)
  if (path === '/auth/reset-password') {
    return supabaseResponse
  }

  // Retour de Google : aussi quand on est déjà connecté (association d'un
  // compte Google depuis Mon compte), sinon le code ne serait jamais échangé
  if (path === '/auth/callback') {
    return supabaseResponse
  }

  // getClaims vérifie le JWT signé et évite l'aller-retour getUser() par route.
  // Si Auth tarde, on échoue vite et on conserve les cookies de session.
  const hasAuthCookie = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('auth-token') && c.value
  )
  const authStart = Date.now()
  let claims: Record<string, unknown> | null = null
  let authError: unknown = null
  let authTimedOut = false
  let authTimer: ReturnType<typeof setTimeout> | undefined

  // Doublon refusé (409) : un autre renouvellement de la même session vient
  // de passer, Supabase accepte l'ancien jeton quelques secondes. Un second
  // essai, court, évite la page « Connexion indisponible ».
  const checkClaims = async () => {
    const first = await supabase.auth.getClaims()
    if (!first.error || !isTransientAuthError(first.error) || Date.now() - authStart > 4_000) return first
    await new Promise(r => setTimeout(r, 300))
    return supabase.auth.getClaims()
  }

  try {
    const result = await Promise.race([
      checkClaims(),
      new Promise<null>(resolve => {
        authTimer = setTimeout(() => resolve(null), AUTH_CHECK_TIMEOUT_MS)
      }),
    ])
    if (result) {
      const resultClaims = result.data?.claims
      claims = resultClaims ? resultClaims as unknown as Record<string, unknown> : null
      authError = result.error
    } else {
      authTimedOut = true
    }
  } catch (error) {
    authError = error
  } finally {
    if (authTimer) clearTimeout(authTimer)
  }

  const authMs = Date.now() - authStart
  const invalidSession = isInvalidAuthSession(authError)
  const isAuthed = !invalidSession && typeof claims?.sub === 'string'

  if (hasAuthCookie && (authTimedOut || (authError && !invalidSession))) {
    return authUnavailableResponse()
  }

  // Ne purge que les sessions explicitement invalides, jamais sur une panne.
  if (!isAuthed && hasAuthCookie && invalidSession) {
    if (path.startsWith('/auth')) {
      clearAuthCookies(request, supabaseResponse)
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    const res = NextResponse.redirect(url)
    clearAuthCookies(request, res)
    return res
  }

  // Routes /dashboard/* : nécessitent un user valide
  if (path.startsWith('/dashboard')) {
    if (!isAuthed) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      // Preserve l'intention : si l'utilisateur essayait d'atteindre
      // une fiche pro, garde le ?as= pour rediriger apres login vers
      // la bonne page (evite un aller-retour supplementaire depuis /mon-compte).
      url.search = ''
      if (path.startsWith('/dashboard/ma-fiche-photographe')) {
        url.searchParams.set('as', 'photographe')
      } else if (path.startsWith('/dashboard/ma-fiche-menage')) {
        url.searchParams.set('as', 'menage')
      }
      return NextResponse.redirect(url)
    }
    // Mode admin resté actif sur l'appareil (cookie posé par Sidebar.tsx) :
    // à l'ouverture de l'app, direct sur la Vue d'ensemble, avant tout rendu
    // (avant : Accueil hôte calculé en entier, ~10 s, puis redirection).
    // Seulement pour un chargement de page complet (Sec-Fetch-Dest: document) :
    // une navigation ou un préchargement dans l'app n'est jamais redirigé,
    // sinon le routeur garde la redirection en cache et « Mode hôte »
    // renvoyait sur l'admin. Attention : Next retire les en-têtes RSC et
    // Next-Router-Prefetch avant le middleware, ils ne servent à rien ici
    // (première version, remarqué par Jason le 30/09/2026).
    // Pas un droit : /dashboard/admin revérifie le rôle.
    if (
      path === '/dashboard' &&
      request.cookies.get('jm-admin-mode')?.value === '1' &&
      request.headers.get('sec-fetch-dest') === 'document'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/admin'
      url.search = ''
      const redirect = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirect.cookies.set(c))
      return redirect
    }
    // Durée de la vérification de session, transmise au chronomètre du
    // layout (lib/perf/server-timing.ts). En-têtes reconstruits à partir de
    // la requête à jour (cookies éventuellement rafraîchis par Supabase).
    const h = new Headers(request.headers)
    h.set('x-pathname', path)
    h.set('x-mw-auth-ms', String(authMs))
    const res = NextResponse.next({ request: { headers: h } })
    supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c))
    return res
  }

  if (isAuthed && path.startsWith('/auth')) {
    // Exception : si l'utilisateur visite /auth/login?as=photographe ou
    // ?as=menage, c'est qu'il veut switcher de compte. On laisse la page
    // login s'afficher (elle proposera un bouton de déconnexion + le form).
    const asParam = request.nextUrl.searchParams.get('as')
    if (path === '/auth/login' && (asParam === 'photographe' || asParam === 'menage')) {
      return supabaseResponse
    }
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
