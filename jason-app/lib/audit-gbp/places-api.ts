// Client pour Google Places API (New).
// Documentation : https://developers.google.com/maps/documentation/places/web-service/place-details
//
// Sécurité : ce module ne s'exécute QUE côté serveur (server actions / route handlers).
// La clé API n'est jamais exposée au client.

import { takePlacesCall, PlacesBudgetError } from '@/lib/google/places-budget'

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
// Protection SSRF : un raccourcisseur Google (goo.gl / g.co) a historiquement
// pu pointer vers n'importe quelle URL. Plutôt que de laisser fetch suivre
// aveuglément les redirections (redirect: 'follow') vers une éventuelle IP
// interne, on les suit nous-mêmes (redirect: 'manual') et on refuse de
// contacter tout hôte qui n'appartient pas à Google.
const RESOLVE_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

function isGoogleFamilyHost(host: string): boolean {
  const h = host.toLowerCase()
  // Tout sous-domaine de google.<tld> (www., maps., consent., ...) plus les
  // raccourcisseurs Google connus.
  return /(^|\.)google\.[a-z.]{2,6}$/.test(h)
    || h === 'maps.app.goo.gl' || h === 'goo.gl' || h === 'g.co'
    || h === 'share.google' || h === 'g.page'
}

export async function resolveMapsUrl(url: string): Promise<string> {
  // Si c'est déjà une URL longue, retourne tel quel
  if (/google\.com\/maps/.test(url)) return url

  let current: string
  try {
    current = new URL(url).toString()
    if (!isGoogleFamilyHost(new URL(current).hostname)) return url
  } catch {
    return url
  }

  // Au plus 6 sauts, chacun validé comme hôte Google avant d'être suivi.
  for (let i = 0; i < 6; i++) {
    let res: Response
    try {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': RESOLVE_UA },
      })
    } catch {
      return url
    }
    // Pas une redirection : on a atteint l'URL finale.
    if (res.status < 300 || res.status >= 400) return current
    const loc = res.headers.get('location')
    if (!loc) return current
    let next: URL
    try {
      next = new URL(loc, current)
    } catch {
      return url
    }
    // Refuse tout saut hors HTTPS ou vers un hôte non-Google (anti-SSRF).
    if (next.protocol !== 'https:' || !isGoogleFamilyHost(next.hostname)) return url
    current = next.toString()
  }
  return current
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
// includedType (15/11/2026) : « lodging » pour ne chercher que parmi les
// hébergements. Sans lui, un nom courant renvoie un homonyme (l'audit public
// de « Casa do Pedreiro » tombait sur un magasin de matériaux).
export async function searchPlaceByText(query: string, apiKey: string, includedType?: string): Promise<string | null> {
  await takePlacesCall('text_search_ids')
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
      languageCode: 'fr',
      ...(includedType ? { includedType, strictTypeFiltering: true } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Places searchText ${res.status}: ${text}`)
  }
  const data = await res.json() as { places?: Array<{ id: string }> }
  return data.places?.[0]?.id ?? null
}

export interface PlaceCandidate { id: string; nom: string; adresse: string; categorie: string; hebergement: boolean }

// ─── Fiches candidates pour un nom (audit express public, 15/11/2026) ───
// Un nom seul désigne souvent plusieurs établissements : on rend jusqu'à 8
// fiches avec nom, adresse et catégorie, hébergements en premier, et l'hôte
// choisit la sienne. Un seul appel Google, quel que soit le nombre de fiches.
export async function searchPlaceCandidates(query: string, apiKey: string): Promise<PlaceCandidate[]> {
  await takePlacesCall('text_search_names')
  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.primaryType,places.primaryTypeDisplayName,places.types',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 12, languageCode: 'fr' }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Places searchText ${res.status}: ${text}`)
  }
  const data = await res.json() as { places?: Array<Pick<PlaceDetails, 'id' | 'displayName' | 'formattedAddress' | 'primaryType' | 'primaryTypeDisplayName' | 'types'>> }
  return rankCandidates(data.places ?? [])
}

const LODGING = /lodging|hotel|motel|hostel|guest_house|bed_and_breakfast|cottage|vacation|holiday|aparthotel|country_house|resort|camp|inn\b|villa|chalet/i

/** Hébergements d'abord (ordre de Google conservé dans chaque groupe), 8 au plus. Pur, testé. */
export function rankCandidates(places: Array<Pick<PlaceDetails, 'id' | 'displayName' | 'formattedAddress' | 'primaryType' | 'primaryTypeDisplayName' | 'types'>>): PlaceCandidate[] {
  const all = places.filter(p => p && typeof p.id === 'string' && p.id).map(p => ({
    id: p.id,
    nom: p.displayName?.text ?? '',
    adresse: p.formattedAddress ?? '',
    categorie: p.primaryTypeDisplayName?.text ?? '',
    hebergement: LODGING.test(`${p.primaryType ?? ''} ${(p.types ?? []).join(' ')}`),
  }))
  return [...all.filter(c => c.hebergement), ...all.filter(c => !c.hebergement)].slice(0, 8)
}

// ─── Récupère les détails d'un lieu par son ID ───
export async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetails> {
  await takePlacesCall('place_details_atmosphere')
  // languageCode=fr : nom de la catégorie en français (« Location de vacances », pas « Vacation rental »)
  const res = await fetch(`${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}?languageCode=fr`, {
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
  } catch (e) {
    // Plafond gratuit atteint : on s'arrête là (sinon : dernier essai ci-dessous)
    if (e instanceof PlacesBudgetError) throw e
  }

  // 4. Dernier recours : URL brute (cas où la résolution a échoué)
  if (resolved !== rawUrl) {
    try {
      const placeId = await searchPlaceByText(rawUrl, apiKey)
      if (placeId) return getPlaceDetails(placeId, apiKey)
    } catch (e) {
      if (e instanceof PlacesBudgetError) throw e
    }
  }

  throw new Error(
    "Impossible de trouver l'établissement. " +
    "Va sur Google Maps, ouvre ta fiche, et copie l'URL longue depuis la barre d'adresse " +
    "(elle commence par https://www.google.com/maps/place/...). " +
    "N'utilise pas le bouton Partager : il génère un lien raccourci non supporté."
  )
}
