// Client minimal pour l'API Search Console (URL Inspection), authentifié
// via un refresh_token OAuth stocké en base (chiffré) — cf. lib/google/oauth.ts
// pour le pourquoi (compte de service impossible : règle d'organisation
// Google Cloud par défaut qui bloque la création de clés).

import { getServiceClient as serviceClient } from '@/lib/supabase/service'
import { decryptToken } from '@/lib/security/crypto'
import { refreshAccessToken } from '@/lib/google/oauth'

const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
const SERVICE_KEY = 'search_console'

// Propriété Search Console : domaine vérifié en DNS (préfixe sc-domain:),
// couvre http/https + sous-domaines. Si jasonmarinho.com est plutôt une
// propriété "préfixe d'URL" côté Search Console, remplacer par
// "https://jasonmarinho.com/".
export const SEARCH_CONSOLE_SITE_URL = 'sc-domain:jasonmarinho.com'

/**
 * La connexion Google ne marche plus (jeton révoqué ou expiré, accès à la
 * propriété retiré). Toutes les pages échoueraient pareil : la vérification
 * s'arrête au lieu d'écrire une erreur sur chaque ligne (29/09/2026 : 526
 * pages marquées « Erreur de vérification », statuts connus écrasés).
 */
export class SearchConsoleAuthError extends Error {
  constructor(detail: string) {
    super(`Connexion à Google Search Console expirée (${detail}) : reconnecte-la depuis Admin → Indexation.`)
    this.name = 'SearchConsoleAuthError'
  }
}

export async function isConfigured(): Promise<boolean> {
  const db = serviceClient()
  const { data } = await db.from('google_oauth_tokens').select('service').eq('service', SERVICE_KEY).maybeSingle()
  return !!data
}

/** Date de la dernière (re)connexion à Google : les erreurs d'accès plus anciennes sont périmées */
export async function connectedAt(): Promise<string | null> {
  const db = serviceClient()
  const { data } = await db.from('google_oauth_tokens').select('updated_at').eq('service', SERVICE_KEY).maybeSingle()
  return (data?.updated_at as string | undefined) ?? null
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const db = serviceClient()
  const { data } = await db.from('google_oauth_tokens').select('refresh_token').eq('service', SERVICE_KEY).maybeSingle()
  if (!data) throw new SearchConsoleAuthError('non connecté')

  const refreshToken = decryptToken(data.refresh_token)
  let fresh: { accessToken: string; expiresIn: number }
  try {
    fresh = await refreshAccessToken(refreshToken)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    // 400 invalid_grant : jeton révoqué, mot de passe changé, ou application
    // Google Cloud restée « En test » (jetons valables 7 jours seulement).
    if (/invalid_grant|: 40[013] /.test(message)) throw new SearchConsoleAuthError(/invalid_grant/.test(message) ? 'jeton refusé par Google' : message.slice(0, 80))
    throw e
  }
  if (!fresh.accessToken) throw new SearchConsoleAuthError('aucun jeton renvoyé')
  cachedToken = { token: fresh.accessToken, expiresAt: Date.now() + (fresh.expiresIn || 3000) * 1000 }
  return cachedToken.token
}

export interface UrlInspectionResult {
  coverageState: string | null
  verdict: string | null
  indexed: boolean
  // Lien direct vers cette inspection dans Search Console, renvoyé par
  // l'API elle-même (champ inspectionResultLink) — contrairement au lien
  // "inspect?resource_id=...&id=..." construit à la main (id est en réalité
  // un jeton opaque émis par Google, pas une URL encodée : impossible à
  // reconstruire soi-même, d'où les 404 systématiques), celui-ci est garanti
  // valide puisque Google le génère pour CETTE inspection précise.
  inspectionLink: string | null
}

/** Message court tiré de la réponse d'erreur de Google (sinon le JSON entier finissait dans la liste) */
function googleErrorMessage(status: number, text: string): string {
  try {
    const msg = JSON.parse(text)?.error?.message
    if (typeof msg === 'string' && msg) return `${status} ${msg.slice(0, 140)}`
  } catch { /* texte brut */ }
  return `${status} ${text.slice(0, 140)}`
}

/** Validité et droits d'un jeton selon Google (tokeninfo) : durée restante et présence du droit Search Console */
async function tokenDiagnostic(token: string): Promise<string> {
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    const j = await r.json().catch(() => ({})) as { scope?: string; expires_in?: string; error?: string; error_description?: string }
    if (!r.ok) return `jeton inconnu de Google (${r.status} ${j.error ?? ''} ${j.error_description ?? ''})`.trim()
    const hasScope = (j.scope ?? '').includes('webmasters')
    return `jeton valide ${j.expires_in ?? '?'} s, droit Search Console ${hasScope ? 'présent' : 'ABSENT'}, jeton de ${token.length} caractères`
  } catch (e) {
    return `diagnostic impossible (${e instanceof Error ? e.message : 'erreur'})`
  }
}

async function inspectOnce(url: string, accessToken: string): Promise<Response> {
  return fetch(INSPECT_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SEARCH_CONSOLE_SITE_URL }),
  })
}

export async function inspectUrl(url: string): Promise<UrlInspectionResult> {
  let res = await inspectOnce(url, await getAccessToken())
  // 401 avec un jeton en cache : il a pu être révoqué avant son expiration.
  // Un nouvel essai avec un jeton tout neuf tranche.
  if (res.status === 401) {
    cachedToken = null
    const fresh = await getAccessToken()
    res = await inspectOnce(url, fresh)
    if (res.status === 401) {
      // Diagnostic (29/09/2026 : jeton tout neuf refusé quelques minutes après
      // une reconnexion) : ce que Google dit de ce jeton, sans donnée perso.
      throw new SearchConsoleAuthError(`${googleErrorMessage(401, await res.text()).slice(0, 60)} ; ${await tokenDiagnostic(fresh)}`)
    }
  }
  if (res.status === 401 || res.status === 403) {
    throw new SearchConsoleAuthError(googleErrorMessage(res.status, await res.text()))
  }
  if (!res.ok) throw new Error(googleErrorMessage(res.status, await res.text()))
  const json = await res.json()
  const result = json.inspectionResult?.indexStatusResult
  const coverageState: string | null = result?.coverageState ?? null
  const verdict: string | null = result?.verdict ?? null
  return {
    coverageState,
    verdict,
    indexed: coverageState === 'Submitted and indexed' || verdict === 'PASS',
    inspectionLink: json.inspectionResult?.inspectionResultLink ?? null,
  }
}

// Lien vers la propriété Search Console — dernier recours manuel, Google
// n'exposant pas d'API de demande d'indexation pour des pages classiques
// (seules offres d'emploi et diffusions en direct en ont une). Le format
// "inspect?resource_id=...&id=..." avec l'URL pré-remplie n'est pas un
// endpoint documenté par Google (juste observé dans certains emails Search
// Console) — testé avec plusieurs encodages, 404 systématique. On se
// contente donc d'un lien garanti stable vers la propriété elle-même.
export function searchConsolePropertyLink(): string {
  return `https://search.google.com/search-console?resource_id=${SEARCH_CONSOLE_SITE_URL}`
}
