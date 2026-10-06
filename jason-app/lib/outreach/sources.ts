// Sources de contacts pour la prospection (29/09/2026).
//
// 1. Annuaire des entreprises (API Recherche d'entreprises, data.gouv.fr,
//    gratuite, sans clé) : entreprises actives par code d'activité (NAF) et
//    département. Donne nom, commune, SIREN, dirigeant, mais JAMAIS d'e-mail :
//    les contacts arrivent en « E-mail à trouver ».
// 2. Google Maps (Places API New, clé GOOGLE_PLACES_API_KEY déjà utilisée par
//    l'audit de fiche Google) : pros actifs avec leur site. Le champ site web
//    fait passer la requête en tarif « Enterprise » : 1 000 recherches
//    gratuites par mois, puis ~35 $ les 1 000 (relevé sept. 2026).
// 3. Site du pro : l'e-mail publié sur sa page d'accueil, contact ou mentions
//    légales.
// DATAtourisme (gîtes, chambres d'hôtes) passe par l'import CSV (csv.ts) :
// export CSV gratuit depuis l'explorateur (datatourisme.fr/explorer-les-donnees), sans compte.

import 'server-only'
import { bestEmail, extractEmails, type Audience } from './engine'
import { takePlacesCall } from '@/lib/google/places-budget'

export interface FoundContact {
  audience: Audience
  prenom?: string | null
  nom?: string | null
  entreprise?: string | null
  ville?: string | null
  departement?: string | null
  site_web?: string | null
  telephone?: string | null
  siren?: string | null
  email?: string | null
  source: 'sirene' | 'google'
  source_detail: string
}

/** Codes d'activité proposés par audience */
export const NAF_BY_AUDIENCE: Record<Audience, Array<{ code: string; label: string }>> = {
  photographe: [{ code: '74.20Z', label: 'Activités photographiques' }],
  menage: [
    { code: '81.21Z', label: 'Nettoyage courant des bâtiments' },
    { code: '81.22Z', label: 'Autres nettoyages des bâtiments' },
    { code: '81.29B', label: 'Autres activités de nettoyage' },
  ],
  hote: [
    { code: '55.20Z', label: 'Hébergement touristique et de courte durée' },
    { code: '55.30Z', label: 'Terrains de camping' },
  ],
  autre: [],
}

// ─── 1. Annuaire des entreprises ────────────────────────────────────────────

type SireneResult = {
  siren: string
  nom_complet?: string
  nom_raison_sociale?: string | null
  siege?: { libelle_commune?: string; code_postal?: string; departement?: string; activite_principale?: string }
  dirigeants?: Array<{ nom?: string; prenoms?: string; type_dirigeant?: string }>
  complements?: { est_entrepreneur_individuel?: boolean }
}

export async function searchSirene(opts: { audience: Audience; naf: string; departement: string; page?: number }): Promise<{ results: FoundContact[]; total: number; pages: number }> {
  const dep = opts.departement.trim().toUpperCase()
  if (!/^(\d{2,3}|2A|2B)$/.test(dep)) throw new Error('Département invalide (ex. 69, 2A, 974).')
  if (!/^\d{2}\.\d{2}[A-Z]$/.test(opts.naf)) throw new Error('Code d\'activité invalide.')
  const url = new URL('https://recherche-entreprises.api.gouv.fr/search')
  url.searchParams.set('activite_principale', opts.naf)
  url.searchParams.set('departement', dep)
  url.searchParams.set('etat_administratif', 'A')
  url.searchParams.set('per_page', '25')
  url.searchParams.set('page', String(Math.max(1, opts.page ?? 1)))
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(15_000) })
  if (res.status === 429) throw new Error('Trop de recherches d\'un coup : réessaie dans une minute.')
  if (!res.ok) throw new Error(`Annuaire des entreprises indisponible (${res.status}).`)
  const data = await res.json() as { results?: SireneResult[]; total_results?: number; total_pages?: number }
  const results = (data.results ?? []).map(r => {
    const d = (r.dirigeants ?? []).find(x => x.nom) ?? null
    const ei = !!r.complements?.est_entrepreneur_individuel
    const entreprise = (r.nom_raison_sociale || r.nom_complet || '').trim()
    return {
      audience: opts.audience,
      prenom: d?.prenoms?.split(/\s+/)[0] ?? null,
      nom: d?.nom ? `${d.prenoms?.split(/\s+/)[0] ?? ''} ${d.nom}`.trim() : entreprise,
      entreprise: ei ? null : entreprise || null,
      ville: r.siege?.libelle_commune ?? null,
      departement: r.siege?.departement ?? dep,
      siren: r.siren,
      source: 'sirene' as const,
      source_detail: `Annuaire des entreprises, ${opts.naf}, département ${dep}`,
    }
  })
  return { results, total: data.total_results ?? results.length, pages: data.total_pages ?? 1 }
}

// ─── 2. Google Maps ─────────────────────────────────────────────────────────

type Place = {
  displayName?: { text?: string }
  websiteUri?: string
  nationalPhoneNumber?: string
  addressComponents?: Array<{ longText?: string; types?: string[] }>
}

export async function searchGooglePlaces(opts: { audience: Audience; query: string; pageToken?: string }): Promise<{ results: FoundContact[]; nextPageToken: string | null }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('Clé Google absente (GOOGLE_PLACES_API_KEY).')
  const query = opts.query.trim()
  if (query.length < 3) throw new Error('Précise la recherche, ex. « photographe immobilier Lyon ».')
  // Jamais au-delà de la part gratuite de Google (lib/google/places-budget-rules.ts)
  await takePlacesCall('text_search_enterprise')
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.websiteUri,places.nationalPhoneNumber,places.addressComponents,nextPageToken',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'FR', pageSize: 20, ...(opts.pageToken ? { pageToken: opts.pageToken } : {}) }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Google Maps a refusé la recherche (${res.status}). Vérifie que « Places API (New) » est activée pour la clé.`)
  const data = await res.json() as { places?: Place[]; nextPageToken?: string }
  const results = (data.places ?? []).map(p => {
    const comp = (t: string) => p.addressComponents?.find(c => c.types?.includes(t))?.longText ?? null
    const cp = comp('postal_code')
    return {
      audience: opts.audience,
      nom: p.displayName?.text ?? null,
      entreprise: p.displayName?.text ?? null,
      ville: comp('locality'),
      departement: cp ? cp.slice(0, 2) : null,
      site_web: p.websiteUri ?? null,
      telephone: p.nationalPhoneNumber ?? null,
      source: 'google' as const,
      source_detail: `Google Maps : « ${query} »`,
    }
  })
  return { results, nextPageToken: data.nextPageToken ?? null }
}

// ─── 3. E-mail publié sur le site du pro ────────────────────────────────────

function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    if (!/^https?:$/.test(u.protocol)) return null
    // Pas d'adresse interne ni d'IP (la recherche part du serveur)
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[|0\.)/i.test(u.hostname) || /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) return null
    // Réseaux sociaux : pas d'e-mail lisible sans compte
    if (/(instagram|facebook|linkedin|tiktok)\.com$/i.test(u.hostname)) return null
    return u
  } catch { return null }
}

async function fetchPage(url: URL): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JasonMarinhoBot/1.0; +https://jasonmarinho.com)', Accept: 'text/html' },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(7_000),
    })
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) return ''
    const text = await res.text()
    return text.slice(0, 600_000)
  } catch { return '' }
}

/** Cherche une adresse e-mail sur la page d'accueil puis les pages contact et mentions légales. */
export async function findEmailOnSite(site: string): Promise<{ email: string | null; checked: number }> {
  const base = safeUrl(site)
  if (!base) return { email: null, checked: 0 }
  const home = await fetchPage(base)
  let emails = extractEmails(home)
  let checked = 1
  if (!emails.length) {
    // Liens « contact » trouvés sur l'accueil, puis chemins habituels
    const linked = Array.from(home.matchAll(/href=["']([^"'#]*(?:contact|mentions|legal|a-propos|about)[^"'#]*)["']/gi)).map(m => m[1])
    const candidates = Array.from(new Set([...linked, '/contact', '/contact/', '/nous-contacter', '/mentions-legales', '/mentions-legales/']))
    for (const path of candidates.slice(0, 5)) {
      let u: URL
      try { u = new URL(path, base) } catch { continue }
      if (u.hostname !== base.hostname) continue
      const html = await fetchPage(u)
      checked++
      emails = extractEmails(html)
      if (emails.length) break
    }
  }
  return { email: bestEmail(emails, base.toString()), checked }
}
