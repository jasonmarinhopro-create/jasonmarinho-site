// OAuth Google classique (pas de compte de service) — la création de clés
// de compte de service est bloquée par une règle d'organisation Google
// Cloud par défaut (iam.disableServiceAccountKeyCreation). Même principe
// que l'auth Meta (lib/social/meta.ts) : un token utilisateur longue durée
// (ici un refresh_token, valable indéfiniment tant qu'il n'est pas révoqué)
// chiffré en base plutôt qu'une clé de service.

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export function buildAuthorizeUrl(redirectUri: string, state: string, scope: string): string {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_SEARCH_CONSOLE_CLIENT_ID manquante')
  const url = new URL(AUTH_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)
  // access_type=offline + prompt=consent : sans ça Google ne renvoie un
  // refresh_token qu'au tout premier consentement jamais donné par ce
  // compte à cette app — inutilisable pour reconnecter plus tard.
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  return url.toString()
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{ refreshToken: string | null; accessToken: string; expiresIn: number }> {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('GOOGLE_SEARCH_CONSOLE_CLIENT_ID / GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET manquantes')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Google OAuth exchange : ${res.status} ${await res.text()}`)
  const json = await res.json()
  return { refreshToken: json.refresh_token ?? null, accessToken: json.access_token, expiresIn: json.expires_in }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('GOOGLE_SEARCH_CONSOLE_CLIENT_ID / GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET manquantes')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Google OAuth refresh : ${res.status} ${await res.text()}`)
  const json = await res.json()
  return { accessToken: json.access_token, expiresIn: json.expires_in }
}
