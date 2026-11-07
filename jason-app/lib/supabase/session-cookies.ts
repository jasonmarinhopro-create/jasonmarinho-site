// Règles pures sur les cookies de session Supabase (07/11/2026), partagées
// par le client du navigateur et le middleware. Test : session-cookies.test.ts.

/** Cookie de session : sb-<projet>-auth-token, ou un de ses morceaux (.0, .1…) */
export function isSessionCookie(name: string): boolean {
  return /^sb-.+-auth-token(\.\d+)?$/.test(name)
}

/**
 * Le navigateur peut-il effacer ce cookie ? Toujours pour les cookies
 * annexes (vérificateur PKCE de la connexion Google), et pour la session
 * seulement pendant une déconnexion voulue.
 */
export function mayRemoveAuthCookie(name: string, signingOut: boolean): boolean {
  return signingOut || !isSessionCookie(name)
}

/**
 * Échec du renouvellement qui ne veut pas dire « session invalide » :
 * doublon refusé (409), panne ou délai. On garde alors les cookies.
 */
export function isTransientAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { status?: unknown; code?: unknown; name?: unknown }
  if (e.name === 'AuthRetryableFetchError') return true
  if (e.status === 409 || e.code === 'conflict') return true
  return typeof e.status === 'number' && e.status >= 500
}
