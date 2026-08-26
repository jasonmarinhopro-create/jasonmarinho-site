// Client minimal pour l'API Search Console (URL Inspection), authentifié
// via un refresh_token OAuth stocké en base (chiffré) — cf. lib/google/oauth.ts
// pour le pourquoi (compte de service impossible : règle d'organisation
// Google Cloud par défaut qui bloque la création de clés).

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/security/crypto'
import { refreshAccessToken } from '@/lib/google/oauth'

const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
const SERVICE_KEY = 'search_console'

// Propriété Search Console : domaine vérifié en DNS (préfixe sc-domain:),
// couvre http/https + sous-domaines. Si jasonmarinho.com est plutôt une
// propriété "préfixe d'URL" côté Search Console, remplacer par
// "https://jasonmarinho.com/".
export const SEARCH_CONSOLE_SITE_URL = 'sc-domain:jasonmarinho.com'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function isConfigured(): Promise<boolean> {
  const db = serviceClient()
  const { data } = await db.from('google_oauth_tokens').select('service').eq('service', SERVICE_KEY).maybeSingle()
  return !!data
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const db = serviceClient()
  const { data } = await db.from('google_oauth_tokens').select('refresh_token').eq('service', SERVICE_KEY).maybeSingle()
  if (!data) throw new Error('Google Search Console non connecté — va dans Admin → Indexation pour te connecter')

  const refreshToken = decryptToken(data.refresh_token)
  const { accessToken, expiresIn } = await refreshAccessToken(refreshToken)
  cachedToken = { token: accessToken, expiresAt: Date.now() + expiresIn * 1000 }
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
