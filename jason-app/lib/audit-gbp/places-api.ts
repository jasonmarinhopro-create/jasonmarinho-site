// Client pour Google Places API (New).
// Documentation : https://developers.google.com/maps/documentation/places/web-service/place-details
//
// Sécurité : ce module ne s'exécute QUE côté serveur (server actions / route handlers).
// La clé API n'est jamais exposée au client.

const PLACES_API_BASE = 'https://places.googleapis.com/v1'

export interface PlaceDetails {
  id: string
  displayName?: { text: string; languageCode?: string }
  formattedAddress?: string
  shortFormattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  types?: string[]
  primaryType?: string
  primaryTypeDisplayName?: { text: string; languageCode?: string }
  rating?: number
  userRatingCount?: number
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>
  regularOpeningHours?: {
    openNow?: boolean
    periods?: Array<{ open: { day: number; hour: number; minute: number } }>
    weekdayDescriptions?: string[]
  }
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
  editorialSummary?: { text: string; languageCode?: string }
  addressComponents?: Array<{
    longText?: string
    shortText?: string
    types?: string[]
  }>
}

const FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'shortFormattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'types',
  'primaryType',
  'primaryTypeDisplayName',
  'rating',
  'userRatingCount',
  'photos',
  'regularOpeningHours',
  'businessStatus',
  'editorialSummary',
  'addressComponents',
].join(',')

// ─── Suit les redirections (share.google, goo.gl, maps.app.goo.gl) ───
export async function resolveMapsUrl(url: string): Promise<string> {
  // Si c'est déjà une URL longue, retourne tel quel
  if (/google\.com\/maps/.test(url)) return url

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      // Headers minimalistes pour éviter les blocages
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    })
    return res.url || url
  } catch {
    // Si HEAD échoue, on essaie un GET (certains serveurs refusent HEAD)
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      })
      return res.url || url
    } catch {
      return url
    }
  }
}

// ─── Extrait un place_id d'une URL Google Maps si possible ───
export function extractPlaceIdFromUrl(url: string): string | null {
  // Format direct : ?q=place_id:ChIJxxxxx
  const directMatch = url.match(/place_id:([A-Za-z0-9_-]+)/)
  if (directMatch) return directMatch[1]

  // Format avec data hex (CID en hex) : !1s0x:0xCID!
  // Pas directement utilisable comme place_id, mais on peut l'extraire pour l'API
  const hexCidMatch = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/)
  if (hexCidMatch) return hexCidMatch[1]

  return null
}

// ─── Extrait le nom d'établissement depuis une URL Google Maps ───
export function extractBusinessNameFromUrl(url: string): string | null {
  // Format : /maps/place/Le+Refuge+des+Pins/@...
  const match = url.match(/\/maps\/place\/([^/@]+)/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim()
  } catch {
    return null
  }
}

// ─── Recherche un lieu par texte (fallback si pas de place_id direct) ───
export async function searchPlaceByText(query: string, apiKey: string): Promise<string | null> {
  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Places searchText ${res.status}: ${text}`)
  }
  const data = await res.json() as { places?: Array<{ id: string }> }
  return data.places?.[0]?.id ?? null
}

// ─── Récupère les détails d'un lieu par son ID ───
export async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails> {
  const res = await fetch(`${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Places details ${res.status}: ${text}`)
  }
  return res.json() as Promise<PlaceDetails>
}

// ─── Orchestration : URL → Place Details ───
// Stratégie en cascade :
//   1. Résoudre les redirections (best effort)
//   2. Place ID direct → fetch
//   3. Nom extrait de l'URL → searchText
//   4. URL elle-même comme texte de recherche → searchText
//   5. Erreur claire si rien ne fonctionne
export async function fetchPlaceFromMapsUrl(rawUrl: string, apiKey: string): Promise<PlaceDetails> {
  const resolved = await resolveMapsUrl(rawUrl)

  // 1. place_id direct ?
  const directId = extractPlaceIdFromUrl(resolved)
  if (directId && directId.startsWith('ChIJ')) {
    return getPlaceDetails(directId, apiKey)
  }

  // 2. Nom extrait du path /maps/place/Nom ?
  const name = extractBusinessNameFromUrl(resolved)
  if (name) {
    const placeId = await searchPlaceByText(name, apiKey)
    if (placeId) return getPlaceDetails(placeId, apiKey)
  }

  // 3. Fallback : utilise l'URL elle-même comme texte de recherche
  //    Places API searchText est suffisamment robuste pour parser des URL
  //    et identifier le lieu correspondant dans la plupart des cas.
  try {
    const placeId = await searchPlaceByText(resolved, apiKey)
    if (placeId) return getPlaceDetails(placeId, apiKey)
  } catch {
    // ignore — on essaie un dernier fallback ci-dessous
  }

  // 4. Dernier recours : URL brute (cas où la résolution a échoué)
  if (resolved !== rawUrl) {
    try {
      const placeId = await searchPlaceByText(rawUrl, apiKey)
      if (placeId) return getPlaceDetails(placeId, apiKey)
    } catch {
      // ignore
    }
  }

  throw new Error(
    "Impossible de trouver l'établissement. " +
    "Va sur Google Maps, ouvre ta fiche, copie le lien depuis le bouton Partager, et réessaie. " +
    "Évite les liens raccourcis comme share.google si possible."
  )
}
