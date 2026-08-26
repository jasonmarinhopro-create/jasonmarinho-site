// Client minimal pour l'API Search Console (URL Inspection), authentifié en
// compte de service (JWT signé RS256 échangé contre un access token OAuth2).
// Pas de lib Google officielle (googleapis est lourde) — le flow "service
// account" tient en une signature crypto + un POST, cf. RFC 7523.

import crypto from 'crypto'

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

// Propriété Search Console : domaine vérifié en DNS (préfixe sc-domain:),
// couvre http/https + sous-domaines. Si jasonmarinho.com est plutôt une
// propriété "préfixe d'URL" côté Search Console, remplacer par
// "https://jasonmarinho.com/".
export const SEARCH_CONSOLE_SITE_URL = 'sc-domain:jasonmarinho.com'

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function isConfigured(): boolean {
  return !!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL && !!process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL
  // Vercel n'accepte pas les retours à la ligne littéraux dans une env var —
  // la clé y est stockée avec des "\n" échappés qu'il faut reconvertir.
  const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!clientEmail || !privateKey) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY manquants')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }))
  const signInput = `${header}.${claims}`
  const signature = crypto.createSign('RSA-SHA256').update(signInput).sign(privateKey)
  const jwt = `${signInput}.${base64url(signature)}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Google OAuth token : ${res.status} ${await res.text()}`)
  const json = await res.json()
  cachedToken = { token: json.access_token as string, expiresAt: now * 1000 + (json.expires_in ?? 3600) * 1000 }
  return cachedToken.token
}

export interface UrlInspectionResult {
  coverageState: string | null
  verdict: string | null
  indexed: boolean
}

export async function inspectUrl(url: string): Promise<UrlInspectionResult> {
  const accessToken = await getAccessToken()
  const res = await fetch(INSPECT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SEARCH_CONSOLE_SITE_URL }),
  })
  if (!res.ok) throw new Error(`inspect ${url} : ${res.status} ${await res.text()}`)
  const json = await res.json()
  const result = json.inspectionResult?.indexStatusResult
  const coverageState: string | null = result?.coverageState ?? null
  const verdict: string | null = result?.verdict ?? null
  return {
    coverageState,
    verdict,
    indexed: coverageState === 'Submitted and indexed' || verdict === 'PASS',
  }
}

// Lien d'inspection Search Console pré-rempli pour une URL — dernier recours
// manuel, Google n'exposant pas d'API de demande d'indexation pour des
// pages classiques (seules offres d'emploi et diffusions en direct en ont
// une). IMPORTANT : resource_id doit rester NON percent-encodé (le ':' de
// "sc-domain:" tel quel) — encoder ce paramètre casse le lien côté Google
// (404 générique) alors que le paramètre id, lui, doit être encodé normalement.
export function inspectDeepLink(url: string): string {
  return `https://search.google.com/search-console/inspect?resource_id=${SEARCH_CONSOLE_SITE_URL}&id=${encodeURIComponent(url)}`
}
